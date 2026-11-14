/* eslint-disable no-useless-escape */
import JSZip from 'jszip';
import { minify } from 'html-minifier-terser';

import createDocumentOptionsAndMergeWithDefaults from './src/utils/options-utils';
import addFilesToContainer from './src/html-to-docx';

// html-minifier-terser does not understand MathML: it drops the closing slash of
// self-closing elements such as <mspace/> (which then swallow their siblings) and trims
// meaningful whitespace after an inline element that ends with an equation.
// Equations are set aside while minifying and put back untouched afterwards.
const MATH_ELEMENT_REGEX = /<math(?=[\s>/])[\s\S]*?<\/math\s*>/gi;
const MATH_PLACEHOLDER_REGEX = /<span data-html-to-docx-math="(\d+)"><\/span>/g;

const minifyHTMLString = async (htmlString) => {
  try {
    if (typeof htmlString === 'string' || htmlString instanceof String) {
      const mathFragments = [];
      const protectedHTMLString = String(htmlString).replaceAll(MATH_ELEMENT_REGEX, (match) => {
        mathFragments.push(match);
        return `<span data-html-to-docx-math="${mathFragments.length - 1}"></span>`;
      });

      const minifiedHTMLString = await minify(protectedHTMLString, {
        collapseWhitespace: true,
        removeComments: true,
      });

      if (mathFragments.length === 0) {
        return minifiedHTMLString;
      }
      return minifiedHTMLString.replaceAll(
        MATH_PLACEHOLDER_REGEX,
        (match, index) => mathFragments[Number(index)]
      );
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
