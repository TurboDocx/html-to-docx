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
  console.log(`[DEBUG] buildImage: Starting image processing`);
  console.log(`[DEBUG] buildImage: vNode.properties.src = ${vNode?.properties?.src ? vNode.properties.src.substring(0, 100) + '...' : 'null'}`);
  
  let response = null;
  let base64Uri = null;
  try {
    const imageSource = vNode.properties.src;
    console.log(`[DEBUG] buildImage: imageSource length = ${imageSource ? imageSource.length : 'null'}`);
    
    if (isValidUrl(imageSource)) {
      console.log(`[DEBUG] buildImage: Processing as URL`);
      const base64String = await imageToBase64(imageSource).catch((error) => {
        // eslint-disable-next-line no-console
        console.warn(`skipping image download and conversion due to ${error}`);
        return null;
      });

      if (base64String) {
        const mimeType = getMimeType(imageSource, base64String);
        console.log(`[DEBUG] buildImage: URL converted to base64, mimeType = ${mimeType}`);
        base64Uri = `data:${mimeType};base64, ${base64String}`;
      } else {
        console.error(`[ERROR] buildImage: Failed to convert URL to base64`);
      }
    } else {
      console.log(`[DEBUG] buildImage: Processing as base64 URI`);
      base64Uri = decodeURIComponent(vNode.properties.src);
      console.log(`[DEBUG] buildImage: Decoded URI length = ${base64Uri ? base64Uri.length : 'null'}`);
    }
    
    if (base64Uri) {
      console.log(`[DEBUG] buildImage: Creating media file`);
      response = docxDocumentInstance.createMediaFile(base64Uri);
      console.log(`[DEBUG] buildImage: Media file created: ${response ? 'success' : 'failed'}`);
      if (response) {
        console.log(`[DEBUG] buildImage: Media file details - fileName: ${response.fileName}, extension: ${response.extension}, fileNameWithExtension: ${response.fileNameWithExtension}`);
      }
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
      console.log(`[DEBUG] buildImage: Adding file to ZIP`);
      docxDocumentInstance.zip
        .folder('word')
        .folder('media')
        .file(response.fileNameWithExtension, Buffer.from(response.fileContent, 'base64'), {
          createFolders: false,
        });

      console.log(`[DEBUG] buildImage: Creating document relationships`);
      const documentRelsId = docxDocumentInstance.createDocumentRelationships(
        docxDocumentInstance.relationshipFilename,
        imageType,
        `media/${response.fileNameWithExtension}`,
        internalRelationship
      );
      console.log(`[DEBUG] buildImage: Document relationship ID: ${documentRelsId}`);

      console.log(`[DEBUG] buildImage: Getting image properties`);
      const imageBuffer = Buffer.from(response.fileContent, 'base64');
      const imageProperties = sizeOf(imageBuffer);
      console.log(`[DEBUG] buildImage: Image properties - width: ${imageProperties.width}, height: ${imageProperties.height}, type: ${imageProperties.type}`);

      console.log(`[DEBUG] buildImage: Building XML paragraph`);
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

      console.log(`[DEBUG] buildImage: Image fragment created successfully`);
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

async function findXMLEquivalent(docxDocumentInstance, vNode, xmlFragment) {
  console.log(`[DEBUG] findXMLEquivalent: Processing vNode with tagName: ${vNode?.tagName || 'null'}`);
  
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
            console.log(`[DEBUG] findXMLEquivalent: Found img tag in figure! Processing image with src: ${childVNode?.properties?.src ? childVNode.properties.src.substring(0, 100) + '...' : 'null'}`);
            const imageFragment = await buildImage(docxDocumentInstance, childVNode);
            if (imageFragment) {
              console.log(`[DEBUG] findXMLEquivalent: buildImage succeeded in figure, adding lineRule attribute`);
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
      console.log(`[DEBUG] findXMLEquivalent: Found img tag! Processing image with src: ${vNode?.properties?.src ? vNode.properties.src.substring(0, 100) + '...' : 'null'}`);
      const imageFragment = await buildImage(docxDocumentInstance, vNode);
      if (imageFragment) {
        console.log(`[DEBUG] findXMLEquivalent: buildImage succeeded, adding lineRule attribute`);
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
  console.log(`[DEBUG] convertVTreeToXML: Processing vTree type: ${Array.isArray(vTree) ? 'array' : typeof vTree}, isVNode: ${isVNode(vTree)}, isVText: ${isVText(vTree)}`);
  
  if (!vTree) {
    console.log(`[DEBUG] convertVTreeToXML: vTree is null/undefined, returning`);
    // eslint-disable-next-line no-useless-return
    return '';
  }
  if (Array.isArray(vTree) && vTree.length) {
    console.log(`[DEBUG] convertVTreeToXML: Processing array of ${vTree.length} items`);
    // eslint-disable-next-line no-plusplus
    for (let index = 0; index < vTree.length; index++) {
      const vNode = vTree[index];
      console.log(`[DEBUG] convertVTreeToXML: Processing array item ${index}, tagName: ${vNode?.tagName || 'not a vNode'}`);
      await convertVTreeToXML(docxDocumentInstance, vNode, xmlFragment);
    }
  } else if (isVNode(vTree)) {
    console.log(`[DEBUG] convertVTreeToXML: Processing VNode with tagName: ${vTree.tagName}`);
    await findXMLEquivalent(docxDocumentInstance, vTree, xmlFragment);
  } else if (isVText(vTree)) {
    console.log(`[DEBUG] convertVTreeToXML: Processing VText: ${vTree.text ? vTree.text.substring(0, 50) + '...' : 'null'}`);
    const paragraphFragment = await xmlBuilder.buildParagraph(vTree, {}, docxDocumentInstance);
    xmlFragment.import(paragraphFragment);
  }
  return xmlFragment;
}

async function renderDocumentFile(docxDocumentInstance) {
  console.log(`[DEBUG] renderDocumentFile: Starting with HTML: ${docxDocumentInstance.htmlString ? docxDocumentInstance.htmlString.substring(0, 200) + '...' : 'null'}`);
  const vTree = convertHTML(docxDocumentInstance.htmlString);
  console.log(`[DEBUG] renderDocumentFile: Converted to vTree, length: ${Array.isArray(vTree) ? vTree.length : 'not array'}`);

  const xmlFragment = fragment({ namespaceAlias: { w: namespaces.w } });

  const populatedXmlFragment = await convertVTreeToXML(docxDocumentInstance, vTree, xmlFragment);

  return populatedXmlFragment;
}

export default renderDocumentFile;
