import { defaultFont, defaultFontSize, defaultLang, defaultHeadingOptions } from '../constants';
import namespaces from '../namespaces';
import { escapeXml } from '../utils/xml-escape';

const generateHeadingStyleXML = (headingId, heading) => {
  const headingNumber = headingId.replace('Heading', '');

  const fontXml =
    heading.font && heading.font !== defaultFont
      ? `<w:rFonts w:ascii="${escapeXml(
          heading.font
        )}" w:eastAsiaTheme="minorHAnsi" w:hAnsiTheme="minorHAnsi" w:cstheme="minorBidi" />`
      : '';

  const fontSizeXml =
    heading.fontSize !== undefined && heading.fontSize !== defaultFontSize && heading.fontSize > 0
      ? `<w:sz w:val="${heading.fontSize}" /><w:szCs w:val="${heading.fontSize}" />`
      : '';

  const boldXml = heading.bold ? '<w:b />' : '';

  const keepLinesXml = heading.keepLines ? '<w:keepLines />' : '';
  const keepNextXml = heading.keepNext ? '<w:keepNext />' : '';

  let spacingAfterXml = '';
  let spacingXml = '';
  if (heading.spacing) {
    spacingAfterXml = heading.spacing.after ? `w:after="${heading.spacing.after}"` : '';
    spacingXml = `<w:spacing w:before="${heading.spacing.before}" ${spacingAfterXml} />`;
  }

  const validOutlineLevel = Math.max(0, Math.min(5, heading.outlineLevel || 0));
  const outlineXml = `<w:outlineLvl w:val="${validOutlineLevel}" />`;

  const additionalPropsXml = headingNumber >= 3 ? '<w:semiHidden /><w:unhideWhenUsed />' : '';
  const unhideWhenUsedXml = headingNumber === 2 ? '<w:unhideWhenUsed />' : '';

  return `
	<w:style w:type="paragraph" w:styleId="${headingId}">
	  <w:name w:val="heading ${headingNumber}" />
	  <w:basedOn w:val="Normal" />
	  <w:next w:val="Normal" />
	  <w:uiPriority w:val="9" />
	  ${unhideWhenUsedXml}
	  ${additionalPropsXml}
	  <w:qFormat />
	  <w:pPr>
		${keepLinesXml}
		${keepNextXml}
		${spacingXml}
		${outlineXml}
	  </w:pPr>
	  <w:rPr>
		${fontXml}
		${boldXml}
		${fontSizeXml}
	  </w:rPr>
	</w:style>`;
};

const generateStylesXML = (
  font = defaultFont,
  fontSize = defaultFontSize,
  complexScriptFontSize = defaultFontSize,
  lang = defaultLang,
  headingConfig = defaultHeadingOptions
) => {
  const config = { ...defaultHeadingOptions, ...headingConfig };

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
	${Object.entries(config)
    .filter(([key]) => key.startsWith('heading'))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) =>
      generateHeadingStyleXML(key.charAt(0).toUpperCase() + key.slice(1), value)
    )
    .join('')}
  </w:styles>
  `;
};

export default generateStylesXML;
