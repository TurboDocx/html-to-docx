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
