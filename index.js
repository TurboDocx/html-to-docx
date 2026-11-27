/* eslint-disable no-useless-escape */
import JSZip from 'jszip';
import { minify } from 'html-minifier-terser';

import createDocumentOptionsAndMergeWithDefaults from './src/utils/options-utils';
import addFilesToContainer from './src/html-to-docx';

const minifyHTMLString = async (htmlString) => {
  try {
    if (typeof htmlString === 'string' || htmlString instanceof String) {
      const minifiedHTMLString = await minify(htmlString, {
        collapseWhitespace: true,
        removeComments: true,
      });
      return minifiedHTMLString;
    }

    throw new Error('invalid html string');
  } catch (error) {
    return null;
  }
};

async function generateContainer(
  htmlString,
  headerHTMLString,
  documentOptions = {},
  footerHTMLString
) {
  const zip = new JSZip();

  const normalizedDocumentOptions = createDocumentOptionsAndMergeWithDefaults(documentOptions);

  let contentHTML = htmlString;
  let headerHTML = headerHTMLString;
  let footerHTML = footerHTMLString;
  if (htmlString && !normalizedDocumentOptions['preprocessing']['skipHTMLMinify']) {
    contentHTML = await minifyHTMLString(contentHTML);
  }
  if (headerHTMLString && !normalizedDocumentOptions['preprocessing']['skipHTMLMinify']) {
    headerHTML = await minifyHTMLString(headerHTML);
  }
  if (footerHTMLString && !normalizedDocumentOptions['preprocessing']['skipHTMLMinify']) {
    footerHTML = await minifyHTMLString(footerHTML);
  }

  // The bands that are not the document's own (page 1's, a section's) are HTML
  // too, so whitespace between their tags is minified away the same way.
  if (!normalizedDocumentOptions.preprocessing.skipHTMLMinify) {
    const minifyBands = async (bands) => {
      if (!bands || typeof bands !== 'object') return bands;
      const minified = { ...bands };
      await Promise.all(
        ['headerHTML', 'footerHTML']
          .filter((key) => bands[key])
          .map(async (key) => {
            minified[key] = await minifyHTMLString(bands[key]);
          })
      );
      return minified;
    };
    if (normalizedDocumentOptions.firstPage) {
      normalizedDocumentOptions.firstPage = await minifyBands(normalizedDocumentOptions.firstPage);
    }
    if (Array.isArray(normalizedDocumentOptions.sections)) {
      normalizedDocumentOptions.sections = await Promise.all(
        normalizedDocumentOptions.sections.map(minifyBands)
      );
    }
  }

  await addFilesToContainer(zip, contentHTML, normalizedDocumentOptions, headerHTML, footerHTML);

  const buffer = await zip.generateAsync({ type: 'arraybuffer' });
  if (Object.prototype.hasOwnProperty.call(global, 'Buffer')) {
    return Buffer.from(new Uint8Array(buffer));
  }
  if (Object.prototype.hasOwnProperty.call(global, 'Blob')) {
    // eslint-disable-next-line no-undef
    return new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
  }
  throw new Error(
    'Add blob support using a polyfill eg https://github.com/bjornstar/blob-polyfill'
  );
}

export default generateContainer;
