/* eslint-disable no-await-in-loop */
/* eslint-disable no-case-declarations */
import { fragment } from 'xmlbuilder2';
import sizeOf from 'image-size';
import * as lruCache from 'lru-cache';
const LRUCache = lruCache.default || lruCache.LRUCache || lruCache; // Support both ESM and CommonJS imports

// FIXME: remove the cyclic dependency
// eslint-disable-next-line import/no-cycle
import { cloneDeep } from 'lodash';
import createHTMLToVDOM from './html-parser';
import { VNode, isVNode, isVText } from '../vdom/index';
import * as xmlBuilder from './xml-builder';
import namespaces from '../namespaces';
import { imageType, internalRelationship, defaultDocumentOptions } from '../constants';
import { vNodeHasChildren } from '../utils/vnode';
import { isValidUrl } from '../utils/url';
import { downloadAndCacheImage } from '../utils/image';

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


// eslint-disable-next-line consistent-return, no-shadow
export const buildImage = async (
  docxDocumentInstance,
  vNode,
  maximumWidth = null,
  options = {}
) => {
  let response = null;
  let base64Uri = null;

  try {
    const imageSource = vNode.properties.src;

    // Handle external URLs with caching and retry
    if (isValidUrl(imageSource)) {
      base64Uri = await downloadAndCacheImage(docxDocumentInstance, imageSource, options);
      if (!base64Uri) {
        return null;
      }
      // Update vNode to reflect the cached data URL for subsequent processing
      vNode.properties.src = base64Uri;
    } else {
      base64Uri = decodeURIComponent(vNode.properties.src);
    }

    if (base64Uri) {
      response = await docxDocumentInstance.createMediaFile(base64Uri);
    } else {
      // eslint-disable-next-line no-console
      console.error(`[ERROR] buildImage: No valid base64Uri generated`);
      return null;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`[ERROR] buildImage: Error during image processing:`, error);
    return null;
  }

  if (response) {
    try {
      // Validate response has required properties
      if (!response.fileContent || !response.fileNameWithExtension) {
        // eslint-disable-next-line no-console
        console.error(
          `[ERROR] buildImage: Invalid response object for ${vNode.properties.src}:`,
          response
        );
        return null;
      }

      const imageBuffer = Buffer.from(response.fileContent, 'base64');

      docxDocumentInstance.zip
        .folder('word')
        .folder('media')
        .file(response.fileNameWithExtension, imageBuffer, {
          createFolders: false,
        });

      const documentRelsId = docxDocumentInstance.createDocumentRelationships(
        docxDocumentInstance.relationshipFilename,
        imageType,
        `media/${response.fileNameWithExtension}`,
        internalRelationship
      );

      // Add validation before calling sizeOf
      if (!imageBuffer || imageBuffer.length === 0) {
        // eslint-disable-next-line no-console
        console.error(`[ERROR] buildImage: Empty image buffer for ${vNode.properties.src}`);
        return null;
      }

      // Check if we got HTML instead of image data (common with Wikimedia errors)
      const firstBytes = imageBuffer.slice(0, 20).toString('utf8');
      if (firstBytes.startsWith('<!DOCTYPE') || firstBytes.startsWith('<html')) {
        // eslint-disable-next-line no-console
        console.error(
          `[ERROR] buildImage: Received HTML instead of image data for ${vNode.properties.src}`
        );
        return null;
      }

      let imageProperties;
      try {
        imageProperties = sizeOf(imageBuffer);
        if (!imageProperties || !imageProperties.width || !imageProperties.height) {
          // eslint-disable-next-line no-console
          console.error(
            `[ERROR] buildImage: Invalid image properties for ${vNode.properties.src}:`,
            imageProperties
          );
          return null;
        }
      } catch (sizeError) {
        // eslint-disable-next-line no-console
        console.error(
          `[ERROR] buildImage: sizeOf failed for ${vNode.properties.src}:`,
          sizeError.message
        );
        return null;
      }

      const imageFragment = await xmlBuilder.buildParagraph(
        vNode,
        {
          type: 'picture',
          inlineOrAnchored: true,
          relationshipId: documentRelsId,
          ...response,
          description: vNode.properties.alt,
          maximumWidth: maximumWidth || docxDocumentInstance.availableDocumentSpace,
          originalWidth: imageProperties.width,
          originalHeight: imageProperties.height,
        },
        docxDocumentInstance
      );

      return imageFragment;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`[ERROR] buildImage: Error during XML generation:`, error);
      return null;
    }
  } else {
    // eslint-disable-next-line no-console
    console.error(`[ERROR] buildImage: No response from createMediaFile`);
    return null;
  }
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
        // In lru-cache v10+, sizeCalculation must return a positive integer
        // We should never store null/invalid values, but handle defensively
        if (!value || typeof value !== 'string' || value.length === 0) {
          throw new Error('Invalid cache value: sizeCalculation requires non-empty string');
        }
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
