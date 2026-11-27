/**
 * Probes for the zero-regression suite: one small document for each change the document editor
 * work (TurboDocx/html-to-docx#256) made, each rendered with options 1.23.3 already had. Every one
 * must come out of this branch as it came out of 1.23.3. New behaviour belongs behind
 * `browserLayout` (or another new option), never in these defaults.
 */

const PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

const HEADER_FOOTER = {
  headerHTML: '<p>Header <span style="font-family: Georgia">text</span></p>',
  footerHTML: '<p>Footer</p>',
  options: { header: true, footer: true, pageNumber: true },
};

const html = {
  plain: '<p>Hello</p>',

  // Markers
  shapeUnreadable: '<p>A <span data-shape="circle">kept text</span> B</p>',
  shapeNoNumbers: '<p>A <span data-shape="rect">Label</span> B</p>',
  shapeRect:
    '<p>A <span data-shape="rect" data-left="0" data-top="0" data-width="10" data-height="10" data-fill="#000">x</span></p>',
  fieldPage: '<p>Page <span data-field="page">3</span> of <span data-field="numpages">9</span></p>',

  // Lines and runs
  lineHeightUnitless: '<p style="font-size: 30px; line-height: 1.5">x</p>',
  lineHeightPx: '<p style="line-height: 20px">x</p>',
  lineHeightPt: '<p style="line-height: 14pt">x</p>',
  lineHeightPercent: '<p style="font-size: 30px; line-height: 150%">x</p>',
  fontWeight400: '<p><span style="font-weight: 400">x</span></p>',
  fontWeightNormalInHeading: '<h1><span style="font-weight: normal">x</span></h1>',
  fontWeight700: '<p><span style="font-weight: 700">x</span></p>',
  fontWeightBold: '<p><span style="font-weight: bold">x</span></p>',
  fontStyleNormalInEm: '<p><em><span style="font-style: normal">x</span></em></p>',
  fontStyleItalic: '<p><span style="font-style: italic">x</span></p>',
  runPropertyOrder:
    '<p><span style="text-decoration: line-through; font-size: 20px; color: red; font-weight: bold">x</span></p>',
  underlineTag: '<p><u>x</u></p>',
  underlineCss: '<p><span style="text-decoration: underline; color: red">x</span></p>',
  tabCharacter: '<p>a\tb</p>',
  capitalize: '<p style="text-transform: capitalize">don\'t stop</p>',
  uppercase: '<p style="text-transform: uppercase">a</p>',
  fontSizeEm: '<p style="font-size: 20px"><span style="font-size: 1.5em">x</span></p>',
  fontSizeRem: '<p><span style="font-size: 2rem">x</span></p>',

  // Paragraphs
  paragraphMarginTop: '<p style="margin-top: 20px">x</p>',
  paragraphMarginBottom: '<p style="margin-bottom: 20px">x</p>',
  headingMarginBottom: '<h2 style="margin-bottom: 20px">x</h2>',
  listItemMargins: '<ul><li style="margin-top: 10px; margin-bottom: 10px">a</li></ul>',
  paragraphBorder: '<p style="border: 1px solid #000">x</p>',
  headingBorderBottom: '<h3 style="border-bottom: 2px solid #f00">x</h3>',
  paragraphFontFamily: '<p style="font-family: Georgia">x</p>',
  paragraphFontSize: '<p style="font-size: 24px">x</p>',
  paragraphPropertyOrder: '<p style="text-align: center; line-height: 2; margin-left: 20px">x</p>',

  // Tables
  tableHeadRows:
    '<table><thead><tr><th>h</th></tr></thead><tbody><tr><td>b</td></tr></tbody></table>',
  tableFixedLayout:
    '<table style="width:100%; table-layout: fixed"><tr><td>a</td><td>b</td></tr></table>',
  tableThreeColumns: '<table><tr><td>a</td><td>b</td><td>c</td></tr></table>',
  tableSevenColumns:
    '<table><tr><td>1</td><td>2</td><td>3</td><td>4</td><td>5</td><td>6</td><td>7</td></tr></table>',
  tableColgroup:
    '<table><colgroup><col style="width:100px"><col><col></colgroup><tr><td>1</td><td>2</td><td>3</td></tr></table>',
  cellPadding: '<table><tr><td style="padding: 8px">a</td></tr></table>',
  cellPropertyOrder:
    '<table><tr><td colspan="2" style="width:100px; background-color: #eee; vertical-align: middle">a</td></tr><tr><td>b</td><td>c</td></tr></table>',
  tableMarginLeft: '<table style="margin-left: 36px"><tr><td>a</td></tr></table>',
  tableNoSpacingAfter: '<table data-no-spacing-after="true"><tr><td>a</td></tr></table>',
  tableWrap:
    '<table align="right" data-wrap="right" data-wrap-gap="12" style="width: 200px"><tr><td>a</td></tr></table>',
  cellBorder: '<table><tr><td style="border: 1px solid #000">A</td></tr></table>',
  cellBorderWidth:
    '<table><tr><td style="border: 1px solid #000; border-width: 2px">A</td></tr></table>',
  tableBorderLeft: '<table style="border-left: 2px solid #f00"><tr><td>A</td></tr></table>',
  tableBorderTopNoStyle: '<table style="border-top: 2px #f00"><tr><td>A</td></tr></table>',
  tableBorderShorthand: '<table style="border: 3px solid #000"><tr><td>A</td></tr></table>',
  headingInCell: '<table><tr><td><h2>x</h2></td></tr></table>',
  nestedTable:
    '<table><tr><td><table><tr><td>a</td><td>b</td><td>c</td></tr></table></td><td>x</td></tr></table>',

  // Lists
  bulletDisc: '<ul style="list-style-type: disc"><li>a</li></ul>',
  bulletCircle: '<ul style="list-style-type: circle"><li>a</li></ul>',
  bulletSquare: '<ul style="list-style-type: square"><li>a</li></ul>',
  bulletDefault: '<ul><li>a</li><li>b<ul><li>c<ul><li>d</li></ul></li></ul></li></ul>',
  orderedLeadingZero: '<ol style="list-style-type: decimal-leading-zero"><li>a</li></ol>',
  orderedLowerAlpha: '<ol style="list-style-type: lower-alpha"><li>a</li></ol>',
  listMarginBottom: '<ul style="margin-bottom: 20px"><li>a</li><li>b</li></ul>',
  listMarginTop: '<ul style="margin-top: 20px"><li>a</li></ul>',
  listBorder: '<ul style="border: 1px solid red"><li>a</li></ul>',
  listItemParagraphThenText: '<ul><li><p>first</p>tail text</li></ul>',
  checklist:
    '<ul data-checklist="true"><li data-checked="true">done</li><li data-checked="false">todo</li></ul>',
  outlineNumbering: '<ol data-numbering="outline"><li>a<ol><li>b</li></ol></li></ol>',
  customBullet: '<ul data-bullet="→"><li>a</li></ul>',
  bareBullet: '<ul data-bullet><li>a</li></ul>',
  listSuffix: '<ol data-suffix=")" style="list-style-type: lower-alpha"><li>a</li></ol>',

  // Pictures
  imageAlt: `<p><img src="${PIXEL}" alt="Alt text" width="10" height="10"></p>`,
  imageLarge: `<p><img src="${PIXEL}" width="2000" height="3000"></p>`,
  imageInCell: `<table><tr><td><img src="${PIXEL}" width="450" height="225"></td><td>B</td></tr></table>`,
  imageCrop: `<p><img src="${PIXEL}" width="100" height="50" data-crop-top="0.1" data-crop-right="0.25" data-crop-bottom="0" data-crop-left="0.05"></p>`,
  imageBorder: `<p><img src="${PIXEL}" width="80" height="40" data-border-width="3" data-border-color="#000000"></p>`,
  imageTransparency: `<p><img src="${PIXEL}" width="40" height="20" data-transparency="85"></p>`,
  imageWrap: `<p><img src="${PIXEL}" width="100" height="100" data-wrap="left" data-wrap-gap="12">Text beside</p>`,
  imageWrapBehind: `<p><img src="${PIXEL}" width="80" height="40" data-wrap="behind" data-position="page" data-x="400" data-y="700">Text</p>`,

  // Sections
  sectionMarker:
    '<div data-docx-section="0"><p>a</p></div><div data-docx-section="1"><p>b</p></div>',
};

const OPTION_SETS = {
  defaults: {},
  headerFooter: HEADER_FOOTER.options,
  skipFirst: { ...HEADER_FOOTER.options, skipFirstHeaderFooter: true },
  landscape: { orientation: 'landscape', margins: { top: 720, bottom: 720 } },
  rtl: { direction: 'rtl' },
  numbering: { numbering: { defaultOrderedListStyleType: 'lower-roman' } },
  table: { table: { row: { cantSplit: true }, borderOptions: { size: 2, color: '336699' } } },
  fonts: { font: 'Arial', fontSize: 24 },
};

// Every probe under the defaults; a sample of them under each other option set 1.23.3 had.
const SAMPLE = [
  'plain',
  'paragraphFontFamily',
  'tableHeadRows',
  'bulletDefault',
  'orderedLowerAlpha',
  'imageAlt',
];

const withHeaderFooter = (name, value, options) => ({
  name,
  html: value,
  headerHTML: HEADER_FOOTER.headerHTML,
  footerHTML: HEADER_FOOTER.footerHTML,
  options,
});

const EXTRA_SETS = Object.entries(OPTION_SETS).filter(
  ([setName]) => setName !== 'defaults' && setName !== 'headerFooter'
);

const probes = [
  ...Object.entries(html).flatMap(([name, value]) => [
    { name: `probe/${name}`, html: value, options: OPTION_SETS.defaults },
    withHeaderFooter(`probe/${name}+headerFooter`, value, OPTION_SETS.headerFooter),
  ]),
  ...EXTRA_SETS.flatMap(([setName, options]) =>
    SAMPLE.map((name) => withHeaderFooter(`probe/${name}+${setName}`, html[name], options))
  ),
];

export default probes;
