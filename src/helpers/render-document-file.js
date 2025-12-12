/* eslint-disable no-await-in-loop */
/* eslint-disable no-case-declarations */
import { fragment } from 'xmlbuilder2';
import * as lruCache from 'lru-cache';
import { cloneDeep } from 'lodash';

import createHTMLToVDOM from './html-parser';
import { VNode, isVNode, isVText } from '../vdom/index';
import * as xmlBuilder from './xml-builder';
import namespaces from '../namespaces';
import { defaultDocumentOptions } from '../constants';
import { buildImage } from '../utils/image';
import { vNodeHasChildren } from '../utils/vnode';
import { buildSVGElement } from '../utils/svg';

const LRUCache = lruCache.default || lruCache.LRUCache || lruCache; // Support both ESM and CommonJS imports

const convertHTML = createHTMLToVDOM();

// Helper function to add lineRule attribute for image consistency
const addLineRuleToImageFragment = (imageFragment) => {
  imageFragment
    .first()
    .first()
    .att('http://schemas.openxmlformats.org/wordprocessingml/2006/main', 'lineRule', 'auto');
};

// Function to clear the image cache (useful for testing or memory management)
// Now requires docxDocumentInstance parameter for per-document isolation
export const clearImageCache = (docxDocumentInstance) => {
  if (!docxDocumentInstance || !docxDocumentInstance._imageCache) {
    return 0;
  }
  const cacheSize = docxDocumentInstance._imageCache.size;
  docxDocumentInstance._imageCache.clear();
  // Reset retry stats
  docxDocumentInstance._retryStats = {
    totalAttempts: 0,
    successAfterRetry: 0,
    finalFailures: 0,
  };
  return cacheSize;
};

// Function to get cache statistics
// Now requires docxDocumentInstance parameter for per-document isolation
export const getImageCacheStats = (docxDocumentInstance) => {
  if (!docxDocumentInstance || !docxDocumentInstance._imageCache) {
    return {
      size: 0,
      urls: [],
      successCount: 0,
      failureCount: 0,
      retryStats: { totalAttempts: 0, successAfterRetry: 0, finalFailures: 0 },
    };
  }

  // Calculate statistics in a single pass to avoid race conditions
  const cacheValues = Array.from(docxDocumentInstance._imageCache.values());
  let successCount = 0;
  let failureCount = 0;

  cacheValues.forEach((value) => {
    if (value === 'FAILED' || value === null) {
      failureCount += 1;
    } else {
      successCount += 1;
    }
  });

  return {
    size: docxDocumentInstance._imageCache.size,
    urls: Array.from(docxDocumentInstance._imageCache.keys()),
    successCount,
    failureCount,
    retryStats: docxDocumentInstance._retryStats,
  };
};

export const buildList = async (vNode, docxDocumentInstance, xmlFragment) => {
  const listElements = [];

  let vNodeObjects = [
    {
      node: vNode,
      level: 0,
      type: vNode.tagName,
      numberingId: docxDocumentInstance.createNumbering(vNode.tagName, vNode.properties),
    },
  ];
  while (vNodeObjects.length) {
    const tempVNodeObject = vNodeObjects.shift();

    const parentVNodeProperties = tempVNodeObject.node.properties;

    if (
      isVText(tempVNodeObject.node) ||
      (isVNode(tempVNodeObject.node) && !['ul', 'ol', 'li'].includes(tempVNodeObject.node.tagName))
    ) {
      const paragraphFragment = await xmlBuilder.buildParagraph(
        tempVNodeObject.node,
        {
          numbering: { levelId: tempVNodeObject.level, numberingId: tempVNodeObject.numberingId },
        },
        docxDocumentInstance
      );

      xmlFragment.import(paragraphFragment);
    }

    if (
      tempVNodeObject.node.children &&
      tempVNodeObject.node.children.length &&
      ['ul', 'ol', 'li'].includes(tempVNodeObject.node.tagName)
    ) {
      const tempVNodeObjects = tempVNodeObject.node.children.reduce((accumulator, childVNode) => {
        if (['ul', 'ol'].includes(childVNode.tagName)) {
          accumulator.push({
            node: childVNode,
            level: tempVNodeObject.level + 1,
            type: childVNode.tagName,
            numberingId: docxDocumentInstance.createNumbering(
              childVNode.tagName,
              childVNode.properties
            ),
          });
        } else {
          // eslint-disable-next-line no-lonely-if
          if (
            accumulator.length > 0 &&
            isVNode(accumulator[accumulator.length - 1].node) &&
            accumulator[accumulator.length - 1].node.tagName.toLowerCase() === 'p'
          ) {
            accumulator[accumulator.length - 1].node.children.push(childVNode);
          } else {
            const properties = {
              attributes: {
                ...(parentVNodeProperties?.attributes || {}),
                ...(childVNode?.properties?.attributes || {}),
              },
              style: {
                ...(parentVNodeProperties?.style || {}),
                ...(childVNode?.properties?.style || {}),
              },
            };
            const paragraphVNode = new VNode(
              'p',
              properties, // copy properties for styling purposes
              // eslint-disable-next-line no-nested-ternary
              isVText(childVNode)
                ? [childVNode]
                : // eslint-disable-next-line no-nested-ternary
                isVNode(childVNode)
                ? childVNode.tagName.toLowerCase() === 'li'
                  ? [...childVNode.children]
                  : [childVNode]
                : []
            );

            childVNode.properties = { ...cloneDeep(properties), ...childVNode.properties };

            const generatedNode = isVNode(childVNode)
              ? // eslint-disable-next-line prettier/prettier, no-nested-ternary
                childVNode.tagName.toLowerCase() === 'li'
                ? childVNode
                : childVNode.tagName.toLowerCase() !== 'p'
                ? paragraphVNode
                : childVNode
              : // eslint-disable-next-line prettier/prettier
                paragraphVNode;

            accumulator.push({
              // eslint-disable-next-line prettier/prettier, no-nested-ternary
              node: generatedNode,
              level: tempVNodeObject.level,
              type: tempVNodeObject.type,
              numberingId: tempVNodeObject.numberingId,
            });
          }
        }

        return accumulator;
      }, []);
      vNodeObjects = tempVNodeObjects.concat(vNodeObjects);
    }
  }

  return listElements;
};

async function findXMLEquivalent(docxDocumentInstance, vNode, xmlFragment, imageOptions = null) {
  // Use default options if not provided
  if (!imageOptions) {
    imageOptions = docxDocumentInstance.imageProcessing || defaultDocumentOptions.imageProcessing;
  }
  if (
    vNode.tagName === 'div' &&
    (vNode.properties.attributes.class === 'page-break' ||
      (vNode.properties.style && vNode.properties.style['page-break-after']))
  ) {
    const paragraphFragment = fragment({ namespaceAlias: { w: namespaces.w } })
      .ele('@w', 'p')
      .ele('@w', 'r')
      .ele('@w', 'br')
      .att('@w', 'type', 'page')
      .up()
      .up()
      .up();

    xmlFragment.import(paragraphFragment);
    return;
  }

  switch (vNode.tagName) {
    case 'h1':
    case 'h2':
    case 'h3':
    case 'h4':
    case 'h5':
    case 'h6':
      const headingFragment = await xmlBuilder.buildParagraph(
        vNode,
        {
          paragraphStyle: `Heading${vNode.tagName[1]}`,
        },
        docxDocumentInstance
      );
      xmlFragment.import(headingFragment);
      return;
    case 'span':
    case 'strong':
    case 'b':
    case 'em':
    case 'i':
    case 'u':
    case 'ins':
    case 'strike':
    case 'del':
    case 's':
    case 'sub':
    case 'sup':
    case 'mark':
    case 'p':
    case 'a':
    case 'blockquote':
    case 'code':
    case 'pre':
      const paragraphFragment = await xmlBuilder.buildParagraph(vNode, {}, docxDocumentInstance);
      xmlFragment.import(paragraphFragment);
      return;
    case 'figure':
      if (vNodeHasChildren(vNode)) {
        // eslint-disable-next-line no-plusplus
        for (let index = 0; index < vNode.children.length; index++) {
          const childVNode = vNode.children[index];
          if (childVNode.tagName === 'table') {
            const tableFragment = await xmlBuilder.buildTable(
              childVNode,
              {
                maximumWidth: docxDocumentInstance.availableDocumentSpace,
                rowCantSplit: docxDocumentInstance.tableRowCantSplit,
              },
              docxDocumentInstance
            );
            xmlFragment.import(tableFragment);
            // Adding empty paragraph for space after table only if the option is enabled
            if (docxDocumentInstance.addSpacingAfterTable) {
              const emptyParagraphFragment = await xmlBuilder.buildParagraph(null, {});
              xmlFragment.import(emptyParagraphFragment);
            }
          } else if (childVNode.tagName === 'img') {
            const imageFragment = await buildImage(
              docxDocumentInstance,
              childVNode,
              null,
              imageOptions
            );
            if (imageFragment) {
              // Add lineRule attribute for consistency
              // Direct image processing includes this attribute, but HTML image processing was missing it
              // This ensures both processing paths generate identical XML structure
              addLineRuleToImageFragment(imageFragment);
              xmlFragment.import(imageFragment);
            } else {
              // eslint-disable-next-line no-console
              console.log(
                `[DEBUG] findXMLEquivalent: buildImage returned null/undefined in figure`
              );
            }
          }
        }
      }
      return;
    case 'table':
      const tableFragment = await xmlBuilder.buildTable(
        vNode,
        {
          maximumWidth: docxDocumentInstance.availableDocumentSpace,
          rowCantSplit: docxDocumentInstance.tableRowCantSplit,
        },
        docxDocumentInstance
      );
      xmlFragment.import(tableFragment);
      // Adding empty paragraph for space after table only if the option is enabled
      if (docxDocumentInstance.addSpacingAfterTable) {
        const emptyParagraphFragment = await xmlBuilder.buildParagraph(null, {});
        xmlFragment.import(emptyParagraphFragment);
      }
      return;
    case 'ol':
    case 'ul':
      await buildList(vNode, docxDocumentInstance, xmlFragment);
      return;
    case 'img':
      const imageFragment = await buildImage(docxDocumentInstance, vNode, null, imageOptions);
      if (imageFragment) {
        // Add lineRule attribute for consistency
        // Direct image processing includes this attribute, but HTML image processing was missing it
        // This ensures both processing paths generate identical XML structure
        addLineRuleToImageFragment(imageFragment);
        xmlFragment.import(imageFragment);
      } else {
        // eslint-disable-next-line no-console
        console.log(`[DEBUG] findXMLEquivalent: buildImage returned null/undefined`);
      }
      return;
    case 'svg':
      const svgFragment = await buildSVGElement(docxDocumentInstance, vNode, null, imageOptions);
      if (svgFragment) {
        // Add lineRule attribute for consistency
        addLineRuleToImageFragment(svgFragment);
        xmlFragment.import(svgFragment);
      } else {
        // eslint-disable-next-line no-console
        console.log(`[DEBUG] findXMLEquivalent: buildSVGElement returned null/undefined`);
      }
      return;
    case 'br':
      const linebreakFragment = await xmlBuilder.buildParagraph(null, {});
      xmlFragment.import(linebreakFragment);
      return;
    case 'head':
      return;
  }
  if (vNodeHasChildren(vNode)) {
    // eslint-disable-next-line no-plusplus
    for (let index = 0; index < vNode.children.length; index++) {
      const childVNode = vNode.children[index];
      // eslint-disable-next-line no-use-before-define
      await convertVTreeToXML(docxDocumentInstance, childVNode, xmlFragment, imageOptions);
    }
  }
}

// eslint-disable-next-line consistent-return
export async function convertVTreeToXML(
  docxDocumentInstance,
  vTree,
  xmlFragment,
  imageOptions = null
) {
  // Use default options if not provided
  if (!imageOptions) {
    imageOptions = docxDocumentInstance.imageProcessing || defaultDocumentOptions.imageProcessing;
  }
  if (!vTree) {
    // eslint-disable-next-line no-useless-return
    return '';
  }
  if (Array.isArray(vTree) && vTree.length) {
    // eslint-disable-next-line no-plusplus
    for (let index = 0; index < vTree.length; index++) {
      const vNode = vTree[index];
      await convertVTreeToXML(docxDocumentInstance, vNode, xmlFragment, imageOptions);
    }
  } else if (isVNode(vTree)) {
    await findXMLEquivalent(docxDocumentInstance, vTree, xmlFragment, imageOptions);
  } else if (isVText(vTree)) {
    const paragraphFragment = await xmlBuilder.buildParagraph(vTree, {}, docxDocumentInstance);
    xmlFragment.import(paragraphFragment);
  }
  return xmlFragment;
}

/**
 * Renders a DOCX document by converting HTML to XML and applying inherited properties
 * @param {Object} docxDocumentInstance - The document instance containing HTML string and metadata
 * @param {Object} properties - Style properties to inherit from parent elements (e.g., text-align, color, etc.)
 *                              These properties are applied to all child elements but can be overridden by explicit styles
 * @returns {Promise<Object>} XML fragment representing the rendered document content
 */
async function renderDocumentFile(docxDocumentInstance, properties = {}) {
  // Get image processing options from document instance with centralized defaults
  const imageOptions =
    docxDocumentInstance.imageProcessing || defaultDocumentOptions.imageProcessing;

  // Initialize per-document LRU image cache and retry stats for isolation
  // LRU cache prevents OOM by limiting total memory usage and evicting least recently used items
  if (!docxDocumentInstance._imageCache) {
    const maxCacheSize =
      imageOptions.maxCacheSize || defaultDocumentOptions.imageProcessing.maxCacheSize;
    const maxCacheEntries =
      imageOptions.maxCacheEntries || defaultDocumentOptions.imageProcessing.maxCacheEntries;

    docxDocumentInstance._imageCache = new LRUCache({
      max: maxCacheEntries, // Max number of unique images
      maxSize: maxCacheSize, // Max total size in bytes
      sizeCalculation: (value) => {
        if (!value || value === 'FAILED') return 1; // Minimum size for failed entries
        // Calculate approximate byte size of base64 string
        // Base64 encoding is ~4/3 of original size, so decoded size is ~3/4
        return Math.ceil((value.length * 3) / 4);
      },
    });

    docxDocumentInstance._retryStats = {
      totalAttempts: 0,
      successAfterRetry: 0,
      finalFailures: 0,
    };

    if (imageOptions.verboseLogging) {
      // eslint-disable-next-line no-console
      console.log(
        `[CACHE] Initialized LRU cache: ${maxCacheEntries} entries, ${Math.round(
          maxCacheSize / 1024 / 1024
        )}MB max`
      );
    }
  }

  const vTree = convertHTML(docxDocumentInstance.htmlString);

  if (!vTree) {
    throw new Error('Failed to convert HTML to VDOM tree. No VTree generated.');
  }

  if (Array.isArray(vTree)) {
    // Apply inherited properties from parent elements to child elements
    // Properties object contains CSS-style properties that should be inherited (e.g., alignment, fonts)
    // This enables proper formatting when content is injected into existing document structure
    for (const child of vTree) {
      // Validate properties object and ensure child.properties.style exists
      if (properties && typeof properties === 'object' && child.properties) {
        // Initialize style object if it doesn't exist
        if (!child.properties.style) {
          child.properties.style = {};
        }
        // Merge inherited properties with explicit child properties (child properties take precedence)
        child.properties.style = { ...properties, ...child.properties.style };
      }
    }
  } else {
    // Handle single VTree node (not an array)
    if (properties && typeof properties === 'object' && vTree.properties) {
      if (!vTree.properties.style) {
        vTree.properties.style = {};
      }
      vTree.properties.style = { ...properties, ...vTree.properties.style };
    }
  }

  const xmlFragment = fragment({ namespaceAlias: { w: namespaces.w } });

  const populatedXmlFragment = await convertVTreeToXML(
    docxDocumentInstance,
    vTree,
    xmlFragment,
    imageOptions
  );

  // Log cache statistics at the end of document generation
  const cacheStats = getImageCacheStats(docxDocumentInstance);
  if (
    (cacheStats.size > 0 || cacheStats.retryStats.totalAttempts > 0) &&
    imageOptions.verboseLogging
  ) {
    // eslint-disable-next-line no-console
    console.log(`[CACHE] Image processing statistics:`, {
      totalImages: cacheStats.size,
      successful: cacheStats.successCount,
      failed: cacheStats.failureCount,
      cacheHitRatio:
        cacheStats.size > 1 ? 'Cache prevented duplicate downloads' : 'No duplicates found',
      retries: {
        totalAttempts: cacheStats.retryStats.totalAttempts,
        successAfterRetry: cacheStats.retryStats.successAfterRetry,
        finalFailures: cacheStats.retryStats.finalFailures,
      },
    });
  }

  return populatedXmlFragment;
}

export default renderDocumentFile;
