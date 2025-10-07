/* eslint-disable no-await-in-loop */
/* eslint-disable no-case-declarations */
import { fragment } from 'xmlbuilder2';
import VNode from 'virtual-dom/vnode/vnode';
import VText from 'virtual-dom/vnode/vtext';
import isVNode from 'virtual-dom/vnode/is-vnode';
import isVText from 'virtual-dom/vnode/is-vtext';
// eslint-disable-next-line import/no-named-default
import { default as HTMLToVDOM } from 'html-to-vdom';
import sizeOf from 'image-size';
import imageToBase64 from 'image-to-base64';

// FIXME: remove the cyclic dependency
// eslint-disable-next-line import/no-cycle
import { cloneDeep } from 'lodash';
import * as xmlBuilder from './xml-builder';
import namespaces from '../namespaces';
import { imageType, internalRelationship } from '../constants';
import { vNodeHasChildren } from '../utils/vnode';
import { isValidUrl } from '../utils/url';
import { getMimeType } from '../utils/image';

const convertHTML = HTMLToVDOM({
  VNode,
  VText,
});

// eslint-disable-next-line consistent-return, no-shadow
export const buildImage = async (docxDocumentInstance, vNode, maximumWidth = null) => {
  let response = null;
  let base64Uri = null;
  try {
    const imageSource = vNode.properties.src;
    if (isValidUrl(imageSource)) {
      const base64String = await imageToBase64(imageSource).catch((error) => {
        // eslint-disable-next-line no-console
        console.warn(`skipping image download and conversion due to ${error}`);
        return null;
      });

      if (base64String) {
        const mimeType = getMimeType(imageSource, base64String);
        base64Uri = `data:${mimeType};base64, ${base64String}`;
      } else {
        console.error(`[ERROR] buildImage: Failed to convert URL to base64`);
      }
    } else {
      base64Uri = decodeURIComponent(vNode.properties.src);
    }

    if (base64Uri) {
      response = docxDocumentInstance.createMediaFile(base64Uri);
    } else {
      console.error(`[ERROR] buildImage: No valid base64Uri generated`);
      return null;
    }
  } catch (error) {
    console.error(`[ERROR] buildImage: Error during image processing:`, error);
    return null;
  }

  if (response) {
    try {
      docxDocumentInstance.zip
        .folder('word')
        .folder('media')
        .file(response.fileNameWithExtension, Buffer.from(response.fileContent, 'base64'), {
          createFolders: false,
        });

      const documentRelsId = docxDocumentInstance.createDocumentRelationships(
        docxDocumentInstance.relationshipFilename,
        imageType,
        `media/${response.fileNameWithExtension}`,
        internalRelationship
      );

      const imageBuffer = Buffer.from(response.fileContent, 'base64');
      const imageProperties = sizeOf(imageBuffer);

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
      console.error(`[ERROR] buildImage: Error during XML generation:`, error);
      return null;
    }
  } else {
    console.error(`[ERROR] buildImage: No response from createMediaFile`);
    return null;
  }
};

export const buildList = async (vNode, docxDocumentInstance, xmlFragment) => {
  const listElements = [];

  // Build complete inheritance chain for list container with null safety
  let listAncestorStyles = {};
  if (vNode && isVNode(vNode) && vNode.parent) {
    try {
      let currentNode = vNode.parent;
      const ancestorChain = [];

      while (currentNode && ancestorChain.length < 20) {
        // Prevent infinite loops
        ancestorChain.unshift(currentNode);
        currentNode = currentNode.parent;
      }

      ancestorChain.forEach((ancestor) => {
        if (ancestor && isVNode(ancestor) && ancestor.properties && ancestor.properties.style) {
          try {
            const ancestorAttrs = xmlBuilder.modifiedStyleAttributesBuilder(
              docxDocumentInstance,
              ancestor,
              {},
              {}
            );
            if (ancestorAttrs) {
              listAncestorStyles = xmlBuilder.mergeFormattingAttrs(
                listAncestorStyles,
                ancestorAttrs
              );
            }
          } catch (error) {
            console.warn('[DEBUG] Error processing ancestor styles:', error.message);
          }
        }
      });
    } catch (error) {
      console.warn('[DEBUG] Error building ancestor styles:', error.message);
      listAncestorStyles = {};
    }
  }

  const listContainerStyles = xmlBuilder.modifiedStyleAttributesBuilder(
    docxDocumentInstance,
    vNode,
    listAncestorStyles,
    { isParagraph: true }
  );

  let vNodeObjects = [
    {
      node: vNode,
      level: 0,
      type: vNode.tagName,
      numberingId: docxDocumentInstance.createNumbering(vNode.tagName, vNode.properties),
      containerStyles: listContainerStyles,
    },
  ];

  while (vNodeObjects.length) {
    const tempVNodeObject = vNodeObjects.shift();

    // Strict null safety checks
    if (!tempVNodeObject || !tempVNodeObject.node) {
      continue;
    }

    const parentVNodeProperties = tempVNodeObject.node.properties || {};

    if (
      isVText(tempVNodeObject.node) ||
      (isVNode(tempVNodeObject.node) && !['ul', 'ol', 'li'].includes(tempVNodeObject.node.tagName))
    ) {
      try {
        if (!tempVNodeObject.node) {
          console.error('[DEBUG] tempVNodeObject.node is null before buildParagraph');
          continue;
        }

        // Preserve all inherited styles for list items
        const listItemStyles = { ...tempVNodeObject.containerStyles };
        
        const paragraphFragment = await xmlBuilder.buildParagraph(
          tempVNodeObject.node,
          {
            ...listItemStyles,
            numbering: { levelId: tempVNodeObject.level, numberingId: tempVNodeObject.numberingId },
          },
          docxDocumentInstance
        );

        if (paragraphFragment) {
          xmlFragment.import(paragraphFragment);
        }
      } catch (error) {
        console.error(
          '[DEBUG] buildParagraph failed for node:',
          tempVNodeObject.node?.tagName || 'unknown'
        );
        console.error('[DEBUG] buildParagraph error:', error.message);
        throw error;
      }
    }

    if (
      isVNode(tempVNodeObject.node) &&
      tempVNodeObject.node.children &&
      tempVNodeObject.node.children.length &&
      ['ul', 'ol', 'li'].includes(tempVNodeObject.node.tagName)
    ) {
      const tempVNodeObjects = tempVNodeObject.node.children.reduce((accumulator, childVNode) => {
        if (!childVNode) {
          console.error('[DEBUG] Found null childVNode in reduce');
          return accumulator;
        }

        const isChildVNode = isVNode(childVNode);
        const isChildVText = isVText(childVNode);

        if (!isChildVNode && !isChildVText) {
          return accumulator;
        }

        if (isChildVNode && ['ul', 'ol'].includes(childVNode.tagName)) {
          const childContainerStyles = xmlBuilder.modifiedStyleAttributesBuilder(
            docxDocumentInstance,
            childVNode,
            tempVNodeObject.containerStyles,
            { isParagraph: true }
          );

          if (childVNode && tempVNodeObject && tempVNodeObject.level !== undefined) {
            accumulator.push({
              node: childVNode,
              level: tempVNodeObject.level + 1,
              type: childVNode.tagName,
              numberingId: docxDocumentInstance.createNumbering(
                childVNode.tagName,
                childVNode.properties
              ),
              containerStyles: childContainerStyles,
            });
          }
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
                ...(isChildVNode && childVNode?.properties?.attributes
                  ? childVNode.properties.attributes
                  : {}),
              },
              style: {
                ...(parentVNodeProperties?.style || {}),
                ...(isChildVNode && childVNode?.properties?.style
                  ? childVNode.properties.style
                  : {}),
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
              containerStyles: tempVNodeObject.containerStyles,
            });
          }
        }

        return accumulator;
      }, []);

      // Filter out any null entries to prevent errors
      const validTempVNodeObjects = tempVNodeObjects.filter((obj) => {
        if (!obj) {
          console.warn('[DEBUG] buildList: Filtering out null obj');
          return false;
        }
        if (!obj.node) {
          console.warn('[DEBUG] buildList: Filtering out obj with null node:', obj);
          return false;
        }
        return true;
      });
      vNodeObjects = validTempVNodeObjects.concat(vNodeObjects);
    }
  }

  return listElements;
};

async function findXMLEquivalent(docxDocumentInstance, vNode, xmlFragment) {
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
            const imageFragment = await buildImage(docxDocumentInstance, childVNode);
            if (imageFragment) {
              // Add lineRule attribute for consistency
              // Direct image processing includes this attribute, but HTML image processing was missing it
              // This ensures both processing paths generate identical XML structure
              imageFragment.first().first().att('http://schemas.openxmlformats.org/wordprocessingml/2006/main', 'lineRule', 'auto');
              xmlFragment.import(imageFragment);
            } else {
              console.log(`[DEBUG] findXMLEquivalent: buildImage returned null/undefined in figure`);
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
      const imageFragment = await buildImage(docxDocumentInstance, vNode);
      if (imageFragment) {
        // Add lineRule attribute for consistency
        // Direct image processing includes this attribute, but HTML image processing was missing it
        // This ensures both processing paths generate identical XML structure
        imageFragment.first().first().att('http://schemas.openxmlformats.org/wordprocessingml/2006/main', 'lineRule', 'auto');
        xmlFragment.import(imageFragment);
      } else {
        console.log(`[DEBUG] findXMLEquivalent: buildImage returned null/undefined`);
      }
      return;
    case 'br':
      const linebreakFragment = await xmlBuilder.buildParagraph(null, {});
      xmlFragment.import(linebreakFragment);
      return;
    case 'head':
      return;
    case 'div':
      // Check if div has block-level children (like other divs)
      const hasBlockChildren = vNode.children && vNode.children.some(child => 
        isVNode(child) && ['div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'ul', 'ol', 'table'].includes(child.tagName)
      );
      
      if (hasBlockChildren) {
        // Process children in order, creating paragraphs for text content and processing block children separately
        if (vNodeHasChildren(vNode)) {
          let currentTextContent = [];
          
          for (let i = 0; i < vNode.children.length; i++) {
            const child = vNode.children[i];
            
            if (isVNode(child) && ['div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'ul', 'ol', 'table'].includes(child.tagName)) {
              // Before processing block child, create paragraph for any accumulated text content
              if (currentTextContent.length > 0) {
                const textVNode = new VNode(
                  vNode.tagName,
                  vNode.properties,
                  currentTextContent
                );
                const textParagraphFragment = await xmlBuilder.buildParagraph(textVNode, {}, docxDocumentInstance);
                xmlFragment.import(textParagraphFragment);
                currentTextContent = [];
              }
              
              // Process block child with inheritance
              child.parent = vNode;
              await convertVTreeToXML(docxDocumentInstance, child, xmlFragment);
            } else {
              // Accumulate text content and inline elements
              currentTextContent.push(child);
            }
          }
          
          // Create paragraph for any remaining text content
          if (currentTextContent.length > 0) {
            const textVNode = new VNode(
              vNode.tagName,
              vNode.properties,
              currentTextContent
            );
            const textParagraphFragment = await xmlBuilder.buildParagraph(textVNode, {}, docxDocumentInstance);
            xmlFragment.import(textParagraphFragment);
          }
        }
      } else {
        // Div with only inline content - convert to paragraph
        const divParagraphFragment = await xmlBuilder.buildParagraph(vNode, {}, docxDocumentInstance);
        xmlFragment.import(divParagraphFragment);
      }
      return;
  }
  if (vNodeHasChildren(vNode)) {
    // eslint-disable-next-line no-plusplus
    for (let index = 0; index < vNode.children.length; index++) {
      const childVNode = vNode.children[index];
      // eslint-disable-next-line no-use-before-define
      await convertVTreeToXML(docxDocumentInstance, childVNode, xmlFragment);
    }
  }
}

// eslint-disable-next-line consistent-return
export async function convertVTreeToXML(docxDocumentInstance, vTree, xmlFragment) {
  if (!vTree) {
    // eslint-disable-next-line no-useless-return
    return '';
  }
  if (Array.isArray(vTree) && vTree.length) {
    // eslint-disable-next-line no-plusplus
    for (let index = 0; index < vTree.length; index++) {
      const vNode = vTree[index];
      await convertVTreeToXML(docxDocumentInstance, vNode, xmlFragment);
    }
  } else if (isVNode(vTree)) {
    await findXMLEquivalent(docxDocumentInstance, vTree, xmlFragment);
  } else if (isVText(vTree)) {
    const paragraphFragment = await xmlBuilder.buildParagraph(vTree, {}, docxDocumentInstance);
    xmlFragment.import(paragraphFragment);
  }
  return xmlFragment;
}

// Add parent references to virtual DOM tree
function addParentReferences(vNode, parent = null) {
  if (!vNode) return;

  if (isVNode(vNode)) {
    vNode.parent = parent;
    if (vNode.children && Array.isArray(vNode.children) && vNode.children.length > 0) {
      vNode.children.forEach((child) => {
        if (child) {
          addParentReferences(child, vNode);
        }
      });
    }
  }
}

/**
 * Renders a DOCX document by converting HTML to XML and applying inherited properties
 * @param {Object} docxDocumentInstance - The document instance containing HTML string and metadata
 * @param {Object} properties - Style properties to inherit from parent elements (e.g., text-align, color, etc.)
 *                              These properties are applied to all child elements but can be overridden by explicit styles
 * @returns {Promise<Object>} XML fragment representing the rendered document content
 */
async function renderDocumentFile(docxDocumentInstance, properties = {}) {
  const vTree = convertHTML(docxDocumentInstance.htmlString);

  // Add parent references to enable proper inheritance
  if (Array.isArray(vTree)) {
    vTree.forEach((node) => {
      if (node) addParentReferences(node);
    });
  } else if (vTree) {
    addParentReferences(vTree);
  }

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

  const xmlFragment = fragment({ namespaceAlias: { w: namespaces.w } });

  const populatedXmlFragment = await convertVTreeToXML(docxDocumentInstance, vTree, xmlFragment);

  return populatedXmlFragment;
}

export default renderDocumentFile;
