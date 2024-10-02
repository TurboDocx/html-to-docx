/* eslint-disable no-useless-escape */
import JSZip from 'jszip';
import createDocumentOptionsAndMergeWithDefaults from './src/utils/options-utils';
import addFilesToContainer from './src/html-to-docx';

const minifyHTMLString = (htmlString) => {
  try {
    if (typeof htmlString === 'string' || htmlString instanceof String) {
      const minifiedHTMLString = htmlString
        .replace(/\n/g, ' ')
        .replace(/\r/g, ' ')
        .replace(/\r\n/g, ' ')
        .replace(/[\t]+\</g, '<')
        .replace(/\>[\t ]+\</g, '><')
        .replace(/\>[\t ]+$/g, '>');

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
    contentHTML = minifyHTMLString(contentHTML);
  }
  if (headerHTMLString && !normalizedDocumentOptions['preprocessing']['skipHTMLMinify']) {
    headerHTML = minifyHTMLString(headerHTML);
  }
  if (footerHTMLString && !normalizedDocumentOptions['preprocessing']['skipHTMLMinify']) {
    footerHTML = minifyHTMLString(footerHTML);
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
