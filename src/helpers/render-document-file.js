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

/**
 * Helper that walks the children of an <li> and bucket-sorts them into three
 * arrays: direct <p> paragraphs, nested <ul>/<ol> lists, and any remaining
 * inline-ish content (text nodes, span/strong/em, etc.).
 *
 * Why this exists: prior to issue #145, an <li> with multiple <p> children
 * collapsed into a single paragraph in the DOCX. Splitting the children by
 * role lets the outer buildList loop emit:
 *   - the first <p> as the bulleted/numbered paragraph,
 *   - subsequent <p>s as continuation paragraphs (indented, no number),
 *   - nested lists as a new level pushed back onto the processing queue,
 *   - other inline content folded into a regular wrapper paragraph.
 *
 * Divs are recursed into so structures like
 *   <li><div><p>A</p><p>B</p></div></li>
 * still surface both paragraphs.
 */
const separateListItemContent = (liNode) => {
  if (!isVNode(liNode)) {
    return { blockElements: [], nestedLists: [], otherContent: [] };
  }

  const blockElements = [];
  const nestedLists = [];
  const otherContent = [];

  // Block-level elements that should be treated as separate paragraphs in DOCX
  const blockLevelTags = [
    'p',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'blockquote',
    'pre',
    'code',
    'hr',
    'table',
    'dl',
  ];

  const processNode = (node) => {
    if (!isVNode(node)) {
      // Text nodes go to other content
      if (node && node.text) {
        otherContent.push(node);
      }
      return;
    }

    const tagName = node.tagName.toLowerCase();

    if (blockLevelTags.includes(tagName)) {
      blockElements.push(node);
    } else if (['ul', 'ol'].includes(tagName)) {
      nestedLists.push(node);
    } else if (tagName === 'div') {
      // Recurse into divs to extract nested content. Defensive against
      // malformed vDOM where children is missing or not iterable.
      if (Array.isArray(node.children)) {
        node.children.forEach(processNode);
      }
    } else {
      // Other inline elements (span, strong, em, etc.)
      otherContent.push(node);
    }
  };

  if (Array.isArray(liNode.children)) {
    liNode.children.forEach(processNode);
  }

  return { blockElements, nestedLists, otherContent };
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
      // `isContinuation` tells buildParagraph whether to draw the bullet/number
      // marker. The first paragraph inside an <li> gets the numbering element;
      // any subsequent block elements in that same <li> (issue #145) are
      // continuation paragraphs — same indentation, no marker. `indentLevel`
      // carries the nesting depth so the continuation lines up under the bullet
      // rather than sliding back to the margin.
      const paragraphFragment = await xmlBuilder.buildParagraph(
        tempVNodeObject.node,
        {
          numbering: { levelId: tempVNodeObject.level, numberingId: tempVNodeObject.numberingId },
          isContinuation: tempVNodeObject.isContinuation || false,
          indentLevel: tempVNodeObject.indentLevel,
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
            accumulator[accumulator.length - 1].node.tagName.toLowerCase() === 'p' &&
            // Don't merge list items - they need to be processed independently (issue #145)
            !(isVNode(childVNode) && childVNode.tagName.toLowerCase() === 'li')
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

            // Issue #145 — multi-paragraph list items.
            //
            // Before this fix, an <li> with more than one block-level child
            // (e.g. <li><p>A</p><p>B</p></li>) was collapsed into a single
            // paragraph, and only "A" appeared in the DOCX output. Word's
            // own behavior is to render the first block with the bullet/number
            // and each subsequent block as a "continuation" paragraph — same
            // indent, no marker.
            //
            // To produce that, we walk the <li>'s children once with
            // separateListItemContent() and bucket them into:
            //   - blockElements: each one becomes its own paragraph. The
            //     first inherits this list item's numberingId (gets a marker);
            //     the rest get isContinuation=true (no marker, just indent).
            //   - nestedLists:   pushed back onto the queue at level+1, so a
            //     fresh numberingId is allocated and bullets render correctly.
            //   - otherContent:  inline content that wasn't wrapped in a block
            //     element. Falls back to the legacy "wrap the whole <li>"
            //     path so inline-only list items still work.
            if (isVNode(childVNode) && childVNode.tagName.toLowerCase() === 'li') {
              const { blockElements, nestedLists, otherContent } =
                separateListItemContent(childVNode);

              // Process block elements (with continuation support)
              if (blockElements.length > 0) {
                blockElements.forEach((blockNode, index) => {
                  const isFirstBlock = index === 0;
                  const blockProperties = {
                    attributes: {
                      ...properties.attributes,
                      ...(blockNode?.properties?.attributes || {}),
                    },
                    style: {
                      ...properties.style,
                      ...(blockNode?.properties?.style || {}),
                    },
                  };

                  blockNode.properties = {
                    ...cloneDeep(blockProperties),
                    ...blockNode.properties,
                  };

                  accumulator.push({
                    node: blockNode,
                    level: tempVNodeObject.level,
                    type: tempVNodeObject.type,
                    numberingId: isFirstBlock ? tempVNodeObject.numberingId : null,
                    isContinuation: !isFirstBlock,
                    indentLevel: tempVNodeObject.level,
                  });
                });
              }

              // Process nested lists (add back to processing queue)
              nestedLists.forEach((listNode) => {
                accumulator.push({
                  node: listNode,
                  level: tempVNodeObject.level + 1,
                  type: listNode.tagName,
                  numberingId: docxDocumentInstance.createNumbering(
                    listNode.tagName,
                    listNode.properties
                  ),
                });
              });

              // Process other content (wrap in paragraph if needed).
              //
              // Bug fix: when an <li> has BOTH otherContent and nestedLists
              // (e.g. <li>Black tea <ol>...</ol></li>), pushing the original
              // childVNode here re-enqueues the entire <li>, including its
              // nested <ol> child — which we already pushed above. That
              // caused the nested list to be processed twice (and items at
              // deeper nesting levels to be duplicated exponentially).
              //
              // Clone the <li>, strip its block/list children, and push only
              // the otherContent shell so the inline text renders once.
              if (otherContent.length > 0 && blockElements.length === 0) {
                const liShell = cloneDeep(childVNode);
                liShell.children = otherContent;
                liShell.properties = { ...cloneDeep(properties), ...childVNode.properties };

                accumulator.push({
                  node: liShell,
                  level: tempVNodeObject.level,
                  type: tempVNodeObject.type,
                  numberingId: tempVNodeObject.numberingId,
                });
              }
            } else {
              // Not an <li> tag: use original processing logic
              const paragraphVNode = new VNode(
                'p',
                properties, // copy properties for styling purposes
                // eslint-disable-next-line no-nested-ternary
                isVText(childVNode) ? [childVNode] : isVNode(childVNode) ? [childVNode] : []
              );

              childVNode.properties = { ...cloneDeep(properties), ...childVNode.properties };

              const generatedNode = isVNode(childVNode)
                ? childVNode.tagName.toLowerCase() !== 'p'
                  ? paragraphVNode
                  : childVNode
                : paragraphVNode;

              accumulator.push({
                node: generatedNode,
                level: tempVNodeObject.level,
                type: tempVNodeObject.type,
                numberingId: tempVNodeObject.numberingId,
              });
            }
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
  if (vNode.tagName === 'div') {
    const divAttributes = vNode.properties.attributes || {};

    // Legacy backward compat: <div class="page-break"> — keep existing behavior exactly
    if (divAttributes.class === 'page-break') {
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

    const style = vNode.properties.style || {};
    const hasBreakBefore = style['page-break-before'] === 'always';
    // Accept any truthy value for backward compatibility
    const hasBreakAfter = !!style['page-break-after'];

    if (hasBreakBefore || hasBreakAfter) {
      // page-break-before: insert empty paragraph with <w:pageBreakBefore/>
      if (hasBreakBefore) {
        const pbFragment = fragment({ namespaceAlias: { w: namespaces.w } })
          .ele('@w', 'p')
          .ele('@w', 'pPr')
          .ele('@w', 'pageBreakBefore')
          .up()
          .up()
          .up();
        xmlFragment.import(pbFragment);
      }

      // Process children normally (no content loss)
      if (vNodeHasChildren(vNode)) {
        // eslint-disable-next-line no-plusplus
        for (let index = 0; index < vNode.children.length; index++) {
          const childVNode = vNode.children[index];
          // eslint-disable-next-line no-use-before-define
          await convertVTreeToXML(docxDocumentInstance, childVNode, xmlFragment, imageOptions);
        }
      }

      // page-break-after: append empty paragraph with break run
      if (hasBreakAfter) {
        const paFragment = fragment({ namespaceAlias: { w: namespaces.w } })
          .ele('@w', 'p')
          .ele('@w', 'r')
          .ele('@w', 'br')
          .att('@w', 'type', 'page')
          .up()
          .up()
          .up();
        xmlFragment.import(paFragment);
      }

      return;
    }
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
    vTree.forEach((child) => {
      // Validate properties object and ensure child.properties.style exists
      if (properties && typeof properties === 'object' && child.properties) {
        // Initialize style object if it doesn't exist
        if (!child.properties.style) {
          child.properties.style = {};
        }
        // Merge inherited properties with explicit child properties (child properties take precedence)
        child.properties.style = { ...properties, ...child.properties.style };
      }
    });
  } else if (properties && typeof properties === 'object' && vTree.properties) {
    // Handle single VTree node (not an array)
    if (!vTree.properties.style) {
      vTree.properties.style = {};
    }
    vTree.properties.style = { ...properties, ...vTree.properties.style };
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
