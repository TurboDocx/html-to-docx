import { create } from 'xmlbuilder2';
import { decode } from 'html-entities';
import createHTMLToVDOM from './helpers/html-parser';

import { relsXML } from './schemas';
import DocxDocument from './docx-document';
import { renderDocumentFile } from './helpers';
import {
  defaultHTMLString,
  relsFolderName,
  headerFileName,
  footerFileName,
  themeFileName,
  documentFileName,
  headerType,
  footerType,
  internalRelationship,
  wordFolder,
  themeFolder,
  themeType,
} from './constants';

const convertHTML = createHTMLToVDOM();

/**
 * A header or footer part of a section's own, written as the document's own
 * are, and returning the relationship its section's break names. It is laid
 * out on its section's page, as the section's body is: a full-width table in
 * a portrait section's header is as wide as the portrait page, not the
 * document's last one.
 */
async function addSectionPart(docxDocument, zip, type, htmlString, section) {
  const vTree = convertHTML(htmlString);
  const isHeader = type === 'header';

  const { availableDocumentSpace, availableDocumentHeight } = docxDocument;
  // eslint-disable-next-line no-param-reassign
  docxDocument.relationshipFilename = isHeader ? headerFileName : footerFileName;
  // eslint-disable-next-line no-param-reassign
  docxDocument.availableDocumentSpace = section.availableDocumentSpace;
  // eslint-disable-next-line no-param-reassign
  docxDocument.availableDocumentHeight = section.availableDocumentHeight;
  let generated;
  try {
    generated = isHeader
      ? await docxDocument.generateHeaderXML(vTree)
      : await docxDocument.generateFooterXML(vTree);
  } finally {
    // eslint-disable-next-line no-param-reassign
    docxDocument.availableDocumentSpace = availableDocumentSpace;
    // eslint-disable-next-line no-param-reassign
    docxDocument.availableDocumentHeight = availableDocumentHeight;
  }
  // eslint-disable-next-line no-param-reassign
  docxDocument.relationshipFilename = documentFileName;
  const partId = isHeader ? generated.headerId : generated.footerId;
  const partXML = isHeader ? generated.headerXML : generated.footerXML;
  const partType = isHeader ? headerType : footerType;
  const fileNameWithExt = `${partType}${partId}.xml`;

  const relationshipId = docxDocument.createDocumentRelationships(
    docxDocument.relationshipFilename,
    partType,
    fileNameWithExt,
    internalRelationship
  );

  zip.folder(wordFolder).file(fileNameWithExt, partXML.toString({ prettyPrint: true }), {
    createFolders: false,
  });

  // Listed with the document's own so its content type is declared — but not
  // as a reference of the document's last section, which names only the first.
  const objects = isHeader ? docxDocument.headerObjects : docxDocument.footerObjects;
  objects.push(
    isHeader
      ? { headerId: partId, relationshipId, type: 'sectionOnly' }
      : { footerId: partId, relationshipId, type: 'sectionOnly' }
  );
  return relationshipId;
}

// Ref: https://en.wikipedia.org/wiki/Office_Open_XML_file_formats
// http://officeopenxml.com/anatomyofOOXML.php
async function addFilesToContainer(
  zip,
  htmlString,
  documentOptions,
  headerHTMLString,
  footerHTMLString
) {
  if (documentOptions.header && !headerHTMLString) {
    // eslint-disable-next-line no-param-reassign
    headerHTMLString = defaultHTMLString;
  }
  if (documentOptions.footer && !footerHTMLString) {
    // eslint-disable-next-line no-param-reassign
    footerHTMLString = defaultHTMLString;
  }
  if (documentOptions.decodeUnicode) {
    headerHTMLString = decode(headerHTMLString); // eslint-disable-line no-param-reassign
    htmlString = decode(htmlString); // eslint-disable-line no-param-reassign
    footerHTMLString = decode(footerHTMLString); // eslint-disable-line no-param-reassign
  }

  const docxDocument = new DocxDocument({ zip, htmlString, ...documentOptions });
  // Conversion to Word XML happens here
  docxDocument.documentXML = await renderDocumentFile(docxDocument);

  zip
    .folder(relsFolderName)
    .file(
      '.rels',
      create({ encoding: 'UTF-8', standalone: true }, relsXML).toString({ prettyPrint: true }),
      { createFolders: false }
    );

  zip.folder('docProps').file('core.xml', docxDocument.generateCoreXML(), {
    createFolders: false,
  });

  if (docxDocument.header && headerHTMLString) {
    const vTree = convertHTML(headerHTMLString);

    docxDocument.relationshipFilename = headerFileName;
    const { headerId, headerXML } = await docxDocument.generateHeaderXML(vTree);
    docxDocument.relationshipFilename = documentFileName;
    const fileNameWithExt = `${headerType}${headerId}.xml`;

    const relationshipId = docxDocument.createDocumentRelationships(
      docxDocument.relationshipFilename,
      headerType,
      fileNameWithExt,
      internalRelationship
    );

    zip.folder(wordFolder).file(fileNameWithExt, headerXML.toString({ prettyPrint: true }), {
      createFolders: false,
    });

    docxDocument.headerObjects.push({ headerId, relationshipId, type: docxDocument.headerType });
  }
  if (docxDocument.footer && footerHTMLString) {
    const vTree = convertHTML(footerHTMLString);

    docxDocument.relationshipFilename = footerFileName;
    const { footerId, footerXML } = await docxDocument.generateFooterXML(vTree);
    docxDocument.relationshipFilename = documentFileName;
    const fileNameWithExt = `${footerType}${footerId}.xml`;

    const relationshipId = docxDocument.createDocumentRelationships(
      docxDocument.relationshipFilename,
      footerType,
      fileNameWithExt,
      internalRelationship
    );

    zip.folder(wordFolder).file(fileNameWithExt, footerXML.toString({ prettyPrint: true }), {
      createFolders: false,
    });

    docxDocument.footerObjects.push({ footerId, relationshipId, type: docxDocument.footerType });
  }
  // A section that brought its own header or footer gets parts of its own,
  // which its break names (DocxDocument.generateDocumentXML).
  // eslint-disable-next-line no-restricted-syntax
  for (const section of docxDocument.sections) {
    if (docxDocument.header && section.headerHTML) {
      // eslint-disable-next-line no-await-in-loop
      section.headerRelationshipId = await addSectionPart(
        docxDocument,
        zip,
        'header',
        documentOptions.decodeUnicode ? decode(section.headerHTML) : section.headerHTML,
        section
      );
    }
    if (docxDocument.footer && section.footerHTML) {
      // eslint-disable-next-line no-await-in-loop
      section.footerRelationshipId = await addSectionPart(
        docxDocument,
        zip,
        'footer',
        documentOptions.decodeUnicode ? decode(section.footerHTML) : section.footerHTML,
        section
      );
    }
  }
  const themeFileNameWithExt = `${themeFileName}.xml`;
  docxDocument.createDocumentRelationships(
    docxDocument.relationshipFilename,
    themeType,
    `${themeFolder}/${themeFileNameWithExt}`,
    internalRelationship
  );
  zip
    .folder(wordFolder)
    .folder(themeFolder)
    .file(themeFileNameWithExt, docxDocument.generateThemeXML(), {
      createFolders: false,
    });

  zip
    .folder(wordFolder)
    .file('document.xml', docxDocument.generateDocumentXML(), { createFolders: false })
    .file('fontTable.xml', docxDocument.generateFontTableXML(), { createFolders: false })
    .file('styles.xml', docxDocument.generateStylesXML(), { createFolders: false })
    .file('numbering.xml', docxDocument.generateNumberingXML(), { createFolders: false })
    .file('settings.xml', docxDocument.generateSettingsXML(), { createFolders: false })
    .file('webSettings.xml', docxDocument.generateWebSettingsXML(), { createFolders: false });

  const relationshipXMLs = docxDocument.generateRelsXML();
  if (relationshipXMLs && Array.isArray(relationshipXMLs)) {
    relationshipXMLs.forEach(({ fileName, xmlString }) => {
      zip.folder(wordFolder).folder(relsFolderName).file(`${fileName}.xml.rels`, xmlString, {
        createFolders: false,
      });
    });
  }

  zip.file('[Content_Types].xml', docxDocument.generateContentTypesXML(), { createFolders: false });

  return zip;
}

export default addFilesToContainer;
