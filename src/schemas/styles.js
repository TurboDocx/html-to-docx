import { defaultFont, defaultFontSize, defaultLang } from '../constants';
import namespaces from '../namespaces';

const generateStylesXML = (
  font = defaultFont,
  fontSize = defaultFontSize,
  complexScriptFontSize = defaultFontSize,
  lang = defaultLang,
  headingConfig = null
) => {
  // default heading configuration (if not provided)
  const defaultHeadingConfig = {
    heading1: {
      font: null, // use default font
      fontSize: 48,
      bold: true,
      spacing: { before: 480, after: 0 },
      keepLines: true,
      keepNext: true,
      outlineLevel: 0,
    },
    heading2: {
      font: null, // use default font
      fontSize: 36,
      bold: true,
      spacing: { before: 360, after: 80 },
      keepLines: true,
      keepNext: true,
      outlineLevel: 1,
    },
    heading3: {
      font: null, // use default font
      fontSize: 28,
      bold: true,
      spacing: { before: 280, after: 80 },
      keepLines: true,
      keepNext: true,
      outlineLevel: 2,
    },
    heading4: {
      font: null, // use default font
      fontSize: 24,
      bold: true,
      spacing: { before: 240, after: 40 },
      keepLines: true,
      keepNext: true,
      outlineLevel: 3,
    },
    heading5: {
      font: null, // use default font
      fontSize: null, // use default font size
      bold: true,
      spacing: { before: 220, after: 40 },
      keepLines: true,
      keepNext: true,
      outlineLevel: 4,
    },
    heading6: {
      font: null, // use default font
      fontSize: 20,
      bold: true,
      spacing: { before: 200, after: 40 },
      keepLines: true,
      keepNext: true,
      outlineLevel: 5,
    },
  };

  // merge configuration
  const config = headingConfig
    ? { ...defaultHeadingConfig, ...headingConfig }
    : defaultHeadingConfig;

  return `
  <?xml version="1.0" encoding="UTF-8" standalone="yes"?>

  <w:styles xmlns:w="${namespaces.w}" xmlns:r="${namespaces.r}">
	<w:docDefaults>
	  <w:rPrDefault>
		<w:rPr>
		  <w:rFonts w:ascii="${font}" w:eastAsiaTheme="minorHAnsi" w:hAnsiTheme="minorHAnsi" w:cstheme="minorBidi" />
		  <w:sz w:val="${fontSize}" />
		  <w:szCs w:val="${complexScriptFontSize}" />
		  <w:lang w:val="${lang}" w:eastAsia="${lang}" w:bidi="ar-SA" />
		</w:rPr>
	  </w:rPrDefault>
	  <w:pPrDefault>
		<w:pPr>
		  <w:spacing w:after="120" w:line="240" w:lineRule="atLeast" />
		</w:pPr>
	  </w:pPrDefault>
	</w:docDefaults>
	<w:style w:type="paragraph" w:styleId="Normal" w:default="1">
	  <w:name w:val="normal" />
	</w:style>
	<w:style w:type="character" w:styleId="Hyperlink">
	  <w:name w:val="Hyperlink" />
	  <w:rPr>
		<w:color w:val="0000FF" />
		<w:u w:val="single" />
	  </w:rPr>
	</w:style>
	<w:style w:type="paragraph" w:styleId="Heading1">
	  <w:name w:val="heading 1" />
	  <w:basedOn w:val="Normal" />
	  <w:next w:val="Normal" />
	  <w:uiPriority w:val="9" />
	  <w:qFormat />
	  <w:pPr>
		${config.heading1.keepLines ? '<w:keepLines />' : ''}
		${config.heading1.keepNext ? '<w:keepNext />' : ''}
		<w:spacing w:before="${config.heading1.spacing.before}" ${
    config.heading1.spacing.after ? `w:after="${config.heading1.spacing.after}"` : ''
  } />
		<w:outlineLvl w:val="${config.heading1.outlineLevel || 0}" />
	  </w:pPr>
	  <w:rPr>
		${
      config.heading1.font
        ? `<w:rFonts w:ascii="${config.heading1.font}" w:eastAsiaTheme="minorHAnsi" w:hAnsiTheme="minorHAnsi" w:cstheme="minorBidi" />`
        : ''
    }
		${config.heading1.bold ? '<w:b />' : ''}
		${config.heading1.fontSize ? `<w:sz w:val="${config.heading1.fontSize}" />` : ''}
		${config.heading1.fontSize ? `<w:szCs w:val="${config.heading1.fontSize}" />` : ''}
	  </w:rPr>
	</w:style>
	<w:style w:type="paragraph" w:styleId="Heading2">
	  <w:name w:val="heading 2" />
	  <w:basedOn w:val="Normal" />
	  <w:next w:val="Normal" />
	  <w:uiPriority w:val="9" />
	  <w:unhideWhenUsed />
	  <w:qFormat />
	  <w:pPr>
		${config.heading2.keepLines ? '<w:keepLines />' : ''}
		${config.heading2.keepNext ? '<w:keepNext />' : ''}
		<w:spacing w:before="${config.heading2.spacing.before}" ${
    config.heading2.spacing.after ? `w:after="${config.heading2.spacing.after}"` : ''
  } />
		<w:outlineLvl w:val="${config.heading2.outlineLevel || 1}" />
	  </w:pPr>
	  <w:rPr>
		${
      config.heading2.font
        ? `<w:rFonts w:ascii="${config.heading2.font}" w:eastAsiaTheme="minorHAnsi" w:hAnsiTheme="minorHAnsi" w:cstheme="minorBidi" />`
        : ''
    }
		${config.heading2.bold ? '<w:b />' : ''}
		${config.heading2.fontSize ? `<w:sz w:val="${config.heading2.fontSize}" />` : ''}
		${config.heading2.fontSize ? `<w:szCs w:val="${config.heading2.fontSize}" />` : ''}
	  </w:rPr>
	</w:style>
	<w:style w:type="paragraph" w:styleId="Heading3">
	  <w:name w:val="heading 3" />
	  <w:basedOn w:val="Normal" />
	  <w:next w:val="Normal" />
	  <w:uiPriority w:val="9" />
	  <w:semiHidden />
	  <w:unhideWhenUsed />
	  <w:qFormat />
	  <w:pPr>
		${config.heading3.keepLines ? '<w:keepLines />' : ''}
		${config.heading3.keepNext ? '<w:keepNext />' : ''}
		<w:spacing w:before="${config.heading3.spacing.before}" ${
    config.heading3.spacing.after ? `w:after="${config.heading3.spacing.after}"` : ''
  } />
		<w:outlineLvl w:val="${config.heading3.outlineLevel || 2}" />
	  </w:pPr>
	  <w:rPr>
		${
      config.heading3.font
        ? `<w:rFonts w:ascii="${config.heading3.font}" w:eastAsiaTheme="minorHAnsi" w:hAnsiTheme="minorHAnsi" w:cstheme="minorBidi" />`
        : ''
    }
		${config.heading3.bold ? '<w:b />' : ''}
		${config.heading3.fontSize ? `<w:sz w:val="${config.heading3.fontSize}" />` : ''}
		${config.heading3.fontSize ? `<w:szCs w:val="${config.heading3.fontSize}" />` : ''}
	  </w:rPr>
	</w:style>
	<w:style w:type="paragraph" w:styleId="Heading4">
	  <w:name w:val="heading 4" />
	  <w:basedOn w:val="Normal" />
	  <w:next w:val="Normal" />
	  <w:uiPriority w:val="9" />
	  <w:semiHidden />
	  <w:unhideWhenUsed />
	  <w:qFormat />
	  <w:pPr>
		${config.heading4.keepLines ? '<w:keepLines />' : ''}
		${config.heading4.keepNext ? '<w:keepNext />' : ''}
		<w:spacing w:before="${config.heading4.spacing.before}" ${
    config.heading4.spacing.after ? `w:after="${config.heading4.spacing.after}"` : ''
  } />
		<w:outlineLvl w:val="${config.heading4.outlineLevel || 3}" />
	  </w:pPr>
	  <w:rPr>
		${
      config.heading4.font
        ? `<w:rFonts w:ascii="${config.heading4.font}" w:eastAsiaTheme="minorHAnsi" w:hAnsiTheme="minorHAnsi" w:cstheme="minorBidi" />`
        : ''
    }
		${config.heading4.bold ? '<w:b />' : ''}
		${config.heading4.fontSize ? `<w:sz w:val="${config.heading4.fontSize}" />` : ''}
		${config.heading4.fontSize ? `<w:szCs w:val="${config.heading4.fontSize}" />` : ''}
	  </w:rPr>
	</w:style>
	<w:style w:type="paragraph" w:styleId="Heading5">
	  <w:name w:val="heading 5" />
	  <w:basedOn w:val="Normal" />
	  <w:next w:val="Normal" />
	  <w:uiPriority w:val="9" />
	  <w:semiHidden />
	  <w:unhideWhenUsed />
	  <w:qFormat />
	  <w:pPr>
		${config.heading5.keepLines ? '<w:keepLines />' : ''}
		${config.heading5.keepNext ? '<w:keepNext />' : ''}
		<w:spacing w:before="${config.heading5.spacing.before}" ${
    config.heading5.spacing.after ? `w:after="${config.heading5.spacing.after}"` : ''
  } />
		<w:outlineLvl w:val="${config.heading5.outlineLevel || 4}" />
	  </w:pPr>
	  <w:rPr>
		${
      config.heading5.font
        ? `<w:rFonts w:ascii="${config.heading5.font}" w:eastAsiaTheme="minorHAnsi" w:hAnsiTheme="minorHAnsi" w:cstheme="minorBidi" />`
        : ''
    }
		${config.heading5.bold ? '<w:b />' : ''}
		${config.heading5.fontSize ? `<w:sz w:val="${config.heading5.fontSize}" />` : ''}
		${config.heading5.fontSize ? `<w:szCs w:val="${config.heading5.fontSize}" />` : ''}
	  </w:rPr>
	</w:style>
	<w:style w:type="paragraph" w:styleId="Heading6">
	  <w:name w:val="heading 6" />
	  <w:basedOn w:val="Normal" />
	  <w:next w:val="Normal" />
	  <w:uiPriority w:val="9" />
	  <w:semiHidden />
	  <w:unhideWhenUsed />
	  <w:qFormat />
	  <w:pPr>
		${config.heading6.keepLines ? '<w:keepLines />' : ''}
		${config.heading6.keepNext ? '<w:keepNext />' : ''}
		<w:spacing w:before="${config.heading6.spacing.before}" ${
    config.heading6.spacing.after ? `w:after="${config.heading6.spacing.after}"` : ''
  } />
		<w:outlineLvl w:val="${config.heading6.outlineLevel || 5}" />
	  </w:pPr>
	  <w:rPr>
		${
      config.heading6.font
        ? `<w:rFonts w:ascii="${config.heading6.font}" w:eastAsiaTheme="minorHAnsi" w:hAnsiTheme="minorHAnsi" w:cstheme="minorBidi" />`
        : ''
    }
		${config.heading6.bold ? '<w:b />' : ''}
		${config.heading6.fontSize ? `<w:sz w:val="${config.heading6.fontSize}" />` : ''}
		${config.heading6.fontSize ? `<w:szCs w:val="${config.heading6.fontSize}" />` : ''}
	  </w:rPr>
	</w:style>
  </w:styles>
  `;
};

export default generateStylesXML;
