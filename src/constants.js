import { cloneDeep } from 'lodash';

const applicationName = 'html-to-docx';
const defaultOrientation = 'portrait';
const landscapeWidth = 15840;
const landscapeHeight = 12240;
const landscapeMargins = {
  top: 1800,
  right: 1440,
  bottom: 1800,
  left: 1440,
  header: 720,
  footer: 720,
  gutter: 0,
};
const portraitMargins = {
  top: 1440,
  right: 1800,
  bottom: 1440,
  left: 1800,
  header: 720,
  footer: 720,
  gutter: 0,
};
const defaultFont = 'Times New Roman';
const defaultFontSize = 22;
const defaultLang = 'en-US';
const defaultDirection = 'ltr';
const defaultTableBorderOptions = {
  size: 0,
  stroke: 'nil',
  color: '000000',
};
const defaultTableBorderAttributeOptions = {
  size: 1,
  stroke: 'single',
};
const defaultHeadingOptions = {
  heading1: {
    font: defaultFont,
    fontSize: 48,
    bold: true,
    spacing: { before: 480, after: 0 },
    keepLines: true,
    keepNext: true,
    outlineLevel: 0,
  },
  heading2: {
    font: defaultFont,
    fontSize: 36,
    bold: true,
    spacing: { before: 360, after: 80 },
    keepLines: true,
    keepNext: true,
    outlineLevel: 1,
  },
  heading3: {
    font: defaultFont,
    fontSize: 28,
    bold: true,
    spacing: { before: 280, after: 80 },
    keepLines: true,
    keepNext: true,
    outlineLevel: 2,
  },
  heading4: {
    font: defaultFont,
    fontSize: 24,
    bold: true,
    spacing: { before: 240, after: 40 },
    keepLines: true,
    keepNext: true,
    outlineLevel: 3,
  },
  heading5: {
    font: defaultFont,
    fontSize: defaultFontSize,
    bold: true,
    spacing: { before: 220, after: 40 },
    keepLines: true,
    keepNext: true,
    outlineLevel: 4,
  },
  heading6: {
    font: defaultFont,
    fontSize: 20,
    bold: true,
    spacing: { before: 200, after: 40 },
    keepLines: true,
    keepNext: true,
    outlineLevel: 5,
  },
};

const defaultDocumentOptions = {
  orientation: defaultOrientation,
  margins: cloneDeep(portraitMargins),
  title: '',
  subject: '',
  creator: applicationName,
  keywords: [applicationName],
  description: '',
  lastModifiedBy: applicationName,
  revision: 1,
  createdAt: new Date(),
  modifiedAt: new Date(),
  headerType: 'default',
  header: false,
  footerType: 'default',
  footer: false,
  font: defaultFont,
  fontSize: defaultFontSize,
  complexScriptFontSize: defaultFontSize,
  table: {
    row: {
      cantSplit: false,
    },
    borderOptions: defaultTableBorderOptions,
    addSpacingAfter: true,
  },
  pageSize: {
    width: landscapeHeight,
    height: landscapeWidth,
  },
  pageNumber: false,
  skipFirstHeaderFooter: false,
  lineNumber: false,
  lineNumberOptions: {
    countBy: 1,
    start: 0,
    restart: 'continuous',
  },
  numbering: {
    defaultOrderedListStyleType: 'decimal',
  },
  heading: defaultHeadingOptions,
  decodeUnicode: false,
  defaultLang,
  direction: defaultDirection,
  preprocessing: {
    skipHTMLMinify: false,
  },
};
const defaultHTMLString = '<p></p>';
const relsFolderName = '_rels';
const headerFileName = 'header1';
const footerFileName = 'footer1';
const themeFileName = 'theme1';
const documentFileName = 'document';
const headerType = 'header';
const footerType = 'footer';
const themeType = 'theme';
const hyperlinkType = 'hyperlink';
const imageType = 'image';
const internalRelationship = 'Internal';
const wordFolder = 'word';
const themeFolder = 'theme';
const paragraphBordersObject = {
  top: {
    size: 0,
    spacing: 3,
    color: 'FFFFFF',
  },
  left: {
    size: 0,
    spacing: 3,
    color: 'FFFFFF',
  },
  bottom: {
    size: 0,
    spacing: 3,
    color: 'FFFFFF',
  },
  right: {
    size: 0,
    spacing: 3,
    color: 'FFFFFF',
  },
};
const colorlessColors = ['transparent', 'auto'];
const verticalAlignValues = ['top', 'middle', 'bottom'];
const defaultPercentageMarginValue = 0;

/**
 * CSS absolute font-size keyword mappings to pixel values
 * Based on CSS specification: https://developer.mozilla.org/en-US/docs/Web/CSS/font-size
 */
const absoluteFontSizes = {
  'xx-small': '9px',
  'x-small': '10px',
  'small': '13px',
  'medium': '16px',
  'large': '18px',
  'x-large': '24px',
  'xx-large': '32px',
  'xxx-large': '48px',
};

/**
 * Scaling factors for relative font-size keywords
 * - smaller: 5/6 of parent font size
 * - larger: 1.2x of parent font size
 */
const relativeFontSizeFactors = {
  smaller: 5 / 6,
  larger: 1.2,
};

export {
  defaultDocumentOptions,
  defaultHeadingOptions,
  defaultTableBorderOptions,
  defaultHTMLString,
  relsFolderName,
  headerFileName,
  footerFileName,
  themeFileName,
  documentFileName,
  headerType,
  footerType,
  themeType,
  internalRelationship,
  wordFolder,
  themeFolder,
  landscapeMargins,
  portraitMargins,
  defaultOrientation,
  landscapeWidth,
  landscapeHeight,
  applicationName,
  defaultFont,
  defaultFontSize,
  hyperlinkType,
  imageType,
  paragraphBordersObject,
  colorlessColors,
  verticalAlignValues,
  defaultLang,
  defaultDirection,
  defaultPercentageMarginValue,
  defaultTableBorderAttributeOptions,
  absoluteFontSizes,
  relativeFontSizeFactors,
};
