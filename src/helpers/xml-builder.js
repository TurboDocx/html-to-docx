/* eslint-disable no-await-in-loop */
/* eslint-disable radix */
/* eslint-disable no-param-reassign */
/* eslint-disable no-case-declarations */
/* eslint-disable no-plusplus */
/* eslint-disable no-else-return */
import { fragment } from 'xmlbuilder2';
import isVNode from 'virtual-dom/vnode/is-vnode';
import isVText from 'virtual-dom/vnode/is-vtext';
import colorNames from 'color-name';
import { cloneDeep } from 'lodash';
import imageToBase64 from 'image-to-base64';
import sizeOf from 'image-size';
import { getMimeType } from '../utils/image'

import namespaces from '../namespaces';
import {
  rgbToHex,
  hslToHex,
  hslRegex,
  rgbRegex,
  hexRegex,
  hex3Regex,
  hex3ToHex,
} from '../utils/color-conversion';
import {
  pixelToEMU,
  pixelRegex,
  TWIPToEMU,
  percentageRegex,
  pointRegex,
  pointToHIP,
  HIPToTWIP,
  pointToTWIP,
  pixelToHIP,
  pixelToTWIP,
  pixelToEIP,
  pointToEIP,
  cmToTWIP,
  cmRegex,
  inchRegex,
  inchToTWIP,
  cmToHIP,
  inchToHIP
} from '../utils/unit-conversion';
// FIXME: remove the cyclic dependency
// eslint-disable-next-line import/no-cycle
import { buildImage, buildList } from './render-document-file';
import {
  defaultFont,
  hyperlinkType,
  paragraphBordersObject,
  colorlessColors,
  verticalAlignValues,
  imageType,
  internalRelationship,
  defaultTableBorderOptions,
  defaultTableBorderAttributeOptions
} from '../constants';
import { vNodeHasChildren } from '../utils/vnode';
import { isValidUrl } from '../utils/url';
import { isZeroOrTruthy } from '../utils/truthy-check';

const setUpDirectionalBorderStroke = (borderStrike = 'nil') => ({
  top: borderStrike,
  bottom: borderStrike,
  left: borderStrike,
  right: borderStrike,
});

const setUpDirectionalBorderColor = (borderColor = 'nil') => ({
  top: borderColor,
  bottom: borderColor,
  left: borderColor,
  right: borderColor,
});

const setUpDirectionalBorderSize = (borderObject, borderSize = 1) => {
  borderObject.top = borderSize;
  borderObject.bottom = borderSize;
  borderObject.left = borderSize;
  borderObject.right = borderSize;
};

const setBorderIndexEquivalent = (index, length) => {
  if (index === 0 && index === length - 1) return 'firstAndLast';
  if (index === 0) return 'first';
  if (index === length - 1) return 'last';
  return 'middle';
};

const isThickness = (value) =>
  ['auto', 'from-text'].includes(value) ||
  pointRegex.test(value) ||
  pixelRegex.test(value) ||
  cmRegex.test(value) ||
  inchRegex.test(value) ||
  percentageRegex.test(value);

const isTextDecorationLine = (line) =>
  ['overline', 'underline', 'line-through', 'blink', 'none'].includes(line);

const isTextDecorationStyle = (style) =>
  ['solid', 'dotted', 'double', 'dashed', 'wavy'].includes(style);

const isColorCode = (colorCode) =>
  Object.prototype.hasOwnProperty.call(colorNames, colorCode.toLowerCase()) ||
  rgbRegex.test(colorCode) ||
  hslRegex.test(colorCode) ||
  hexRegex.test(colorCode) ||
  hex3Regex.test(colorCode);

// eslint-disable-next-line consistent-return
const fixupColorCode = (colorCodeString) => {
  if (Object.prototype.hasOwnProperty.call(colorNames, colorCodeString.toLowerCase())) {
    const [red, green, blue] = colorNames[colorCodeString.toLowerCase()];

    return rgbToHex(red, green, blue);
  } else if (rgbRegex.test(colorCodeString)) {
    const matchedParts = colorCodeString.match(rgbRegex);
    const red = matchedParts[1];
    const green = matchedParts[2];
    const blue = matchedParts[3];

    return rgbToHex(red, green, blue);
  } else if (hslRegex.test(colorCodeString)) {
    const matchedParts = colorCodeString.match(hslRegex);
    const hue = matchedParts[1];
    const saturation = matchedParts[2];
    const luminosity = matchedParts[3];

    return hslToHex(hue, saturation, luminosity);
  } else if (hexRegex.test(colorCodeString)) {
    const matchedParts = colorCodeString.match(hexRegex);

    return matchedParts[1];
  } else if (hex3Regex.test(colorCodeString)) {
    const matchedParts = colorCodeString.match(hex3Regex);
    const red = matchedParts[1];
    const green = matchedParts[2];
    const blue = matchedParts[3];

    return hex3ToHex(red, green, blue);
  } else {
    return '000000';
  }
};

const transformText = (text, transformation) => {
  switch (transformation) {
    case 'uppercase':
      return text.toUpperCase();
    case 'lowercase':
      return text.toLowerCase();
    case 'capitalize':
      return text.replace(/\b\w/g, (char) => char.toUpperCase());
    default:
      return text;
  }
}

const buildRunFontFragment = (fontName = defaultFont) =>
  fragment({ namespaceAlias: { w: namespaces.w } })
    .ele('@w', 'rFonts')
    .att('@w', 'ascii', fontName)
    .att('@w', 'hAnsi', fontName)
    .up();

const buildRunStyleFragment = (type = 'Hyperlink') =>
  fragment({ namespaceAlias: { w: namespaces.w } })
    .ele('@w', 'rStyle')
    .att('@w', 'val', type)
    .up();

const buildTableRowHeight = (tableRowHeight) =>
  fragment({ namespaceAlias: { w: namespaces.w } })
    .ele('@w', 'trHeight')
    .att('@w', 'val', tableRowHeight)
    .att('@w', 'hRule', 'atLeast')
    .up();

const buildVerticalAlignment = (verticalAlignment) => {
  if (verticalAlignment.toLowerCase() === 'middle') {
    verticalAlignment = 'center';
  }

  return fragment({ namespaceAlias: { w: namespaces.w } })
    .ele('@w', 'vAlign')
    .att('@w', 'val', verticalAlignment)
    .up();
};

const buildVerticalMerge = (verticalMerge = 'continue') =>
  fragment({ namespaceAlias: { w: namespaces.w } })
    .ele('@w', 'vMerge')
    .att('@w', 'val', verticalMerge)
    .up();

const buildColor = (colorCode) =>
  fragment({ namespaceAlias: { w: namespaces.w } })
    .ele('@w', 'color')
    .att('@w', 'val', colorCode)
    .up();

const buildFontSize = (fontSize) =>
  fragment({ namespaceAlias: { w: namespaces.w } })
    .ele('@w', 'sz')
    .att('@w', 'val', fontSize)
    .up();

const buildShading = (colorCode) =>
  fragment({ namespaceAlias: { w: namespaces.w } })
    .ele('@w', 'shd')
    .att('@w', 'val', 'clear')
    .att('@w', 'fill', colorCode)
    .up();

const buildHighlight = (color = 'yellow') =>
  fragment({ namespaceAlias: { w: namespaces.w } })
    .ele('@w', 'highlight')
    .att('@w', 'val', color)
    .up();

const buildVertAlign = (type = 'baseline') =>
  fragment({ namespaceAlias: { w: namespaces.w } })
    .ele('@w', 'vertAlign')
    .att('@w', 'val', type)
    .up();

const buildStrike = () =>
  fragment({ namespaceAlias: { w: namespaces.w } })
    .ele('@w', 'strike')
    .att('@w', 'val', true)
    .up();

const buildBold = () =>
  fragment({ namespaceAlias: { w: namespaces.w } })
    .ele('@w', 'b')
    .up();

const buildItalics = () =>
  fragment({ namespaceAlias: { w: namespaces.w } })
    .ele('@w', 'i')
    .up();

const buildUnderline = (type = 'single') =>
  fragment({ namespaceAlias: { w: namespaces.w } })
    .ele('@w', 'u')
    .att('@w', 'val', type)
    .up();

const buildLineBreak = (type = 'textWrapping') =>
  fragment({ namespaceAlias: { w: namespaces.w } })
    .ele('@w', 'br')
    .att('@w', 'type', type)
    .up();

const buildBorder = (
  borderSide = 'top',
  borderSize = 0,
  borderSpacing = 0,
  borderColor = fixupColorCode('black'),
  borderStroke = 'single'
) =>
  fragment({ namespaceAlias: { w: namespaces.w } })
    .ele('@w', borderSide)
    .att('@w', 'val', borderStroke)
    .att('@w', 'sz', borderSize)
    .att('@w', 'space', borderSpacing)
    .att('@w', 'color', borderColor)
    .up();

const buildTextElement = (text) =>
  fragment({ namespaceAlias: { w: namespaces.w } })
    .ele('@w', 't')
    .att('@xml', 'space', 'preserve')
    .txt(text)
    .up();

const buildTextDecoration = (value) => {
  if (value.line === 'underline') {
    return fragment({ namespaceAlias: { w: namespaces.w } })
      .ele('@w', 'u')
      .att('@w', 'val', value.style ? value.style : 'single')
      .att('@w', 'color', value.color ? value.color : '000000')
      .up();
  } else if (value.line === 'line-through') {
    return fragment({ namespaceAlias: { w: namespaces.w } })
      .ele('@w', 'strike')
      .att('@w', 'val', true)
      .up();
  }

  // line has both 'underline' and 'line-through'
  return fragment({ namespaceAlias: { w: namespaces.w } })
    .ele('@w', 'u')
    .att('@w', 'val', value.style ? value.style : 'single')
    .att('@w', 'color', value.color ? value.color : '000000')
    .up()
    .ele('@w', 'strike')
    .att('@w', 'val', true)
    .up();
};

// maps html text-decoration-style attribute values to ooxml values
const fixupTextDecorationStyle = (style) => {
  if (['dotted', 'double'].includes(style)) {
    return style;
  }
  const map = {
    solid: 'single',
    dashed: 'dash',
    wavy: 'wave',
  };
  return map[style];
};

// maps html text-decoration-line attribute values to ooxml values
const fixupTextDecorationLine = (line) => {
  if (['overline', 'blink'].includes(line)) {
    return 'none';
  }
  return line;
};
const buildTextShadow = () =>
  fragment({ namespaceAlias: { w: namespaces.w } })
    .ele('@w', 'shadow')
    .att('@w', 'val', true)
    .up();

// eslint-disable-next-line consistent-return
const fixupLineHeight = (lineHeight, fontSize) => {
  // FIXME: If line height is anything other than a number
  // eslint-disable-next-line no-restricted-globals
  if (!isNaN(lineHeight)) {
    if (fontSize) {
      const actualLineHeight = +lineHeight * fontSize;

      return HIPToTWIP(actualLineHeight);
    } else {
      // 240 TWIP or 12 point is default line height
      return +lineHeight * 240;
    }
  } else if (pointRegex.test(lineHeight)) {
    const matchedParts = lineHeight.match(pointRegex);
    return pointToTWIP(matchedParts[1]);
  } else if (pixelRegex.test(lineHeight)) {
    const matchedParts = lineHeight.match(pixelRegex);
    return pixelToTWIP(matchedParts[1]);
  } else if (cmRegex.test(lineHeight)) {
    const matchedParts = lineHeight.match(cmRegex);
    return cmToTWIP(matchedParts[1]);
  } else if (inchRegex.test(lineHeight)) {
    const matchedParts = lineHeight.match(inchRegex);
    return inchToTWIP(matchedParts[1]);
  } else if (percentageRegex.test(lineHeight)) {
    const matchedParts = lineHeight.match(percentageRegex);
    return HIPToTWIP((matchedParts[1] * fontSize) / 100);
  }
  else {
    // 240 TWIP or 12 point is default line height
    return 240;
  }
};

// eslint-disable-next-line consistent-return
const fixupFontSize = (fontSizeString, docxDocumentInstance) => {
  if (pointRegex.test(fontSizeString)) {
    const matchedParts = fontSizeString.match(pointRegex);
    // convert point to half point
    return pointToHIP(matchedParts[1]);
  } else if (pixelRegex.test(fontSizeString)) {
    const matchedParts = fontSizeString.match(pixelRegex);
    // convert pixels to half point
    return pixelToHIP(matchedParts[1]);
  } else if (cmRegex.test(fontSizeString)) {
    const matchedParts = fontSizeString.match(cmRegex);
    return cmToHIP(matchedParts[1]);
  } else if (inchRegex.test(fontSizeString)) {
    const matchedParts = fontSizeString.match(inchRegex);
    return inchToHIP(matchedParts[1]);
  } else if (percentageRegex.test(fontSizeString)) {
    // need fontsize here default
    const matchedParts = fontSizeString.match(percentageRegex);
    return (matchedParts[1] * docxDocumentInstance.fontSize) / 100;
  }
};

// eslint-disable-next-line consistent-return
const fixupRowHeight = (rowHeightString, parentHeight = 0) => {
  if (pointRegex.test(rowHeightString)) {
    const matchedParts = rowHeightString.match(pointRegex);
    // convert point to half point
    return pointToTWIP(matchedParts[1]);
  } else if (pixelRegex.test(rowHeightString)) {
    const matchedParts = rowHeightString.match(pixelRegex);
    // convert pixels to half point
    return pixelToTWIP(matchedParts[1]);
  } else if (cmRegex.test(rowHeightString)) {
    const matchedParts = rowHeightString.match(cmRegex);
    return cmToTWIP(matchedParts[1]);
  } else if (inchRegex.test(rowHeightString)) {
    const matchedParts = rowHeightString.match(inchRegex);
    return inchToTWIP(matchedParts[1]);
  } else if (percentageRegex.test(rowHeightString)) {
    const matchedParts = rowHeightString.match(percentageRegex);
    return (matchedParts[1] * parentHeight) / 100;
  }
};

// eslint-disable-next-line consistent-return
const fixupColumnWidth = (columnWidthString, parentWidth = 0) => {
  if (pointRegex.test(columnWidthString)) {
    const matchedParts = columnWidthString.match(pointRegex);
    return pointToTWIP(matchedParts[1]);
  } else if (pixelRegex.test(columnWidthString)) {
    const matchedParts = columnWidthString.match(pixelRegex);
    return pixelToTWIP(matchedParts[1]);
  } else if (cmRegex.test(columnWidthString)) {
    const matchedParts = columnWidthString.match(cmRegex);
    return cmToTWIP(matchedParts[1]);
  } else if (inchRegex.test(columnWidthString)) {
    const matchedParts = columnWidthString.match(inchRegex);
    return inchToTWIP(matchedParts[1]);
  } else if (percentageRegex.test(columnWidthString)) {
    const matchedParts = columnWidthString.match(percentageRegex);
    return (matchedParts[1] * parentWidth) / 100
  }
};

// eslint-disable-next-line consistent-return
const fixupMargin = (marginString) => {
  if (pointRegex.test(marginString)) {
    const matchedParts = marginString.match(pointRegex);
    // convert point to half point
    return pointToTWIP(matchedParts[1]);
  } else if (pixelRegex.test(marginString)) {
    const matchedParts = marginString.match(pixelRegex);
    // convert pixels to half point
    return pixelToTWIP(matchedParts[1]);
  } else if (cmRegex.test(marginString)) {
    const matchedParts = marginString.match(cmRegex);
    return cmToTWIP(matchedParts[1]);
  } else if (inchRegex.test(marginString)) {
    const matchedParts = marginString.match(inchRegex);
    return inchToTWIP(matchedParts[1]);
  } else if (percentageRegex.test(marginString)) {
    // This requires changes in lot of functions. So, for now, we are returning the percentage value as it is.
    // TODO: Revisit this and see how margins in percentages are handled and change in respective functions.
    const matchedParts = marginString.match(percentageRegex);
    return matchedParts[1]
  }
};

const borderStyleParser = (style) => {
  // Accepted OOXML Values for border style: http://officeopenxml.com/WPtableBorders.php
  if (['dashed', 'dotted', 'double', 'inset', 'outset', 'none'].includes(style)) {
    return style;
  } else if (style === 'hidden') {
    return 'nil';
  }
  return 'single'
}

const borderSizeParser = (borderSize) => {
  if (pointRegex.test(borderSize)) {
    const matchedParts = borderSize.match(pointRegex);
    return pointToEIP(matchedParts[1]);
  } else if (pixelRegex.test(borderSize)) {
    const matchedParts = borderSize.match(pixelRegex);
    // convert pixels to eighth of a point
    return pixelToEIP(matchedParts[1]);
  }

  return borderSize
}

const cssBorderParser = (borderString, defaultBorderOptions = { ...defaultTableBorderOptions, stroke: 'single' }) => {
  const tokens = borderString.split(' ');

  let { size, stroke, color } = defaultBorderOptions

  for (let tokenIdx = 0; tokenIdx < tokens.length; tokenIdx++) {
    const token = tokens[tokenIdx];
    // Accepted HTML Values for border style: https://developer.mozilla.org/en-US/docs/Web/CSS/border-style
    if (
      [
        'solid',
        'dashed',
        'dotted',
        'double',
        'groove',
        'ridges',
        'inset',
        'outset',
        'hidden',
        'none',
        'windowtext', // tinyMCE has this border property
      ].includes(token)
    ) {
      // Accepted OOXML Values for border style: http://officeopenxml.com/WPtableBorders.php
      stroke = borderStyleParser(token)
    } else if (pointRegex.test(token)) {
      const matchedParts = token.match(pointRegex);
      // convert point to eighth of a point
      size = pointToEIP(matchedParts[1]);
    } else if (pixelRegex.test(token)) {
      const matchedParts = token.match(pixelRegex);
      // convert pixels to eighth of a point
      size = pixelToEIP(matchedParts[1]);
    } else {
      color = fixupColorCode(token).toUpperCase();
    }
  }
  // Syntax used for border color is either hsl or rgb
  if (tokens.length !== 3) {
    const openingBracketIdx = borderString.indexOf('(');
    const closingBracketIdx = borderString.indexOf(')');
    color = borderString.substring(openingBracketIdx - 3, closingBracketIdx + 1);
    color = fixupColorCode(color).toUpperCase();
  }
  return [size, stroke, color];
};

const modifiedStyleAttributesBuilder = (docxDocumentInstance, vNode, attributes, options) => {
  const modifiedAttributes = { ...attributes };

  // styles
  if (isVNode(vNode) && vNode.properties && vNode.properties.style) {
    const vNodeStyle = vNode.properties.style;
    const vNodeStyleKeys = Object.keys(vNodeStyle);

    for (const vNodeStyleKey of vNodeStyleKeys) {
      const vNodeStyleValue = vNodeStyle[vNodeStyleKey];
      if (vNodeStyleKey === 'color') {
        if (!colorlessColors.includes(vNodeStyleValue)) {
          modifiedAttributes.color = fixupColorCode(vNodeStyleValue);
        }
      } else if (vNodeStyleKey === 'background-color') {
        if (!colorlessColors.includes(vNodeStyleValue)) {
          modifiedAttributes.backgroundColor = fixupColorCode(vNodeStyleValue);
        }
      } else if (vNodeStyleKey === 'background') {
        if (!colorlessColors.includes(vNodeStyleValue)) {
          modifiedAttributes.backgroundColor = fixupColorCode(vNodeStyleValue);
        }
      } else if (vNodeStyleKey === 'vertical-align') {
        if (verticalAlignValues.includes(vNodeStyleValue)) {
          modifiedAttributes.verticalAlign = vNodeStyleValue;
        }
      } else if (vNodeStyleKey === 'text-align') {
        if (['left', 'right', 'center', 'justify'].includes(vNodeStyleValue)) {
          modifiedAttributes.textAlign = vNodeStyleValue;
        }
      } else if (vNodeStyleKey === 'font-weight') {
        // FIXME: remove bold check when other font weights are handled.
        if (vNodeStyleValue === 'bold') {
          modifiedAttributes.strong = vNodeStyleValue;
        }
      } else if (vNodeStyleKey === 'font-family') {
        modifiedAttributes.font = docxDocumentInstance.createFont(vNodeStyleValue);
      } else if (vNodeStyleKey === 'font-size') {
        modifiedAttributes.fontSize = fixupFontSize(vNodeStyleValue, docxDocumentInstance);
      } else if (vNodeStyleKey === 'line-height') {
        modifiedAttributes.lineHeight = fixupLineHeight(vNodeStyleValue,
          vNodeStyle['font-size'] ?
            fixupFontSize(vNodeStyle['font-size'], docxDocumentInstance) :
            null);
      } else if (vNodeStyleKey === 'margin') {
        const marginParts = vNodeStyleValue.split(' ');
        const margins = {
          top: 0,
          bottom: 0,
          left: 0,
          right: 0
        }
        if (marginParts.length === 1) {
          const fixedUpMargin = fixupMargin(marginParts[0]);
          margins.top = fixedUpMargin;
          margins.bottom = fixedUpMargin;
          margins.left = fixedUpMargin;
          margins.right = fixedUpMargin;
        } else if (marginParts.length === 2) {
          const fixedUpMarginVertical = fixupMargin(marginParts[0]);
          const fixedUpMarginHorizontal = fixupMargin(marginParts[1]);
          margins.top = fixedUpMarginVertical;
          margins.bottom = fixedUpMarginVertical;
          margins.left = fixedUpMarginHorizontal;
          margins.right = fixedUpMarginHorizontal
        } else if (marginParts.length === 3) {
          margins.top = fixupMargin(marginParts[0]);
          margins.bottom = fixupMargin(marginParts[2]);
          margins.right = fixupMargin(marginParts[1]);
          margins.left = fixupMargin(marginParts[1]);
        } else if (marginParts.length === 4) {
          margins.top = fixupMargin(marginParts[0]);
          margins.right = fixupMargin(marginParts[1]);
          margins.bottom = fixupMargin(marginParts[2]);
          margins.left = fixupMargin(marginParts[3]);
        }

        const { left, right, bottom } = margins
        const indentation = { left, right }
        if (isZeroOrTruthy(left) || isZeroOrTruthy(right)) {
          modifiedAttributes.indentation = indentation;
        }
        if (isZeroOrTruthy(bottom)) {
          modifiedAttributes.afterSpacing = bottom;
        }
      } else if (vNodeStyleKey === 'margin-left' || vNodeStyleKey === 'margin-right') {
        const leftMargin = fixupMargin(vNodeStyle['margin-left']);
        const rightMargin = fixupMargin(vNodeStyle['margin-right']);
        const indentation = {};
        if (isZeroOrTruthy(leftMargin)) {
          indentation.left = leftMargin;
        }
        if (isZeroOrTruthy(rightMargin)) {
          indentation.right = rightMargin;
        }
        if (isZeroOrTruthy(leftMargin) || isZeroOrTruthy(rightMargin)) {
          modifiedAttributes.indentation = indentation;
        }
      } else if (vNodeStyleKey === 'margin-bottom') {
        if (vNode.tagName === 'p') {
          modifiedAttributes.afterSpacing = fixupMargin(vNodeStyle['margin-bottom']);
        }
      } else if (vNodeStyleKey === 'display') {
        modifiedAttributes.display = vNodeStyle['display'];
      } else if (vNodeStyleKey === 'width') {
        modifiedAttributes.width = vNodeStyle['width'];
      } else if (vNodeStyleKey === 'text-transform') {
        modifiedAttributes.textTransform = vNodeStyleValue;
      } else if (vNodeStyleKey === 'text-decoration') {
        const valueParts = vNodeStyleValue.split(' ').map((part) => part.toLowerCase());
        let value = {};

        if (modifiedAttributes.textDecoration) {
          value = modifiedAttributes.textDecoration;
        }

        // eslint-disable-next-line no-loop-func
        // mapping each value to specific property of text-decoration
        valueParts.forEach((valuePart) => {
          if (isColorCode(valuePart)) {
            value.color = fixupColorCode(valuePart);
          } else if (isTextDecorationStyle(valuePart)) {
            value.style = fixupTextDecorationStyle(valuePart);
          } else if (isTextDecorationLine(valuePart)) {
            const newValue = fixupTextDecorationLine(valuePart);
            if (value && value.line && value.line !== newValue) {
              value.line = 'both';
            } else {
              value.line = newValue;
            }
          }
        });

        if (value.line !== 'none') {
          modifiedAttributes.textDecoration = value;
        }
      } else if (vNodeStyleKey === 'text-decoration-line') {
        const value = fixupTextDecorationLine(vNodeStyleValue);
        if (value !== 'none') {
          modifiedAttributes.textDecoration = { line: value };
        }
      } else if (vNodeStyleKey === 'text-decoration-style') {
        modifiedAttributes.textDecoration = { style: vNodeStyleValue, line: 'underline' };
      } else if (vNodeStyleKey === 'text-decoration-color') {
        modifiedAttributes.textDecoration = {
          color: fixupColorCode(vNodeStyleValue),
          line: 'underline',
        };
      } else if (vNodeStyleKey === 'text-shadow') {
        if (vNodeStyleValue.trim() !== '' && vNodeStyleValue !== 'none') {
          modifiedAttributes.textShadow = vNodeStyleValue;
        }
      }
    }
  }

  // paragraph only
  if (options && options.isParagraph) {
    if (isVNode(vNode) && vNode.tagName === 'blockquote') {
      modifiedAttributes.indentation = { left: 284 };
      modifiedAttributes.textAlign = 'justify';
    } else if (isVNode(vNode) && vNode.tagName === 'code') {
      modifiedAttributes.highlightColor = 'lightGray';
    } else if (isVNode(vNode) && vNode.tagName === 'pre') {
      modifiedAttributes.font = 'Courier';
    }
  }

  return modifiedAttributes;
};

// html tag to formatting function
// options are passed to the formatting function if needed
const buildFormatting = (htmlTag, options) => {
  switch (htmlTag) {
    case 'strong':
    case 'b':
      return buildBold();
    case 'em':
    case 'i':
      return buildItalics();
    case 'ins':
    case 'u':
      return buildUnderline();
    case 'strike':
    case 'del':
    case 's':
      return buildStrike();
    case 'sub':
      return buildVertAlign('subscript');
    case 'sup':
      return buildVertAlign('superscript');
    case 'mark':
      return buildHighlight();
    case 'code':
      return buildHighlight('lightGray');
    case 'highlightColor':
      return buildHighlight(options && options.color ? options.color : 'lightGray');
    case 'font':
      return buildRunFontFragment(options.font);
    case 'pre':
      return buildRunFontFragment('Courier');
    case 'color':
      return buildColor(options && options.color ? options.color : 'black');
    case 'backgroundColor':
      return buildShading(options && options.color ? options.color : 'black');
    case 'fontSize':
      // does this need a unit of measure?
      return buildFontSize(options && options.fontSize ? options.fontSize : 10);
    case 'hyperlink':
      return buildRunStyleFragment('Hyperlink');
    case 'textDecoration':
      return buildTextDecoration(options && options.textDecoration ? options.textDecoration : {});
    case 'textShadow':
      return buildTextShadow();
  }

  return null;
};

const buildRunProperties = (attributes) => {
  const runPropertiesFragment = fragment({ namespaceAlias: { w: namespaces.w } }).ele('@w', 'rPr');
  if (attributes && attributes.constructor === Object) {
    Object.keys(attributes).forEach((key) => {
      const options = {};
      if (key === 'color' || key === 'backgroundColor' || key === 'highlightColor') {
        options.color = attributes[key];
      }

      if (key === 'fontSize' || key === 'font') {
        options[key] = attributes[key];
      }

      if (key === 'textDecoration') {
        options.textDecoration = attributes[key];
      }

      if (key === 'textShadow') {
        options.textShadow = attributes[key];
      }

      const formattingFragment = buildFormatting(key, options);
      if (formattingFragment) {
        runPropertiesFragment.import(formattingFragment);
      }
    });
  }
  runPropertiesFragment.up();

  return runPropertiesFragment;
};

const buildRun = async (vNode, attributes, docxDocumentInstance) => {
  const runFragment = fragment({ namespaceAlias: { w: namespaces.w } }).ele('@w', 'r');
  const runPropertiesFragment = buildRunProperties(cloneDeep(attributes));

  // case where we have recursive spans representing font changes
  if (isVNode(vNode) && vNode.tagName === 'span') {
    // eslint-disable-next-line no-use-before-define
    return buildRunOrRuns(vNode, attributes, docxDocumentInstance);
  }

  if (
    isVNode(vNode) &&
    [
      'strong',
      'b',
      'em',
      'i',
      'u',
      'ins',
      'strike',
      'del',
      's',
      'sub',
      'sup',
      'mark',
      'blockquote',
      'code',
      'pre',
    ].includes(vNode.tagName)
  ) {
    const runFragmentsArray = [];
    let vNodes = [vNode];
    // create temp run fragments to split the paragraph into different runs
    let tempAttributes = cloneDeep(attributes);
    // if any style tags are present use that to overwrite the attributes
    let tempRunFragment = fragment({ namespaceAlias: { w: namespaces.w } }).ele('@w', 'r');
    let formattingFragmentAttributes = {}
    while (vNodes.length) {
      const tempVNode = vNodes.shift();
      if (isVText(tempVNode)) {
        const textFragment = buildTextElement(transformText(tempVNode.text, formattingFragmentAttributes.textTransform || tempAttributes.textTransform));
        // we don't need to pass the formattingFragmentAttributes to the buildRunProperties function
        // since the attributes are already applied to the runPropertiesFragment
        // if the children is text then we directly reach this if node
        // if the node is a span, then those attributes are passed to the buildRunOrRuns function
        // and the attributes are applied to the runPropertiesFragment
        // if node is formatting node, then the attributes are stored in formattingFragmentAttributes
        // and are applied to the text node as required
        const tempRunPropertiesFragment = buildRunProperties({ ...attributes, ...tempAttributes });
        tempRunFragment.import(tempRunPropertiesFragment);
        tempRunFragment.import(textFragment);
        runFragmentsArray.push(tempRunFragment);

        // re initialize temp run fragments with new fragment
        tempAttributes = cloneDeep(attributes);
        tempRunFragment = fragment({ namespaceAlias: { w: namespaces.w } }).ele('@w', 'r');
      } else if (isVNode(tempVNode)) {
        if (
          [
            'strong',
            'b',
            'em',
            'i',
            'u',
            'ins',
            'strike',
            'del',
            's',
            'sub',
            'sup',
            'mark',
            'code',
            'pre',
          ].includes(tempVNode.tagName)
        ) {
          switch (tempVNode.tagName) {
            case 'strong':
            case 'b':
              tempAttributes.strong = true;
              break;
            case 'em':
            case 'i':
              tempAttributes.i = true;
              break;
            case 'u':
              tempAttributes.u = true;
              break;
            case 'sub':
              tempAttributes.sub = true;
              break;
            case 'sup':
              tempAttributes.sup = true;
              break;
          }
          const formattingFragment = buildFormatting(tempVNode);
          formattingFragmentAttributes = modifiedStyleAttributesBuilder(docxDocumentInstance, tempVNode, { ...formattingFragmentAttributes });
          if (formattingFragment) {
            runPropertiesFragment.import(formattingFragment);
          }
          // go a layer deeper if there is a span somewhere in the children
        } else if (tempVNode.tagName === 'span') {

          const modifiedAttributes = modifiedStyleAttributesBuilder(docxDocumentInstance, tempVNode, { ...attributes, ...tempAttributes });

          // eslint-disable-next-line no-use-before-define
          const spanFragment = await buildRunOrRuns(
            tempVNode,
            modifiedAttributes,
            docxDocumentInstance
          );

          // if spanFragment is an array, we need to add each fragment to the runFragmentsArray. If the fragment is an array, perform a depth first search on the array to add each fragment to the runFragmentsArray
          if (Array.isArray(spanFragment)) {
            spanFragment.flat(Infinity);
            runFragmentsArray.push(...spanFragment);
          } else {
            runFragmentsArray.push(spanFragment);
          }

          // do not slice and concat children since this is already accounted for in the buildRunOrRuns function
          // eslint-disable-next-line no-continue
          continue;
        } else if (tempVNode.tagName === 'img') {
          // Handles the cases like
          // <strong>Inside strong <img src=""/></strong>
          // <strong><img src=""/></strong>
          // <pre>Inside Pre<img src=""/></pre>
          // <pre><img src=""/></pre>

          // Wrap the image node in a lookalike span node to render the image
          const coveringNode = {
            tagName: 'span',
            children: [tempVNode],
            // add this property to indicate that this is a covering node and not a real span node
            // also ensure that this node can also be used treated as isVNode in buildRunOrRuns
            isCoveringNode: true,
            properties: {
              style: {}, // to avoid undefined error
              attributes: {}
            }
          }

          // Now we follow the same logic as the span node conversion
          const spanFragment = await buildRunOrRuns(coveringNode, { ...attributes, ...tempAttributes }, docxDocumentInstance)

          if (Array.isArray(spanFragment)) {
            spanFragment.flat(Infinity);
            runFragmentsArray.push(...spanFragment);
          } else {
            runFragmentsArray.push(spanFragment);
          }

          // do not slice and concat children since this is already accounted for in the buildRunOrRuns function
          // eslint-disable-next-line no-continue
          continue;
        } else if (tempVNode.tagName === 'br') {
          const lineBreakFragment = buildLineBreak();
          runFragmentsArray.push(lineBreakFragment);
        }
        // TODO: check if picture can occur inside inline elements(not span)
      }

      if (tempVNode.children && tempVNode.children.length) {
        if (tempVNode.children.length > 1) {
          attributes = modifiedStyleAttributesBuilder(docxDocumentInstance, tempVNode, { ...attributes, ...tempAttributes });
        }
        vNodes = tempVNode.children.slice().concat(vNodes);
      }
    }
    if (runFragmentsArray.length) {
      return runFragmentsArray;
    }
  }

  runFragment.import(runPropertiesFragment);
  if (isVText(vNode)) {
    const textFragment = buildTextElement(transformText(vNode.text, attributes.textTransform));
    runFragment.import(textFragment);
  } else if (attributes && attributes.type === 'picture') {

    const imageSource = vNode.properties.src;
    let requiresConversion = false;
    let isConverted = false;

    if (isValidUrl(imageSource)) {
      requiresConversion = true
      const base64String = await imageToBase64(imageSource).catch((error) => {
        // eslint-disable-next-line no-console
        console.warn(`skipping image download and conversion due to ${error}`);
      });
      if (base64String) {
        isConverted = true;
        vNode.properties.src = `data:${getMimeType(imageSource, base64String)};base64, ${base64String}`;
      }
    }

    // we add this check because if the image is not converted, we should not proceed with the conversion
    const shouldProceed = requiresConversion && !isConverted ? false : true;
    if (shouldProceed) {
      let response = null;

      const base64Uri = decodeURIComponent(vNode.properties.src);
      if (base64Uri) {
        response = docxDocumentInstance.createMediaFile(base64Uri);
      }

      if (response) {
        docxDocumentInstance.zip
          .folder('word')
          .folder('media')
          .file(response.fileNameWithExtension, Buffer.from(response.fileContent, 'base64'), {
            createFolders: false,
          });

        const documentRelsId = docxDocumentInstance.createDocumentRelationships(
          docxDocumentInstance.relationshipFilename,
          imageType,
          `media/${response.fileNameWithExtension}`,
          internalRelationship
        );

        const imageBuffer = Buffer.from(response.fileContent, 'base64');
        const imageProperties = sizeOf(imageBuffer);

        attributes.inlineOrAnchored = true;
        attributes.relationshipId = documentRelsId;
        attributes.id = response.id;
        attributes.fileContent = response.fileContent;
        attributes.fileNameWithExtension = response.fileNameWithExtension;

        attributes.maximumWidth =
          attributes.maximumWidth || docxDocumentInstance.availableDocumentSpace;
        attributes.originalWidth = imageProperties.width;
        attributes.originalHeight = imageProperties.height

        computeImageDimensions(vNode, attributes);
      }

      const { type, inlineOrAnchored, ...otherAttributes } = attributes;
      // eslint-disable-next-line no-use-before-define
      const imageFragment = buildDrawing(inlineOrAnchored, type, otherAttributes);
      runFragment.import(imageFragment);
    }
  } else if (isVNode(vNode) && vNode.tagName === 'br') {
    const lineBreakFragment = buildLineBreak();
    runFragment.import(lineBreakFragment);
  }
  runFragment.up();

  return runFragment;
};

const buildRunOrRuns = async (vNode, attributes, docxDocumentInstance) => {
  if ((isVNode(vNode) || vNode?.isCoveringNode) && vNode.tagName === 'span') {
    let runFragments = [];

    for (let index = 0; index < vNode.children.length; index++) {
      const childVNode = vNode.children[index];

      const modifiedAttributes = modifiedStyleAttributesBuilder(
        docxDocumentInstance,
        vNode,
        attributes
      );

      const tempRunFragments = await buildRunOrHyperLink(childVNode, isVNode(childVNode) && childVNode.tagName === 'img'
        ? { ...modifiedAttributes, type: 'picture', description: childVNode.properties.alt } : modifiedAttributes, docxDocumentInstance);
      runFragments = runFragments.concat(
        Array.isArray(tempRunFragments) ? tempRunFragments : [tempRunFragments]
      );
    }

    return runFragments;
  } else {
    const tempRunFragments = await buildRun(vNode, attributes, docxDocumentInstance);
    return tempRunFragments;
  }
};

const buildRunOrHyperLink = async (vNode, attributes, docxDocumentInstance) => {
  if (isVNode(vNode) && vNode.tagName === 'a') {
    const relationshipId = docxDocumentInstance.createDocumentRelationships(
      docxDocumentInstance.relationshipFilename,
      hyperlinkType,
      vNode.properties && vNode.properties.href ? vNode.properties.href : ''
    );
    const hyperlinkFragment = fragment({ namespaceAlias: { w: namespaces.w, r: namespaces.r } })
      .ele('@w', 'hyperlink')
      .att('@r', 'id', `rId${relationshipId}`);

    for (let idx = 0; idx < vNode.children.length; idx++) {
      const childVNode = vNode.children[idx];
      const modifiedAttributes =
        isVNode(childVNode) && childVNode.tagName === 'img'
          ? { ...attributes, type: 'picture', description: childVNode.properties.alt } : { ...attributes };
      modifiedAttributes.hyperlink = true;

      const runFragments = await buildRunOrRuns(
        childVNode,
        modifiedAttributes,
        docxDocumentInstance
      );
      if (Array.isArray(runFragments)) {
        for (let index = 0; index < runFragments.length; index++) {
          const runFragment = runFragments[index];

          hyperlinkFragment.import(runFragment);
        }
      } else {
        hyperlinkFragment.import(runFragments);
      }
    }

    hyperlinkFragment.up();

    return hyperlinkFragment;
  }
  // TODO: need to check if this case can occur somehow
  const modifiedAttributes = isVNode(vNode) && vNode.tagName === 'img' ? { ...attributes, type: 'picture', description: vNode.properties.alt } : attributes
  const runFragments = await buildRunOrRuns(vNode, modifiedAttributes, docxDocumentInstance);

  return runFragments;
};

const buildNumberingProperties = (levelId, numberingId) =>
  fragment({ namespaceAlias: { w: namespaces.w } })
    .ele('@w', 'numPr')
    .ele('@w', 'ilvl')
    .att('@w', 'val', String(levelId))
    .up()
    .ele('@w', 'numId')
    .att('@w', 'val', String(numberingId))
    .up()
    .up();

const buildNumberingInstances = () =>
  fragment({ namespaceAlias: { w: namespaces.w } })
    .ele('@w', 'num')
    .ele('@w', 'abstractNumId')
    .up()
    .up();

const buildSpacing = (lineSpacing, beforeSpacing, afterSpacing) => {
  const spacingFragment = fragment({ namespaceAlias: { w: namespaces.w } }).ele('@w', 'spacing');

  if (typeof lineSpacing === 'number' && lineSpacing >= 0) {
    spacingFragment.att('@w', 'line', lineSpacing);
  }
  if (typeof beforeSpacing === 'number' && beforeSpacing >= 0) {
    spacingFragment.att('@w', 'before', beforeSpacing);
  }
  if (typeof afterSpacing === 'number' && afterSpacing >= 0) {
    spacingFragment.att('@w', 'after', afterSpacing);
  }

  spacingFragment.att('@w', 'lineRule', 'auto').up();

  return spacingFragment;
};

const buildIndentation = ({ left, right }) => {
  const indentationFragment = fragment({
    namespaceAlias: { w: namespaces.w },
  }).ele('@w', 'ind');

  if (left) {
    indentationFragment.att('@w', 'left', left);
  }
  if (right) {
    indentationFragment.att('@w', 'right', right);
  }

  indentationFragment.up();

  return indentationFragment;
};

const buildPStyle = (style = 'Normal') =>
  fragment({ namespaceAlias: { w: namespaces.w } })
    .ele('@w', 'pStyle')
    .att('@w', 'val', style)
    .up();

const buildHorizontalAlignment = (horizontalAlignment) => {
  if (horizontalAlignment === 'justify') {
    horizontalAlignment = 'both';
  }
  return fragment({ namespaceAlias: { w: namespaces.w } })
    .ele('@w', 'jc')
    .att('@w', 'val', horizontalAlignment)
    .up();
};

const buildParagraphBorder = () => {
  const paragraphBorderFragment = fragment({ namespaceAlias: { w: namespaces.w } }).ele(
    '@w',
    'pBdr'
  );
  const bordersObject = cloneDeep(paragraphBordersObject);

  Object.keys(bordersObject).forEach((borderName) => {
    if (bordersObject[borderName]) {
      const { size, spacing, color } = bordersObject[borderName];

      const borderFragment = buildBorder(borderName, size, spacing, color);
      paragraphBorderFragment.import(borderFragment);
    }
  });

  paragraphBorderFragment.up();

  return paragraphBorderFragment;
};

const buildParagraphProperties = (attributes) => {
  const paragraphPropertiesFragment = fragment({ namespaceAlias: { w: namespaces.w } }).ele(
    '@w',
    'pPr'
  );
  if (attributes && attributes.constructor === Object) {
    Object.keys(attributes).forEach((key) => {
      switch (key) {
        case 'numbering':
          const { levelId, numberingId } = attributes[key];
          const numberingPropertiesFragment = buildNumberingProperties(levelId, numberingId);
          paragraphPropertiesFragment.import(numberingPropertiesFragment);
          // eslint-disable-next-line no-param-reassign
          delete attributes.numbering;
          break;
        case 'textAlign':
          const horizontalAlignmentFragment = buildHorizontalAlignment(attributes[key]);
          paragraphPropertiesFragment.import(horizontalAlignmentFragment);
          // eslint-disable-next-line no-param-reassign
          delete attributes.textAlign;
          break;
        case 'backgroundColor':
          // Add shading to Paragraph Properties only if display is block
          // Essentially if background color needs to be across the row
          if (attributes.display === 'block') {
            const shadingFragment = buildShading(attributes[key]);
            paragraphPropertiesFragment.import(shadingFragment);
            // FIXME: Inner padding in case of shaded paragraphs.
            const paragraphBorderFragment = buildParagraphBorder();
            paragraphPropertiesFragment.import(paragraphBorderFragment);
            // eslint-disable-next-line no-param-reassign
            delete attributes.backgroundColor;
          }
          break;
        case 'paragraphStyle':
          const pStyleFragment = buildPStyle(attributes.paragraphStyle);
          paragraphPropertiesFragment.import(pStyleFragment);
          delete attributes.paragraphStyle;
          break;
        case 'indentation':
          const indentationFragment = buildIndentation(attributes[key]);
          paragraphPropertiesFragment.import(indentationFragment);
          // eslint-disable-next-line no-param-reassign
          delete attributes.indentation;
          break;
        case 'textDecoration':
          const textDecorationFragment = buildTextDecoration(attributes[key]);
          paragraphPropertiesFragment.import(textDecorationFragment);
          // we don't delete attributes.textDecoration so that it could be inherited by children nodes.
          break;
      }
    });

    const spacingFragment = buildSpacing(
      attributes.lineHeight,
      attributes.beforeSpacing,
      attributes.afterSpacing
    );
    // eslint-disable-next-line no-param-reassign
    delete attributes.lineHeight;
    // eslint-disable-next-line no-param-reassign
    delete attributes.beforeSpacing;
    // eslint-disable-next-line no-param-reassign
    delete attributes.afterSpacing;

    paragraphPropertiesFragment.import(spacingFragment);
  }
  paragraphPropertiesFragment.up();

  return paragraphPropertiesFragment;
};

const calculateAbsoluteValues = (attribute, originalAttributeInEMU) => {
  if (attribute !== 'auto') {
    if (pixelRegex.test(attribute)) {
      return pixelToEMU(attribute.match(pixelRegex)[1]);
    } else if (percentageRegex.test(attribute)) {
      const percentageValue = attribute.match(percentageRegex)[1];
      return Math.round((percentageValue / 100) * originalAttributeInEMU);
    }
  }
  return originalAttributeInEMU;
};

const computeImageDimensions = (vNode, attributes) => {
  const { maximumWidth, originalWidth, originalHeight } = attributes;
  const aspectRatio = originalWidth / originalHeight;
  const maximumWidthInEMU = TWIPToEMU(maximumWidth);
  let originalWidthInEMU = pixelToEMU(originalWidth);
  let originalHeightInEMU = pixelToEMU(originalHeight);
  if (originalWidthInEMU > maximumWidthInEMU) {
    originalWidthInEMU = maximumWidthInEMU;
    originalHeightInEMU = Math.round(originalWidthInEMU / aspectRatio);
  }
  let modifiedHeight;
  let modifiedWidth;
  let modifiedMaxHeight;
  let modifiedMaxWidth;

  if (vNode?.properties?.style) {
    const styleWidth = vNode.properties.style.width;
    const styleHeight = vNode.properties.style.height;
    const styleMaxWidth = vNode.properties.style['max-width'];
    const styleMaxHeight = vNode.properties.style['max-height'];

    // style - width
    if (styleWidth) {
      modifiedWidth = calculateAbsoluteValues(styleWidth, originalWidthInEMU);
      if (styleWidth === 'auto' && styleHeight === 'auto') {
        modifiedHeight = originalHeightInEMU;
      }
    }

    // style - height
    if (styleHeight) {
      modifiedHeight = calculateAbsoluteValues(styleHeight, originalHeightInEMU);

      if (styleHeight !== 'auto') {
        if (percentageRegex.test(styleHeight)) {
          if (!modifiedWidth) {
            modifiedWidth = Math.round(modifiedHeight * aspectRatio);
          }
        }
      } else {
        // eslint-disable-next-line no-lonely-if
        if (modifiedWidth) {
          if (!modifiedHeight) {
            modifiedHeight = Math.round(modifiedWidth / aspectRatio);
          }
        } else {
          modifiedWidth = originalWidthInEMU;
        }
      }
    }

    // style - max width
    if (styleMaxWidth) {
      modifiedMaxWidth = calculateAbsoluteValues(styleMaxWidth, originalWidthInEMU);
      if (modifiedWidth) {
        modifiedWidth = modifiedWidth > modifiedMaxWidth ? modifiedMaxWidth : modifiedWidth;
      } else {
        modifiedWidth = modifiedMaxWidth;
      }
    }

    // style - max height
    if (styleMaxHeight) {
      modifiedMaxHeight = calculateAbsoluteValues(styleMaxHeight, originalHeightInEMU);
      if (modifiedHeight) {
        modifiedHeight = modifiedHeight > modifiedMaxHeight ? modifiedMaxHeight : modifiedHeight;
      } else {
        modifiedHeight = modifiedMaxHeight;
      }
    }
    if (modifiedWidth && !modifiedHeight) {
      modifiedHeight = Math.round(modifiedWidth / aspectRatio);
    } else if (modifiedHeight && !modifiedWidth) {
      modifiedWidth = Math.round(modifiedHeight * aspectRatio);
    }
  } else {
    modifiedWidth = originalWidthInEMU;
    modifiedHeight = originalHeightInEMU;
  }

  // eslint-disable-next-line no-param-reassign
  attributes.width = modifiedWidth;
  // eslint-disable-next-line no-param-reassign
  attributes.height = modifiedHeight;
};

const buildParagraph = async (vNode, attributes, docxDocumentInstance) => {
  const paragraphFragment = fragment({ namespaceAlias: { w: namespaces.w } }).ele('@w', 'p');
  const modifiedAttributes = modifiedStyleAttributesBuilder(
    docxDocumentInstance,
    vNode,
    attributes,
    {
      isParagraph: true,
    }
  );
  const paragraphPropertiesFragment = buildParagraphProperties(modifiedAttributes);
  paragraphFragment.import(paragraphPropertiesFragment);
  if (isVNode(vNode) && vNodeHasChildren(vNode)) {
    if (
      [
        'span',
        'strong',
        'b',
        'em',
        'i',
        'u',
        'ins',
        'strike',
        'del',
        's',
        'sub',
        'sup',
        'mark',
        'a',
        'code',
        'pre',
      ].includes(vNode.tagName)
    ) {
      const runOrHyperlinkFragments = await buildRunOrHyperLink(
        vNode,
        modifiedAttributes,
        docxDocumentInstance
      );
      if (Array.isArray(runOrHyperlinkFragments)) {
        for (
          let iteratorIndex = 0;
          iteratorIndex < runOrHyperlinkFragments.length;
          iteratorIndex++
        ) {
          const runOrHyperlinkFragment = runOrHyperlinkFragments[iteratorIndex];

          paragraphFragment.import(runOrHyperlinkFragment);
        }
      } else {
        paragraphFragment.import(runOrHyperlinkFragments);
      }
    } else if (vNode.tagName === 'blockquote') {
      const runFragmentOrFragments = await buildRun(vNode, attributes);
      if (Array.isArray(runFragmentOrFragments)) {
        for (let index = 0; index < runFragmentOrFragments.length; index++) {
          paragraphFragment.import(runFragmentOrFragments[index]);
        }
      } else {
        paragraphFragment.import(runFragmentOrFragments);
      }
    } else {
      for (let index = 0; index < vNode.children.length; index++) {
        const childVNode = vNode.children[index];
        if (childVNode.tagName === 'img') {
          let base64String;
          const imageSource = childVNode.properties.src;
          if (isValidUrl(imageSource)) {
            base64String = await imageToBase64(imageSource).catch((error) => {
              // eslint-disable-next-line no-console
              console.warn(`skipping image download and conversion due to ${error}`);
            });

            if (base64String && getMimeType(imageSource, base64String)) {
              childVNode.properties.src = `data:${getMimeType(imageSource, base64String)};base64, ${base64String}`;
            } else {
              break;
            }
          } else {
            // eslint-disable-next-line no-useless-escape, prefer-destructuring
            base64String = imageSource.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)[2];
          }
          const imageBuffer = Buffer.from(decodeURIComponent(base64String), 'base64');
          const imageProperties = sizeOf(imageBuffer);

          modifiedAttributes.maximumWidth =
            modifiedAttributes.maximumWidth || docxDocumentInstance.availableDocumentSpace;
          modifiedAttributes.originalWidth = imageProperties.width;
          modifiedAttributes.originalHeight = imageProperties.height;

          computeImageDimensions(childVNode, modifiedAttributes);
        }
        const runOrHyperlinkFragments = await buildRunOrHyperLink(
          childVNode,
          isVNode(childVNode) && childVNode.tagName === 'img'
            ? { ...modifiedAttributes, type: 'picture', description: childVNode.properties.alt }
            : modifiedAttributes,
          docxDocumentInstance
        );
        if (Array.isArray(runOrHyperlinkFragments)) {
          for (
            let iteratorIndex = 0;
            iteratorIndex < runOrHyperlinkFragments.length;
            iteratorIndex++
          ) {
            const runOrHyperlinkFragment = runOrHyperlinkFragments[iteratorIndex];

            paragraphFragment.import(runOrHyperlinkFragment);
          }
        } else {
          paragraphFragment.import(runOrHyperlinkFragments);
        }
      }
    }
  } else {
    // In case paragraphs has to be rendered where vText is present. Eg. table-cell
    // Or in case the vNode is something like img
    if (isVNode(vNode) && vNode.tagName === 'img') {
      const imageSource = vNode.properties.src;
      let base64String = imageSource;
      if (isValidUrl(imageSource)) {
        base64String = await imageToBase64(imageSource).catch((error) => {
          // eslint-disable-next-line no-console
          console.warn(`skipping image download and conversion due to ${error}`);
        });

        if (base64String && getMimeType(imageSource, base64String)) {
          vNode.properties.src = `data:${getMimeType(imageSource, base64String)};base64, ${base64String}`;
        } else {
          paragraphFragment.up();

          return paragraphFragment;
        }
      } else {
        // eslint-disable-next-line no-useless-escape, prefer-destructuring
        base64String = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)[2];
      }

      const imageBuffer = Buffer.from(decodeURIComponent(base64String), 'base64');
      const imageProperties = sizeOf(imageBuffer);

      modifiedAttributes.maximumWidth =
        modifiedAttributes.maximumWidth || docxDocumentInstance.availableDocumentSpace;
      modifiedAttributes.originalWidth = imageProperties.width;
      modifiedAttributes.originalHeight = imageProperties.height;

      computeImageDimensions(vNode, modifiedAttributes);
    }
    const runFragments = await buildRunOrRuns(vNode, modifiedAttributes, docxDocumentInstance);
    if (Array.isArray(runFragments)) {
      for (let index = 0; index < runFragments.length; index++) {
        const runFragment = runFragments[index];

        paragraphFragment.import(runFragment);
      }
    } else {
      paragraphFragment.import(runFragments);
    }
  }
  paragraphFragment.up();

  return paragraphFragment;
};

const buildGridSpanFragment = (spanValue) =>
  fragment({ namespaceAlias: { w: namespaces.w } })
    .ele('@w', 'gridSpan')
    .att('@w', 'val', spanValue)
    .up();

const buildTableCellSpacing = (cellSpacing = 0) =>
  fragment({ namespaceAlias: { w: namespaces.w } })
    .ele('@w', 'tblCellSpacing')
    .att('@w', 'w', cellSpacing)
    .att('@w', 'type', 'dxa')
    .up();

const buildTableCellBorders = (tableCellBorder) => {
  const tableCellBordersFragment = fragment({ namespaceAlias: { w: namespaces.w } }).ele(
    '@w',
    'tcBorders'
  );

  const { colors, strokes, ...borders } = tableCellBorder;
  Object.keys(borders).forEach((border) => {
    if (tableCellBorder[border]) {
      const borderFragment = buildBorder(
        border,
        tableCellBorder[border],
        0,
        colors[border],
        strokes[border]
      );
      tableCellBordersFragment.import(borderFragment);
    }
  });

  tableCellBordersFragment.up();

  return tableCellBordersFragment;
};

const buildTableCellWidth = (tableCellWidth, parentWidth) =>
  fragment({ namespaceAlias: { w: namespaces.w } })
    .ele('@w', 'tcW')
    .att('@w', 'w', fixupColumnWidth(tableCellWidth, parentWidth))
    .att('@w', 'type', 'dxa')
    .up();

const buildTableCellProperties = (attributes, parentWidth) => {
  const tableCellPropertiesFragment = fragment({ namespaceAlias: { w: namespaces.w } }).ele(
    '@w',
    'tcPr'
  );
  if (attributes && attributes.constructor === Object) {
    Object.keys(attributes).forEach((key) => {
      switch (key) {
        case 'backgroundColor':
          const shadingFragment = buildShading(attributes[key]);
          tableCellPropertiesFragment.import(shadingFragment);
          // eslint-disable-next-line no-param-reassign
          delete attributes.backgroundColor;
          break;
        case 'verticalAlign':
          const verticalAlignmentFragment = buildVerticalAlignment(attributes[key]);
          tableCellPropertiesFragment.import(verticalAlignmentFragment);
          // eslint-disable-next-line no-param-reassign
          delete attributes.verticalAlign;
          break;
        case 'colSpan':
          const gridSpanFragment = buildGridSpanFragment(attributes[key]);
          tableCellPropertiesFragment.import(gridSpanFragment);
          // eslint-disable-next-line no-param-reassign
          delete attributes.colSpan;
          break;
        case 'tableCellBorder':
          const { top, left, bottom, right } = attributes[key];
          if (top || bottom || left || right) {
            const tableCellBorderFragment = buildTableCellBorders(attributes[key]);
            tableCellPropertiesFragment.import(tableCellBorderFragment);
          }
          // eslint-disable-next-line no-param-reassign
          delete attributes.tableCellBorder;
          break;
        case 'rowSpan':
          const verticalMergeFragment = buildVerticalMerge(attributes[key]);
          tableCellPropertiesFragment.import(verticalMergeFragment);

          delete attributes.rowSpan;
          break;
        case 'width':
          const widthFragment = buildTableCellWidth(attributes[key], parentWidth);
          tableCellPropertiesFragment.import(widthFragment);
          delete attributes.width;
          break;
      }
    });
  }
  tableCellPropertiesFragment.up();

  return tableCellPropertiesFragment;
};

/**
 * 
 * @param {*} vNode Denotes the xml node
 * @param {obj} attributes Specifies attributes of the node
 * @param {obj} tableBorderOptions Denotes the tableBorderOptions given. Defaults to {}
 * @param {string} rowIndexEquivalent Denotes the row in which table cell is present
 * @param {string} columnIndexEquivalent Denotes the column in which table cell is present
 */
const fixupTableCellBorder = (vNode, attributes, tableBorderOptions = {}, rowIndexEquivalent, columnIndexEquivalent) => {
  let { color } = tableBorderOptions;
  const tableCellStyles = vNode.properties.style || {};
  // assign the properties if tableCellBorder is not present in attributes
  if (!attributes.tableCellBorder) {
    attributes.tableCellBorder = { strokes: {}, colors: {} };
  }
  const tableCellStyleKeys = Object.keys(tableCellStyles);

  const rowIndexEquivalentFirst = rowIndexEquivalent.indexOf('first')
  const rowIndexEquivalentLast = rowIndexEquivalent.indexOf('last')
  // here we are checking if the row is the first row in the table
  // we adjust the top border of the cell
  if (rowIndexEquivalentFirst !== -1) {
    const indexOfBorder = tableCellStyleKeys.lastIndexOf('border')
    const indexOfBorderTop = tableCellStyleKeys.lastIndexOf('border-top')
    const indexOfBorderTopWidth = tableCellStyleKeys.lastIndexOf('border-top-width')
    const indexOfBorderTopStyle = tableCellStyleKeys.lastIndexOf('border-top-style')
    const indexOfBorderTopColor = tableCellStyleKeys.lastIndexOf('border-top-color')
    // used to store the lastIndexes of properties if present
    // in html, properties order matter hence we need to see the order in 
    // which properties have arrived.
    // based on the indices, we sort in ascending order
    // then apply the properties accordingly.
    let indexes = []

    // if border style is given and it has hidden value
    // then no matter what are the properties of the cell border styles
    // those will be overwritten and we wont have the outer border
    if (indexOfBorderTopStyle !== -1 && tableCellStyles['border-top-style'] === 'hidden') {
      attributes.tableCellBorder.top = 0
      attributes.tableCellBorder.strokes.top = 'hidden'
    } else {
      if (indexOfBorder !== -1) {
        indexes.push({
          index: indexOfBorder,
          type: 'border'
        })
      }
      if (indexOfBorderTop !== -1) {
        indexes.push({
          index: indexOfBorderTop,
          type: 'border-top'
        })
      }
      if (indexOfBorderTopWidth !== -1) {
        indexes.push({
          index: indexOfBorderTopWidth,
          type: 'border-top-width'
        })
      }
      if (indexOfBorderTopColor !== -1) {
        indexes.push({
          index: indexOfBorderTopColor,
          type: 'border-top-color'
        })
      }
      if (indexOfBorderTopStyle !== -1) {
        indexes.push({
          index: indexOfBorderTopStyle,
          type: 'border-top-style'
        })
      }
      indexes.sort((a, b) => a.index - b.index)

      let borderSize = attributes.tableCellBorder.top;
      let borderColor = attributes.tableCellBorder.strokes.top;
      let borderStrike = attributes.tableCellBorder.colors.top;

      for (let idxItem = 0; idxItem < indexes.length; idxItem++) {
        if (indexes[idxItem].type === 'border' || indexes[idxItem].type === 'border-top') {
          [borderSize, borderStrike, borderColor] = cssBorderParser(
            tableCellStyles[indexes[idxItem].type],
            tableBorderOptions
          );
        } else if (indexes[idxItem].type === 'border-top-width') {
          borderSize = borderSizeParser(tableCellStyles[indexes[idxItem].type])
        } else if (indexes[idxItem].type === 'border-top-color') {
          borderColor = fixupColorCode(tableCellStyles[indexes[idxItem].type])
        } else {
          borderStrike = borderStyleParser(tableCellStyles[indexes[idxItem].type])
        }
      }

      // if there was no top attribute given to tableBorder or
      // current cell styles borderSize is greater than the table one
      // update the border styles
      if (!attributes.tableBorder.top || borderSize > attributes.tableBorder.top) {
        attributes.tableCellBorder.top = borderSize
        attributes.tableCellBorder.strokes.top = borderStrike
        attributes.tableCellBorder.colors.top = borderColor
      }
    }
  }

  // here we are checking if the row is the last row in the table
  // we adjust the bottom border of the cell
  if (rowIndexEquivalentLast !== -1) {
    const indexOfBorder = tableCellStyleKeys.lastIndexOf('border')
    const indexOfBorderBottom = tableCellStyleKeys.lastIndexOf('border-bottom')
    const indexOfBorderBottomWidth = tableCellStyleKeys.lastIndexOf('border-bottom-width')
    const indexOfBorderBottomStyle = tableCellStyleKeys.lastIndexOf('border-bottom-style')
    const indexOfBorderBottomColor = tableCellStyleKeys.lastIndexOf('border-bottom-color')
    // used to store the lastIndexes of properties if present
    // in html, properties order matter hence we need to see the order in 
    // which properties have arrived.
    // based on the indices, we sort in ascending order
    // then apply the properties accordingly.
    let indexes = []

    // if border style is given and it has hidden value
    // then no matter what are the properties of the cell border styles
    // those will be overwritten and we wont have the outer border
    if (indexOfBorderBottomStyle !== -1 && tableCellStyles['border-bottom-style'] === 'hidden') {
      attributes.tableCellBorder.bottom = 0
      attributes.tableCellBorder.strokes.bottom = 'hidden'
    } else {
      if (indexOfBorder !== -1) {
        indexes.push({
          index: indexOfBorder,
          type: 'border'
        })
      }
      if (indexOfBorderBottom !== -1) {
        indexes.push({
          index: indexOfBorderBottom,
          type: 'border-bottom'
        })
      }
      if (indexOfBorderBottomWidth !== -1) {
        indexes.push({
          index: indexOfBorderBottomWidth,
          type: 'border-bottom-width'
        })
      }
      if (indexOfBorderBottomColor !== -1) {
        indexes.push({
          index: indexOfBorderBottomColor,
          type: 'border-bottom-color'
        })
      }
      if (indexOfBorderBottomStyle !== -1) {
        indexes.push({
          index: indexOfBorderBottomStyle,
          type: 'border-bottom-style'
        })
      }
      indexes.sort((a, b) => a.index - b.index);

      let borderSize = attributes.tableCellBorder.bottom;
      let borderColor = attributes.tableCellBorder.strokes.bottom;
      let borderStrike = attributes.tableCellBorder.colors.bottom;

      for (let idxItem = 0; idxItem < indexes.length; idxItem++) {
        if (indexes[idxItem].type === 'border' || indexes[idxItem].type === 'border-bottom') {
          [borderSize, borderStrike, borderColor] = cssBorderParser(
            tableCellStyles[indexes[idxItem].type],
            tableBorderOptions
          );
        } else if (indexes[idxItem].type === 'border-bottom-width') {
          borderSize = borderSizeParser(tableCellStyles[indexes[idxItem].type])
        } else if (indexes[idxItem].type === 'border-bottom-color') {
          borderColor = fixupColorCode(tableCellStyles[indexes[idxItem].type])
        } else {
          borderStrike = borderStyleParser(tableCellStyles[indexes[idxItem].type])
        }
      }

      // if there was no bottom attribute given to tableBorder or
      // current cell styles borderSize is greater than the table one
      // update the border styles
      if (!attributes.tableBorder.bottom || borderSize > attributes.tableBorder.bottom) {
        attributes.tableCellBorder.bottom = borderSize
        attributes.tableCellBorder.strokes.bottom = borderStrike
        attributes.tableCellBorder.colors.bottom = borderColor
      }
    }
  }

  const columnIndexEquivalentFirst = columnIndexEquivalent.indexOf('first')
  const columnIndexEquivalentLast = columnIndexEquivalent.indexOf('last')

  // here we are checking if the column is the first column in the table
  // we adjust the left border of the cell
  if (columnIndexEquivalentFirst !== -1) {
    const indexOfBorder = tableCellStyleKeys.lastIndexOf('border')
    const indexOfBorderLeft = tableCellStyleKeys.lastIndexOf('border-left')
    const indexOfBorderLeftWidth = tableCellStyleKeys.lastIndexOf('border-left-width')
    const indexOfBorderLeftStyle = tableCellStyleKeys.lastIndexOf('border-left-style')
    const indexOfBorderLeftColor = tableCellStyleKeys.lastIndexOf('border-left-color')
    // used to store the lastIndexes of properties if present
    // in html, properties order matter hence we need to see the order in 
    // which properties have arrived.
    // based on the indices, we sort in ascending order
    // then apply the properties accordingly.
    let indexes = []

    // if border style is given and it has hidden value
    // then no matter what are the properties of the cell border styles
    // those will be overwritten and we wont have the outer border
    if (indexOfBorderLeftStyle !== -1 && tableCellStyles['border-left-style'] === 'hidden') {
      attributes.tableCellBorder.left = 0
      attributes.tableCellBorder.strokes.left = 'hidden'
    } else {
      if (indexOfBorder !== -1) {
        indexes.push({
          index: indexOfBorder,
          type: 'border'
        })
      }
      if (indexOfBorderLeft !== -1) {
        indexes.push({
          index: indexOfBorderLeft,
          type: 'border-left'
        })
      }
      if (indexOfBorderLeftWidth !== -1) {
        indexes.push({
          index: indexOfBorderLeftWidth,
          type: 'border-left-width'
        })
      }
      if (indexOfBorderLeftColor !== -1) {
        indexes.push({
          index: indexOfBorderLeftColor,
          type: 'border-left-color'
        })
      }
      if (indexOfBorderLeftStyle !== -1) {
        indexes.push({
          index: indexOfBorderLeftStyle,
          type: 'border-left-style'
        })
      }
      indexes.sort((a, b) => a.index - b.index);
      let borderSize = attributes.tableCellBorder.left;
      let borderColor = attributes.tableCellBorder.strokes.left;
      let borderStrike = attributes.tableCellBorder.colors.left;

      for (let idxItem = 0; idxItem < indexes.length; idxItem++) {
        if (indexes[idxItem].type === 'border' || indexes[idxItem].type === 'border-left') {
          [borderSize, borderStrike, borderColor] = cssBorderParser(
            tableCellStyles[indexes[idxItem].type],
            tableBorderOptions
          );
        } else if (indexes[idxItem].type === 'border-left-width') {
          borderSize = borderSizeParser(tableCellStyles[indexes[idxItem].type])
        } else if (indexes[idxItem].type === 'border-left-color') {
          borderColor = fixupColorCode(tableCellStyles[indexes[idxItem].type])
        } else {
          borderStrike = borderStyleParser(tableCellStyles[indexes[idxItem].type])
        }
      }

      // if there was no left attribute given to tableBorder or
      // current cell styles borderSize is greater than the table one
      // update the border styles
      if (!attributes.tableBorder.left || borderSize > attributes.tableBorder.left) {
        attributes.tableCellBorder.left = borderSize
        attributes.tableCellBorder.strokes.left = borderStrike
        attributes.tableCellBorder.colors.left = borderColor
      }
    }
  }

  if (columnIndexEquivalentLast !== -1) {
    const indexOfBorder = tableCellStyleKeys.lastIndexOf('border')
    const indexOfBorderRight = tableCellStyleKeys.lastIndexOf('border-right')
    const indexOfBorderRightWidth = tableCellStyleKeys.lastIndexOf('border-right-width')
    const indexOfBorderRightStyle = tableCellStyleKeys.lastIndexOf('border-right-style')
    const indexOfBorderRightColor = tableCellStyleKeys.lastIndexOf('border-right-color')
    // used to store the lastIndexes of properties if present
    // in html, properties order matter hence we need to see the order in 
    // which properties have arrived.
    // based on the indices, we sort in ascending order
    // then apply the properties accordingly.
    let indexes = []

    // if border style is given and it has hidden value
    // then no matter what are the properties of the cell border styles
    // those will be overwritten and we wont have the outer border
    if (indexOfBorderRightStyle !== -1 && tableCellStyles['border-right-style'] === 'hidden') {
      attributes.tableCellBorder.right = 0
      attributes.tableCellBorder.strokes.right = 'hidden'
    } else {
      if (indexOfBorder !== -1) {
        indexes.push({
          index: indexOfBorder,
          type: 'border'
        })
      }
      if (indexOfBorderRight !== -1) {
        indexes.push({
          index: indexOfBorderRight,
          type: 'border-right'
        })
      }
      if (indexOfBorderRightWidth !== -1) {
        indexes.push({
          index: indexOfBorderRightWidth,
          type: 'border-right-width'
        })
      }
      if (indexOfBorderRightColor !== -1) {
        indexes.push({
          index: indexOfBorderRightColor,
          type: 'border-right-color'
        })
      }
      if (indexOfBorderRightStyle !== -1) {
        indexes.push({
          index: indexOfBorderRightStyle,
          type: 'border-right-style'
        })
      }
      indexes.sort((a, b) => a.index - b.index);

      let borderSize = attributes.tableCellBorder.right;
      let borderColor = attributes.tableCellBorder.strokes.right;
      let borderStrike = attributes.tableCellBorder.colors.right;

      for (let idxItem = 0; idxItem < indexes.length; idxItem++) {
        if (indexes[idxItem].type === 'border' || indexes[idxItem].type === 'border-right') {
          [borderSize, borderStrike, borderColor] = cssBorderParser(
            tableCellStyles[indexes[idxItem].type],
            tableBorderOptions
          );
        } else if (indexes[idxItem].type === 'border-right-width') {
          borderSize = borderSizeParser(tableCellStyles[indexes[idxItem].type])
        } else if (indexes[idxItem].type === 'border-right-color') {
          borderColor = fixupColorCode(tableCellStyles[indexes[idxItem].type])
        } else {
          borderStrike = borderStyleParser(tableCellStyles[indexes[idxItem].type])
        }
      }

      // if there was no right attribute given to tableBorder or
      // current cell styles borderSize is greater than the table one
      // update the border styles
      if (!attributes.tableBorder.right || borderSize > attributes.tableBorder.right) {
        attributes.tableCellBorder.right = borderSize
        attributes.tableCellBorder.strokes.right = borderStrike
        attributes.tableCellBorder.colors.right = borderColor
      }
    }
  }

  // for columnIndexEquivalentFirst, we have already processed left attributes
  // for columnIndexEquivalentLast, we have already processed right attributes
  // for rowIndexEquivalentFirst, we have already processed top attributes
  // for rowIndexEquivalentLast, we have already processed bottom attributes
  for (const tableCellStyle of tableCellStyleKeys) {
    if (tableCellStyle === 'border') {
      if (tableCellStyles[tableCellStyle] === 'none' || tableCellStyles[tableCellStyle] === 0) {
        const strokes = { ...setUpDirectionalBorderStroke('none') };
        const colors = { ...setUpDirectionalBorderColor(color) };

        // if we are at the first row, we already preprocessed the values
        // there is no need to reprocess them
        if (rowIndexEquivalentFirst !== -1) {
          delete strokes.top
          delete colors.top
        }

        // if we are at the last row, we already preprocessed the values
        // there is no need to reprocess them
        if (rowIndexEquivalentLast !== -1) {
          delete strokes.bottom
          delete colors.bottom
        }

        // if we are at the first column, we already preprocessed the values
        // there is no need to reprocess them
        if (columnIndexEquivalentFirst !== -1) {
          delete strokes.left
          delete colors.left
        }

        // if we are at the last column, we already preprocessed the values
        // there is no need to reprocess them
        if (columnIndexEquivalentLast !== -1) {
          delete strokes.right
          delete colors.right
        }
        attributes.tableCellBorder = {
          strokes: { ...attributes.tableCellBorder.strokes, ...strokes },
          colors: { ...attributes.tableCellBorder.colors, ...colors },
        };
      } else {
        // eslint-disable-next-line no-use-before-define
        const [borderSize, borderStroke, borderColor] = cssBorderParser(
          tableCellStyles[tableCellStyle],
          tableBorderOptions
        );

        const strokes = { ...setUpDirectionalBorderStroke(borderStroke) };
        const colors = { ...setUpDirectionalBorderColor(borderColor) };

        // if we are at the first row, we already preprocessed the values
        // there is no need to reprocess them
        if (rowIndexEquivalentFirst !== -1) {
          delete strokes.top
          delete colors.top
        }

        // if we are at the last row, we already preprocessed the values
        // there is no need to reprocess them
        if (rowIndexEquivalentLast !== -1) {
          delete strokes.bottom
          delete colors.bottom
        }

        // if we are at the first column, we already preprocessed the values
        // there is no need to reprocess them
        if (columnIndexEquivalentFirst !== -1) {
          delete strokes.left
          delete colors.left
        }

        // if we are at the last column, we already preprocessed the values
        // there is no need to reprocess them
        if (columnIndexEquivalentLast !== -1) {
          delete strokes.right
          delete colors.right
        }

        let top = rowIndexEquivalentFirst === -1 ? borderSize : (attributes.tableCellBorder.top || 0)
        let bottom = rowIndexEquivalentLast === -1 ? borderSize : (attributes.tableCellBorder.bottom || 0)
        let left = columnIndexEquivalentFirst === -1 ? borderSize : (attributes.tableCellBorder.left || 0)
        let right = columnIndexEquivalentLast === -1 ? borderSize : (attributes.tableCellBorder.right || 0)

        attributes.tableCellBorder = {
          top,
          bottom,
          left,
          right,
          colors: {
            ...attributes.tableCellBorder.colors, ...colors
          },
          strokes: {
            ...attributes.tableCellBorder.strokes, ...strokes
          },
        };

      }
    } else if (tableCellStyle === 'border-top') {
      // already processed
      if (rowIndexEquivalentFirst !== - 1) continue
      // checking both 0 and '0'
      if (tableCellStyles[tableCellStyle] === '0') {
        attributes.tableCellBorder = {
          ...attributes.tableCellBorder,
          top: 0,
        };
      } else {
        // eslint-disable-next-line no-use-before-define
        const [borderSize, borderStroke, borderColor] = cssBorderParser(
          tableCellStyles[tableCellStyle],
          tableBorderOptions
        );
        attributes.tableCellBorder = {
          ...attributes.tableCellBorder,
          top: borderSize,
          colors: { ...attributes.tableCellBorder.colors, top: borderColor },
          strokes: { ...attributes.tableCellBorder.strokes, top: borderStroke },
        };
      }
    } else if (tableCellStyle === 'border-bottom') {
      // already processed
      if (rowIndexEquivalentLast !== -1) continue
      // checking for both 0 and '0'
      if (tableCellStyles[tableCellStyle] == '0') {
        attributes.tableCellBorder = {
          ...attributes.tableCellBorder,
          bottom: 0,
        };
      } else {
        // eslint-disable-next-line no-use-before-define
        const [borderSize, borderStroke, borderColor] = cssBorderParser(
          tableCellStyles[tableCellStyle],
          tableBorderOptions
        );
        attributes.tableCellBorder = {
          ...attributes.tableCellBorder,
          bottom: borderSize,
          colors: { ...attributes.tableCellBorder.colors, bottom: borderColor },
          strokes: { ...attributes.tableCellBorder.strokes, bottom: borderStroke },
        };
      }
    } else if (tableCellStyle === 'border-left') {
      // already processed
      if (columnIndexEquivalentFirst !== -1) continue
      // checking for both 0 and '0'
      if (tableCellStyles[tableCellStyle] == '0') {
        attributes.tableCellBorder = {
          ...attributes.tableCellBorder,
          left: 0,
        };
      } else {
        // eslint-disable-next-line no-use-before-define
        const [borderSize, borderStroke, borderColor] = cssBorderParser(
          tableCellStyles[tableCellStyle],
          tableBorderOptions
        );
        attributes.tableCellBorder = {
          ...attributes.tableCellBorder,
          left: borderSize,
          colors: { ...attributes.tableCellBorder.colors, left: borderColor },
          strokes: { ...attributes.tableCellBorder.strokes, left: borderStroke },
        };
      }
    } else if (tableCellStyle === 'border-right') {
      // already processed
      if (columnIndexEquivalentLast !== -1) continue

      // checking for both 0 and '0'
      if (tableCellStyles[tableCellStyle] == '0') {
        attributes.tableCellBorder = {
          ...attributes.tableCellBorder,
          right: 0,
        };
      } else {
        // eslint-disable-next-line no-use-before-define
        const [borderSize, borderStroke, borderColor] = cssBorderParser(
          tableCellStyles[tableCellStyle],
          tableBorderOptions
        );
        attributes.tableCellBorder = {
          ...attributes.tableCellBorder,
          right: borderSize,
          colors: { ...attributes.tableCellBorder.colors, right: borderColor },
          strokes: { ...attributes.tableCellBorder.strokes, right: borderStroke },
        };
      }
    } else if (tableCellStyle === 'border-color') {
      const colors = { ...setUpDirectionalBorderColor(tableCellStyles[tableCellStyle]) };
      if (rowIndexEquivalentFirst !== -1) {
        delete colors.top;
      }
      if (rowIndexEquivalentLast !== -1) {
        delete colors.bottom
      }
      if (columnIndexEquivalentFirst !== -1) {
        delete colors.left
      }
      if (columnIndexEquivalentLast !== -1) {
        delete colors.right
      }
      attributes.tableCellBorder.colors = { ...attributes.tableCellBorder.colors, ...colors }
    } else if (tableCellStyle === 'border-left-color') {
      // processed already
      if (columnIndexEquivalentFirst !== -1) continue
      attributes.tableCellBorder.colors = { ...attributes.tableCellBorder.colors, left: fixupColorCode(tableCellStyles[tableCellStyle]) };
    } else if (tableCellStyle === 'border-right-color') {
      // processed already
      if (columnIndexEquivalentLast !== -1) continue
      attributes.tableCellBorder.colors = { ...attributes.tableCellBorder.colors, right: fixupColorCode(tableCellStyles[tableCellStyle]) };
    } else if (tableCellStyle === 'border-top-color') {
      // processed already
      if (rowIndexEquivalentFirst !== -1) continue
      attributes.tableCellBorder.colors = { ...attributes.tableCellBorder.colors, top: fixupColorCode(tableCellStyles[tableCellStyle]) };
    } else if (tableCellStyle === 'border-bottom-color') {
      // processed already
      if (rowIndexEquivalentLast !== -1) continue
      attributes.tableCellBorder.colors = { ...attributes.tableCellBorder.colors, bottom: fixupColorCode(tableCellStyles[tableCellStyle]) };
    } else if (tableCellStyle === 'border-style') {
      const strokes = { ...setUpDirectionalBorderStroke(borderStyleParser(tableCellStyles[tableCellStyle])) };
      if (rowIndexEquivalentFirst !== -1) {
        delete strokes.top
      }
      if (rowIndexEquivalentLast !== -1) {
        delete strokes.bottom
      }
      if (columnIndexEquivalentFirst !== -1) {
        delete strokes.left
      }
      if (columnIndexEquivalentLast !== -1) {
        delete strokes.right
      }
      attributes.tableCellBorder.strokes = { ...attributes.tableCellBorder.strokes, ...strokes }
    } else if (tableCellStyle === 'border-left-style') {
      // processed already
      if (columnIndexEquivalentFirst !== -1) continue
      attributes.tableCellBorder.strokes = { ...attributes.tableCellBorder.strokes, left: borderStyleParser(tableCellStyles[tableCellStyle]) }
    } else if (tableCellStyle === 'border-right-style') {
      // processed already
      if (columnIndexEquivalentLast !== -1) continue
      attributes.tableCellBorder.strokes = { ...attributes.tableCellBorder.strokes, right: borderStyleParser(tableCellStyles[tableCellStyle]) }
    } else if (tableCellStyle === 'border-top-style') {
      // processed already
      if (rowIndexEquivalentFirst !== - 1) continue
      attributes.tableCellBorder.strokes = { ...attributes.tableCellBorder.strokes, top: borderStyleParser(tableCellStyles[tableCellStyle]) }
    } else if (tableCellStyle === 'border-bottom-style') {
      // processed already
      if (rowIndexEquivalentLast !== -1) continue
      attributes.tableCellBorder.strokes = { ...attributes.tableCellBorder.strokes, bottom: borderStyleParser(tableCellStyles[tableCellStyle]) }
    } else if (tableCellStyle === 'border-width') {
      const width = borderSizeParser(tableCellStyle[tableCellStyle])
      if (rowIndexEquivalentFirst === -1) {
        attributes.tableCellBorder.top = width
      }
      if (rowIndexEquivalentLast === -1) {
        attributes.tableCellBorder.bottom = width
      }
      if (columnIndexEquivalentFirst === -1) {
        attributes.tableCellBorder.left = width
      }
      if (columnIndexEquivalentLast === -1) {
        attributes.tableCellBorder.right = width
      }
    } else if (tableCellStyle === 'border-left-width') {
      // processed already
      if (columnIndexEquivalentFirst !== -1) continue
      attributes.tableCellBorder.left = borderSizeParser(tableCellStyles[tableCellStyle])
    } else if (tableCellStyle === 'border-right-width') {
      // processed already
      if (columnIndexEquivalentLast !== -1) continue
      attributes.tableCellBorder.right = borderSizeParser(tableCellStyles[tableCellStyle])
    } else if (tableCellStyle === 'border-top-width') {
      // processed already
      if (rowIndexEquivalentFirst !== - 1) continue
      attributes.tableCellBorder.top = borderSizeParser(tableCellStyles[tableCellStyle])
    } else if (tableCellStyle === 'border-bottom-width') {
      // processed already
      if (rowIndexEquivalentLast !== -1) continue
      attributes.tableCellBorder.bottom = borderSizeParser(tableCellStyles[tableCellStyle])
    }
  }
};

/**
 * 
 * @param {any} vNode Current working XML node
 * @param {obj} attributes Attributes of the node
 * @param {map} rowSpanMap Map denoting the row span for table cells
 * @param {obj} columnIndex Holds the index of the current column
 * @param {any} docxDocumentInstance Instance of the docx document
 * @param {string} rowIndexEquivalent Denotes the row in which table cell is present
 * @param {string} columnIndexEquivalent Denotes the column in which table cell is present
 * @param {number} parentWidth Width of the parent element
 * @returns 
 */
const buildTableCell = async (vNode, attributes, rowSpanMap, columnIndex, docxDocumentInstance, rowIndexEquivalent, columnIndexEquivalent, parentWidth) => {
  const tableCellFragment = fragment({ namespaceAlias: { w: namespaces.w } }).ele('@w', 'tc');
  let modifiedAttributes = { ...attributes };

  // store the original attributes in case we need to revert back
  const originalTopAttributes = {
    stroke: modifiedAttributes.tableCellBorder.strokes.top,
    color: modifiedAttributes.tableCellBorder.colors.top,
    size: modifiedAttributes.tableCellBorder.top,
  }
  const originalBottomAttributes = {
    stroke: modifiedAttributes.tableCellBorder.strokes.bottom,
    color: modifiedAttributes.tableCellBorder.colors.bottom,
    size: modifiedAttributes.tableCellBorder.bottom,
  }
  const originalLeftAttributes = {
    stroke: modifiedAttributes.tableCellBorder.strokes.left,
    color: modifiedAttributes.tableCellBorder.colors.left,
    size: modifiedAttributes.tableCellBorder.left,
  }
  const originalRightAttributes = {
    stroke: modifiedAttributes.tableCellBorder.strokes.right,
    color: modifiedAttributes.tableCellBorder.colors.right,
    size: modifiedAttributes.tableCellBorder.right,
  }

  const rowIndexEquivalentFirst = rowIndexEquivalent.indexOf('first')
  const rowIndexEquivalentLast = rowIndexEquivalent.indexOf('last')

  const columnIndexEquivalentFirst = columnIndexEquivalent.indexOf('first')
  const columnIndexEquivalentLast = columnIndexEquivalent.indexOf('last')

  // if table cell styles will be given, then below 4 are overridden
  if (rowIndexEquivalentFirst !== -1) {
    // it means that the cell is in first row
    // we set the top border of cells to table top border
    modifiedAttributes.tableCellBorder.strokes.top = modifiedAttributes.tableBorder.strokes.top;
    modifiedAttributes.tableCellBorder.colors.top = modifiedAttributes.tableBorder.colors.top;
    modifiedAttributes.tableCellBorder.top = modifiedAttributes.tableBorder.top || docxDocumentInstance.tableBorders.size;
  }

  if (rowIndexEquivalentLast !== -1) {
    // it means that the cell is in last row
    // we set the bottom border of cells to that of table
    modifiedAttributes.tableCellBorder.strokes.bottom = modifiedAttributes.tableBorder.strokes.bottom;
    modifiedAttributes.tableCellBorder.colors.bottom = modifiedAttributes.tableBorder.colors.bottom;
    modifiedAttributes.tableCellBorder.bottom = modifiedAttributes.tableBorder.bottom || docxDocumentInstance.tableBorders.size;
  }

  if (columnIndexEquivalentFirst !== -1) {
    // it means that the cell is in first column
    // we set the left border of cells to that of table
    modifiedAttributes.tableCellBorder.strokes.left = modifiedAttributes.tableBorder.strokes.left;
    modifiedAttributes.tableCellBorder.colors.left = modifiedAttributes.tableBorder.colors.left;
    modifiedAttributes.tableCellBorder.left = modifiedAttributes.tableBorder.left || docxDocumentInstance.tableBorders.size;
  }

  if (columnIndexEquivalentLast !== -1) {
    // it means that the cell is in last column
    // we set the right border of cells to that of table
    modifiedAttributes.tableCellBorder.strokes.right = modifiedAttributes.tableBorder.strokes.right;
    modifiedAttributes.tableCellBorder.colors.right = modifiedAttributes.tableBorder.colors.right;
    modifiedAttributes.tableCellBorder.right = modifiedAttributes.tableBorder.right || docxDocumentInstance.tableBorders.size;
  }

  if (isVNode(vNode) && vNode.properties) {
    if (vNode.properties.rowSpan) {
      // if rowSpan is happening, then there must be some border properties.
      const spanObject = { rowSpan: vNode.properties.rowSpan - 1, colSpan: 0 };
      const { style } = vNode.properties;
      const styleKeys = Object.keys(style)
      for (const styleKey of styleKeys) {
        // separately set the properties for 4 directions in case shorthands are given
        // as we use directional properties indiviually to generate border
        if (styleKey === 'border') {
          spanObject['border-left'] = style[styleKey];
          spanObject['border-right'] = style[styleKey];
          spanObject['border-top'] = style[styleKey];
          spanObject['border-bottom'] = style[styleKey];
        } else if (styleKey === 'border-width') {
          spanObject['border-width-top'] = style[styleKey];
          spanObject['border-width-bottom'] = style[styleKey];
          spanObject['border-width-right'] = style[styleKey];
          spanObject['border-width-left'] = style[styleKey];
        } else if (styleKey === 'border-color') {
          spanObject['border-color-top'] = style[styleKey];
          spanObject['border-color-bottom'] = style[styleKey];
          spanObject['border-color-right'] = style[styleKey];
          spanObject['border-color-left'] = style[styleKey];
        } else if (styleKey === 'border-style') {
          spanObject['border-style-top'] = style[styleKey];
          spanObject['border-style-bottom'] = style[styleKey];
          spanObject['border-style-right'] = style[styleKey];
          spanObject['border-style-left'] = style[styleKey];
        } else {
          spanObject[styleKey] = style[styleKey];
        }
      }
      rowSpanMap.set(columnIndex.index, spanObject);
      modifiedAttributes.rowSpan = 'restart';
    } else {
      const previousSpanObject = rowSpanMap.get(columnIndex.index);
      let spanObject = {
      };
      if (previousSpanObject) {
        spanObject = cloneDeep(spanObject)
      }
      spanObject = {
        ...spanObject, rowSpan: 0,
        colSpan: (previousSpanObject && previousSpanObject.colSpan) || 0,
      }
      rowSpanMap.set(
        columnIndex.index,
        // eslint-disable-next-line prefer-object-spread
        Object.assign({}, previousSpanObject, spanObject)
      );
    }
    if (
      vNode.properties.colSpan ||
      (vNode.properties.style && vNode.properties.style['column-span'])
    ) {
      modifiedAttributes.colSpan =
        vNode.properties.colSpan ||
        (vNode.properties.style && vNode.properties.style['column-span']);
      const previousSpanObject = rowSpanMap.get(columnIndex.index);
      rowSpanMap.set(
        columnIndex.index,
        // eslint-disable-next-line prefer-object-spread
        Object.assign({}, previousSpanObject, {
          colSpan: parseInt(modifiedAttributes.colSpan) || 0,
        })
      );
      columnIndex.index += parseInt(modifiedAttributes.colSpan) - 1;
    }

    // style attribute is given to table cell
    if (vNode.properties.style) {
      modifiedAttributes = {
        ...modifiedAttributes,
        ...modifiedStyleAttributesBuilder(docxDocumentInstance, vNode, attributes),
      };
      fixupTableCellBorder(vNode, modifiedAttributes, docxDocumentInstance.tableBorders, rowIndexEquivalent, columnIndexEquivalent);
    } else {
      // no style attribute was given to the table cell

      // Table tag was given the border attribute
      if (attributes.isTableBorderAttributeGiven) {
        // If border-style to table was kept as none
        // In those cases, we need to revert back to original border style
        // It is because the table cells would still have border
        // due to the table border attribute
        // original attributes are only given to the outer cells of the table
        // for inner cells the logic is defined with comments below
        if (attributes.tableBorder.strokes.top === 'none') {
          if (rowIndexEquivalentFirst !== -1) {
            modifiedAttributes.tableCellBorder.strokes.top = originalTopAttributes.stroke
            modifiedAttributes.tableCellBorder.colors.top = originalTopAttributes.color
            modifiedAttributes.tableCellBorder.top = originalTopAttributes.size
          }
        }
        if (attributes.tableBorder.strokes.bottom === 'none') {
          if (rowIndexEquivalentLast !== -1) {
            modifiedAttributes.tableCellBorder.strokes.bottom = originalBottomAttributes.stroke
            modifiedAttributes.tableCellBorder.colors.bottom = originalBottomAttributes.color
            modifiedAttributes.tableCellBorder.bottom = originalBottomAttributes.size
          }
        }
        if (attributes.tableBorder.strokes.left === 'none') {
          if (columnIndexEquivalentFirst !== -1) {
            modifiedAttributes.tableCellBorder.strokes.left = originalLeftAttributes.stroke
            modifiedAttributes.tableCellBorder.colors.left = originalLeftAttributes.color
            modifiedAttributes.tableCellBorder.left = originalLeftAttributes.size
          }
        }
        if (attributes.tableBorder.strokes.right === 'none') {
          if (columnIndexEquivalentLast !== -1) {
            modifiedAttributes.tableCellBorder.strokes.right = originalRightAttributes.stroke
            modifiedAttributes.tableCellBorder.colors.right = originalRightAttributes.color
            modifiedAttributes.tableCellBorder.right = originalRightAttributes.size
          }
        }

        const { size, stroke } = defaultTableBorderAttributeOptions
        // here we are talking of inner cells
        // we havent provided any styling to the td cells
        // they will have 1px solid <color> border
        // this is because border attribute was given to table tag
        if (rowIndexEquivalentFirst === -1) {
          modifiedAttributes.tableCellBorder.strokes.top = stroke
          modifiedAttributes.tableCellBorder.colors.top = docxDocumentInstance.tableBorders.color
          modifiedAttributes.tableCellBorder.top = size
        }
        if (rowIndexEquivalentLast === -1) {
          modifiedAttributes.tableCellBorder.strokes.bottom = stroke
          modifiedAttributes.tableCellBorder.colors.bottom = docxDocumentInstance.tableBorders.color
          modifiedAttributes.tableCellBorder.bottom = size
        }
        if (columnIndexEquivalentFirst === -1) {
          modifiedAttributes.tableCellBorder.strokes.left = stroke
          modifiedAttributes.tableCellBorder.colors.left = docxDocumentInstance.tableBorders.color
          modifiedAttributes.tableCellBorder.left = size
        }
        if (columnIndexEquivalentLast === -1) {
          modifiedAttributes.tableCellBorder.strokes.right = stroke
          modifiedAttributes.tableCellBorder.colors.right = docxDocumentInstance.tableBorders.color
          modifiedAttributes.tableCellBorder.right = size
        }
      }

    }
  }
  const tableCellPropertiesFragment = buildTableCellProperties(modifiedAttributes, parentWidth);
  tableCellFragment.import(tableCellPropertiesFragment);
  if (vNodeHasChildren(vNode)) {
    for (let index = 0; index < vNode.children.length; index++) {
      const childVNode = vNode.children[index];
      if (isVNode(childVNode) && childVNode.tagName === 'img') {
        const imageFragment = await buildImage(
          docxDocumentInstance,
          childVNode,
          modifiedAttributes.maximumWidth
        );
        if (imageFragment) {
          tableCellFragment.import(imageFragment);
        }
      } else if (isVNode(childVNode) && childVNode.tagName === 'figure') {
        if (vNodeHasChildren(childVNode)) {
          // eslint-disable-next-line no-plusplus
          for (let iteratorIndex = 0; iteratorIndex < childVNode.children.length; iteratorIndex++) {
            const grandChildVNode = childVNode.children[iteratorIndex];
            if (grandChildVNode.tagName === 'img') {
              const imageFragment = await buildImage(
                docxDocumentInstance,
                grandChildVNode,
                modifiedAttributes.maximumWidth
              );
              if (imageFragment) {
                tableCellFragment.import(imageFragment);
              }
            }
          }
        }
      } else if (isVNode(childVNode) && ['ul', 'ol'].includes(childVNode.tagName)) {
        // render list in table
        if (vNodeHasChildren(childVNode)) {
          await buildList(childVNode, docxDocumentInstance, tableCellFragment);
        }
      } else {
        const paragraphFragment = await buildParagraph(
          childVNode,
          modifiedAttributes,
          docxDocumentInstance
        );

        tableCellFragment.import(paragraphFragment);
      }
    }
  } else {
    // TODO: Figure out why building with buildParagraph() isn't working
    const paragraphFragment = fragment({ namespaceAlias: { w: namespaces.w } })
      .ele('@w', 'p')
      .up();
    tableCellFragment.import(paragraphFragment);
  }
  tableCellFragment.up();

  return tableCellFragment;
};

/**
 * 
 * @param {map} rowSpanMap map denoting the row span for table cells
 * @param {obj} columnIndex obj denoting the index of the current column
 * @param {obj} attributes attributes of the table cell
 * @param {obj} tableBorderOptions options for the table border
 * @param {number} parentWidth width of the parent element
 * @returns {any} Returns the row span cell fragment
 */
const buildRowSpanCell = (rowSpanMap, columnIndex, attributes, tableBorderOptions, parentWidth) => {
  const rowSpanCellFragments = [];
  let spanObject = rowSpanMap.get(columnIndex.index);
  while (spanObject && spanObject.rowSpan) {
    const rowSpanCellFragment = fragment({ namespaceAlias: { w: namespaces.w } }).ele('@w', 'tc');
    const cellProperties = {
      ...attributes,
      rowSpan: 'continue',
      colSpan: spanObject.colSpan ? spanObject.colSpan : 0,
      tableCellBorder: { strokes: {}, colors: {} },
    };

    const spanObjectKeys = Object.keys(spanObject)

    for (const spanObjectKey of spanObjectKeys) {
      if (spanObject === 'border') {
        const [borderSize, borderStroke, borderColor] = cssBorderParser(spanObject[spanObjectKey], tableBorderOptions);
        setUpDirectionalBorderSize(cellProperties.tableCellBorder, borderSize)
        cellProperties.tableCellBorder = {
          ...cellProperties.tableCellBorder,
          colors: { ...cellProperties.tableCellBorder.colors, left: borderColor },
          strokes: { ...cellProperties.tableCellBorder.strokes, left: borderStroke },
        };
      } else if (spanObjectKey === 'border-left') {
        const [borderSize, borderStroke, borderColor] = cssBorderParser(spanObject[spanObjectKey], tableBorderOptions);
        cellProperties.tableCellBorder = {
          ...cellProperties.tableCellBorder,
          left: borderSize,
          colors: { ...cellProperties.tableCellBorder.colors, left: borderColor },
          strokes: { ...cellProperties.tableCellBorder.strokes, left: borderStroke },
        };
      } else if (spanObjectKey === 'border-right') {
        const [borderSize, borderStroke, borderColor] = cssBorderParser(spanObject[spanObjectKey], tableBorderOptions);
        cellProperties.tableCellBorder = {
          ...cellProperties.tableCellBorder,
          right: borderSize,
          colors: { ...cellProperties.tableCellBorder.colors, right: borderColor },
          strokes: { ...cellProperties.tableCellBorder.strokes, right: borderStroke },
        };
      } else if (spanObjectKey === 'border-top') {
        const [borderSize, borderStroke, borderColor] = cssBorderParser(spanObject[spanObjectKey], tableBorderOptions);
        cellProperties.tableCellBorder = {
          ...cellProperties.tableCellBorder,
          top: borderSize,
          colors: { ...cellProperties.tableCellBorder.colors, top: borderColor },
          strokes: { ...cellProperties.tableCellBorder.strokes, top: borderStroke },
        };
      } else if (spanObjectKey === 'border-bottom') {
        const [borderSize, borderStroke, borderColor] = cssBorderParser(spanObject[spanObjectKey], tableBorderOptions);
        cellProperties.tableCellBorder = {
          ...cellProperties.tableCellBorder,
          bottom: borderSize,
          colors: { ...cellProperties.tableCellBorder.colors, bottom: borderColor },
          strokes: { ...cellProperties.tableCellBorder.strokes, bottom: borderStroke },
        };
      } else if (spanObjectKey === 'border-color') {
        cellProperties.tableCellBorder = {
          ...cellProperties.tableCellBorder,
          colors: { ...setUpDirectionalBorderColor(fixupColorCode(spanObject[spanObjectKey])) }
        }
      } else if (spanObjectKey === 'border-left-color') {
        cellProperties.tableCellBorder.colors = { ...cellProperties.tableCellBorder.colors, left: fixupColorCode(spanObject[spanObjectKey]) };
      } else if (spanObjectKey === 'border-right-color') {
        cellProperties.tableCellBorder.colors = { ...cellProperties.tableCellBorder.colors, right: fixupColorCode(spanObject[spanObjectKey]) };
      } else if (spanObjectKey === 'border-top-color') {
        cellProperties.tableCellBorder.colors = { ...cellProperties.tableCellBorder.colors, top: fixupColorCode(spanObject[spanObjectKey]) };
      } else if (spanObjectKey === 'border-top-color') {
        tableBorders.colors = { ...tableBorders.colors, top: fixupColorCode(spanObject[spanObjectKey]) };
      } else if (spanObjectKey === 'border-style') {
        cellProperties.tableCellBorder = {
          ...cellProperties.tableCellBorder,
          strokes: { ...setUpDirectionalBorderStroke(borderStyleParser(spanObject[spanObjectKey])) }
        }
      }
      else if (spanObjectKey === 'border-left-style') {
        cellProperties.tableCellBorder.strokes = { ...cellProperties.tableCellBorder.strokes, left: borderStyleParser(spanObject[spanObjectKey]) }
      } else if (spanObjectKey === 'border-right-style') {
        cellProperties.tableCellBorder.strokes = { ...cellProperties.tableCellBorder.strokes, right: borderStyleParser(spanObject[spanObjectKey]) }
      } else if (spanObjectKey === 'border-top-style') {
        cellProperties.tableCellBorder.strokes = { ...cellProperties.tableCellBorder.strokes, top: borderStyleParser(spanObject[spanObjectKey]) }
      } else if (spanObjectKey === 'border-bottom-style') {
        cellProperties.tableCellBorder.strokes = { ...cellProperties.tableCellBorder.strokes, bottom: borderStyleParser(spanObject[spanObjectKey]) }
      } else if (spanObjectKey === 'border-width') {
        setUpDirectionalBorderSize(cellProperties.tableCellBorder, spanObject[spanObjectKey])
      } else if (spanObjectKey === 'border-left-width') {
        cellProperties.tableCellBorder.left = borderSizeParser(spanObject[spanObjectKey])
      } else if (spanObjectKey === 'border-right-width') {
        cellProperties.tableCellBorder.right = borderSizeParser(spanObject[spanObjectKey])
      } else if (spanObjectKey === 'border-top-width') {
        cellProperties.tableCellBorder.top = borderSizeParser(spanObject[spanObjectKey])
      } else if (spanObjectKey === 'border-bottom-width') {
        cellProperties.tableCellBorder.bottom = borderSizeParser(spanObject[spanObjectKey])
      }
    }

    const tableCellPropertiesFragment = buildTableCellProperties(cellProperties, parentWidth);
    rowSpanCellFragment.import(tableCellPropertiesFragment);

    const paragraphFragment = fragment({ namespaceAlias: { w: namespaces.w } })
      .ele('@w', 'p')
      .up();
    rowSpanCellFragment.import(paragraphFragment);
    rowSpanCellFragment.up();

    rowSpanCellFragments.push(rowSpanCellFragment);

    if (spanObject.rowSpan - 1 === 0) {
      rowSpanMap.delete(columnIndex.index);
    } else {
      const updatedSpanObject = cloneDeep(spanObject)
      rowSpanMap.set(columnIndex.index, updatedSpanObject);
      updatedSpanObject.rowSpan = spanObject.rowSpan - 1
      updatedSpanObject.colSpan = spanObject.colSpan || 0
    }
    columnIndex.index += spanObject.colSpan || 1;
    spanObject = rowSpanMap.get(columnIndex.index);
  }

  return rowSpanCellFragments;
};

const buildTableRowProperties = (attributes) => {
  const tableRowPropertiesFragment = fragment({ namespaceAlias: { w: namespaces.w } }).ele(
    '@w',
    'trPr'
  );
  if (attributes && attributes.constructor === Object) {
    Object.keys(attributes).forEach((key) => {
      switch (key) {
        case 'tableRowHeight':
          const tableRowHeightFragment = buildTableRowHeight(attributes[key]);
          tableRowPropertiesFragment.import(tableRowHeightFragment);
          // eslint-disable-next-line no-param-reassign
          delete attributes.tableRowHeight;
          break;
        case 'rowCantSplit':
          if (attributes.rowCantSplit) {
            const cantSplitFragment = fragment({ namespaceAlias: { w: namespaces.w } })
              .ele('@w', 'cantSplit')
              .up();
            tableRowPropertiesFragment.import(cantSplitFragment);
            // eslint-disable-next-line no-param-reassign
            delete attributes.rowCantSplit;
          }
          break;
      }
    });
  }
  tableRowPropertiesFragment.up();
  return tableRowPropertiesFragment;
};

const isEmptyTableRow = (vNode) => {
  if (!vNode || !vNode.children || vNode.children.length === 0) {
    return true;
  }

  // Only check if the row has any cells, don't check cell contents
  const cells = vNode.children.filter(child => ['td', 'th'].includes(child.tagName));
  return cells.length === 0;
};

/**
 * Builds a table row fragment
 * 
 * @param {any} vNode  Denotes the current xml node
 * @param {obj} attributes Attributes of the node
 * @param {map} rowSpanMap stores the row span of the cells
 * @param {any} docxDocumentInstance Denotes the docx Document instance
 * @param {string} rowIndexEquivalent Denotes the row in which table cell is present
 * @returns {any} Returns the table row fragment
 */
const buildTableRow = async (vNode, attributes, rowSpanMap, docxDocumentInstance, rowIndexEquivalent) => {
  // Skip empty rows
  if (isEmptyTableRow(vNode)) {
    return null;
  }

  const tableRowFragment = fragment({ namespaceAlias: { w: namespaces.w } }).ele('@w', 'tr');
  const modifiedAttributes = cloneDeep(attributes)

  if (isVNode(vNode) && vNode.properties) {
    // FIXME: find a better way to get row height from cell style
    if (
      (vNode.properties.style && vNode.properties.style.height) ||
      (vNode.children[0] &&
        isVNode(vNode.children[0]) &&
        vNode.children[0].properties.style &&
        vNode.children[0].properties.style.height)
    ) {
      const tableHeight = modifiedAttributes.height || docxDocumentInstance.pageSize.height
      modifiedAttributes.tableRowHeight = fixupRowHeight(
        (vNode.properties.style && vNode.properties.style.height) ||
        (vNode.children[0] &&
          isVNode(vNode.children[0]) &&
          vNode.children[0].properties.style &&
          vNode.children[0].properties.style.height
          ? vNode.children[0].properties.style.height
          : undefined),
        tableHeight
      );
    }
    if (vNode.properties.style) {
      // na in columnIndexEquivalent means not applicable and we are calling tableCellBorder from row
      fixupTableCellBorder(vNode, modifiedAttributes, docxDocumentInstance.tableBorders, rowIndexEquivalent, 'na');

      // if there are some styles provided to table row
      // then we need to pass these to the corresponding cells
      // if cells have same style attributes, they will get overridden with the cell values
      // else cells get these properties as happens in html
      // TODO: Might need to add more properties. As of writing, was able to find only these
      const tableRowStyles = vNode.properties.style
      const tableRowStlyeKeys = Object.keys(tableRowStyles)

      for (const tableRowStlyeKey of tableRowStlyeKeys) {
        const tableRowStyleValue = tableRowStyles[tableRowStlyeKey]
        if (tableRowStlyeKey === 'background-color' || tableRowStlyeKey === 'background') {
          if (!colorlessColors.includes(tableRowStyleValue)) {
            modifiedAttributes.backgroundColor = fixupColorCode(tableRowStyleValue);
          }
        } else if (tableRowStlyeKey === 'color') {
          if (!colorlessColors.includes(tableRowStyleValue)) {
            modifiedAttributes.color = fixupColorCode(tableRowStyleValue);
          }
        } else if (tableRowStlyeKey === 'font-size') {
          modifiedAttributes.fontSize = fixupFontSize(tableRowStyleValue, docxDocumentInstance);
        } else if (tableRowStlyeKey === 'font-family') {
          modifiedAttributes.font = docxDocumentInstance.createFont(tableRowStyleValue);
        } else if (tableRowStlyeKey === 'font-weight') {
          // FIXME: remove bold check when other font weights are handled.
          if (tableRowStyleValue === 'bold') {
            modifiedAttributes.strong = tableRowStyleValue;
          }
        }
      }
    }
  }

  const tableRowPropertiesFragment = buildTableRowProperties(modifiedAttributes);
  tableRowFragment.import(tableRowPropertiesFragment);

  const columnIndex = { index: 0 };

  const tableWidth = modifiedAttributes.width;
  if (vNodeHasChildren(vNode)) {
    const tableColumns = vNode.children.filter((childVNode) =>
      ['td', 'th'].includes(childVNode.tagName)
    );
    const maximumColumnWidth = docxDocumentInstance.availableDocumentSpace / tableColumns.length;

    // eslint-disable-next-line no-restricted-syntax
    for (const column of tableColumns) {
      const rowSpanCellFragments = buildRowSpanCell(rowSpanMap, columnIndex, modifiedAttributes, docxDocumentInstance.tableBorders, tableWidth);
      if (Array.isArray(rowSpanCellFragments)) {
        for (let iteratorIndex = 0; iteratorIndex < rowSpanCellFragments.length; iteratorIndex++) {
          const rowSpanCellFragment = rowSpanCellFragments[iteratorIndex];

          tableRowFragment.import(rowSpanCellFragment);
        }
      }
      const columnIndexEquivalent = setBorderIndexEquivalent(columnIndex.index, tableColumns.length);
      const tableCellFragment = await buildTableCell(
        column,
        { ...modifiedAttributes, maximumWidth: maximumColumnWidth },
        rowSpanMap,
        columnIndex,
        docxDocumentInstance,
        rowIndexEquivalent,
        columnIndexEquivalent,
        tableWidth
      );
      columnIndex.index++;

      tableRowFragment.import(tableCellFragment);
    }
  }

  if (columnIndex.index < rowSpanMap.size) {
    const rowSpanCellFragments = buildRowSpanCell(rowSpanMap, columnIndex, modifiedAttributes, docxDocumentInstance.tableBorders, tableWidth);
    if (Array.isArray(rowSpanCellFragments)) {
      for (let iteratorIndex = 0; iteratorIndex < rowSpanCellFragments.length; iteratorIndex++) {
        const rowSpanCellFragment = rowSpanCellFragments[iteratorIndex];

        tableRowFragment.import(rowSpanCellFragment);
      }
    }
  }

  tableRowFragment.up();

  return tableRowFragment;
};

const buildTableGridCol = (gridWidth) =>
  fragment({ namespaceAlias: { w: namespaces.w } })
    .ele('@w', 'gridCol')
    .att('@w', 'w', String(gridWidth));

const buildTableGrid = (vNode, attributes) => {
  const tableGridFragment = fragment({ namespaceAlias: { w: namespaces.w } }).ele('@w', 'tblGrid');
  if (vNodeHasChildren(vNode)) {
    const gridColumns = vNode.children.filter((childVNode) => childVNode.tagName === 'col');
    const gridWidth = attributes.maximumWidth / gridColumns.length;

    for (let index = 0; index < gridColumns.length; index++) {
      const tableGridColFragment = buildTableGridCol(gridWidth);
      tableGridFragment.import(tableGridColFragment);
    }
  }
  tableGridFragment.up();

  return tableGridFragment;
};

const buildTableGridFromTableRow = (vNode, attributes) => {
  const tableGridFragment = fragment({ namespaceAlias: { w: namespaces.w } }).ele('@w', 'tblGrid');
  if (vNodeHasChildren(vNode)) {
    const numberOfGridColumns = vNode.children.reduce((accumulator, childVNode) => {
      const colSpan =
        childVNode.properties.colSpan ||
        (childVNode.properties.style && childVNode.properties.style['column-span']);

      return accumulator + (colSpan ? parseInt(colSpan) : 1);
    }, 0);
    const gridWidth = attributes.maximumWidth / numberOfGridColumns;

    for (let index = 0; index < numberOfGridColumns; index++) {
      const tableGridColFragment = buildTableGridCol(gridWidth);
      tableGridFragment.import(tableGridColFragment);
    }
  }
  tableGridFragment.up();

  return tableGridFragment;
};

const buildTableBorders = (tableBorder) => {
  const tableBordersFragment = fragment({ namespaceAlias: { w: namespaces.w } }).ele(
    '@w',
    'tblBorders'
  );

  const { strokes, colors, ...borders } = tableBorder;

  Object.keys(borders).forEach((border) => {
    if (borders[border]) {
      const borderFragment = buildBorder(
        border,
        borders[border],
        0,
        colors[border],
        strokes[border]
      );
      tableBordersFragment.import(borderFragment);
    }
  });

  tableBordersFragment.up();

  return tableBordersFragment;
};

const buildTableWidth = (tableWidth) =>
  fragment({ namespaceAlias: { w: namespaces.w } })
    .ele('@w', 'tblW')
    .att('@w', 'type', 'dxa')
    .att('@w', 'w', String(tableWidth))
    .up();

const buildCellMargin = (side, margin) =>
  fragment({ namespaceAlias: { w: namespaces.w } })
    .ele('@w', side)
    .att('@w', 'type', 'dxa')
    .att('@w', 'w', String(margin))
    .up();

const buildTableCellMargins = (margin) => {
  const tableCellMarFragment = fragment({ namespaceAlias: { w: namespaces.w } }).ele(
    '@w',
    'tblCellMar'
  );

  ['top', 'bottom'].forEach((side) => {
    const marginFragment = buildCellMargin(side, margin / 2);
    tableCellMarFragment.import(marginFragment);
  });
  ['left', 'right'].forEach((side) => {
    const marginFragment = buildCellMargin(side, margin);
    tableCellMarFragment.import(marginFragment);
  });

  return tableCellMarFragment;
};

const buildTableProperties = (attributes) => {
  const tablePropertiesFragment = fragment({ namespaceAlias: { w: namespaces.w } }).ele(
    '@w',
    'tblPr'
  );

  if (attributes && attributes.constructor === Object) {
    Object.keys(attributes).forEach((key) => {
      switch (key) {
        case 'tableBorder':
          const { top, bottom, left, right } = attributes[key];
          if (top || bottom || left || right) {
            const tableBordersFragment = buildTableBorders(attributes[key]);
            tablePropertiesFragment.import(tableBordersFragment);
          }
          // eslint-disable-next-line no-param-reassign
          // delete attributes.tableBorder;
          break;
        case 'tableCellSpacing':
          if (attributes[key]) {
            const tableCellSpacingFragment = buildTableCellSpacing(attributes[key]);
            tablePropertiesFragment.import(tableCellSpacingFragment);
          }
          // eslint-disable-next-line no-param-reassign
          delete attributes.tableCellSpacing;
          break;
        case 'width':
          if (attributes[key]) {
            const tableWidthFragment = buildTableWidth(attributes[key]);
            tablePropertiesFragment.import(tableWidthFragment);
          }
          // eslint-disable-next-line no-param-reassign
          delete attributes.width;
          break;
      }
    });
  }
  const tableCellMarginFragment = buildTableCellMargins(160);
  tablePropertiesFragment.import(tableCellMarginFragment);

  // by default, all tables are center aligned.
  const alignmentFragment = buildHorizontalAlignment('center');
  tablePropertiesFragment.import(alignmentFragment);

  tablePropertiesFragment.up();

  return tablePropertiesFragment;
};

const buildTable = async (vNode, attributes, docxDocumentInstance) => {
  const tableFragment = fragment({ namespaceAlias: { w: namespaces.w } }).ele('@w', 'tbl');
  const modifiedAttributes = { ...attributes };
  if (isVNode(vNode) && vNode.properties) {
    const tableAttributes = vNode.properties.attributes || {};
    const tableStyles = vNode.properties.style || {};

    let { size: borderSize, stroke: borderStrike, color: borderColor } = docxDocumentInstance.tableBorders;
    const tableBorders = {
      strokes: { ...setUpDirectionalBorderStroke(borderStrike) },
      colors: { ...setUpDirectionalBorderColor(borderColor) },
    };
    const tableCellBorders = {
      // nil here because we dont know if borders will be given. 
      // If not, then we dont want to have any border
      strokes: setUpDirectionalBorderStroke(borderStrike),
      colors: setUpDirectionalBorderColor(borderColor)
    };
    // eslint-disable-next-line no-restricted-globals
    if (!isNaN(tableAttributes.border)) {
      modifiedAttributes.isTableBorderAttributeGiven = true
      const parsedNumber = parseInt(tableAttributes.border);
      // if border is kept as non-zero element, we change the borderSize
      if (parsedNumber) {
        borderSize = parsedNumber;
        // by default the borderStrike is solid if border attribute is present
        const { stroke } = defaultTableBorderAttributeOptions
        borderStrike = stroke;
        setUpDirectionalBorderSize(tableBorders, parsedNumber);
        tableBorders.strokes = setUpDirectionalBorderStroke(borderStrike);
        tableBorders.colors = setUpDirectionalBorderColor(borderColor)

        // in such cases, the inner cells also get a border of size 1
        // these are not overwritten by the css border property of table tag
        setUpDirectionalBorderSize(tableCellBorders, 1);
        tableCellBorders.strokes = setUpDirectionalBorderStroke(borderStrike);
        tableCellBorders.colors = setUpDirectionalBorderColor(borderColor);
      }
    } else if (tableAttributes.border) {
      modifiedAttributes.isTableBorderAttributeGiven = true

      const { stroke, size } = defaultTableBorderAttributeOptions

      // here we have passed a string which is not 0. In such cases, the borderSize becomes 1
      borderSize = size
      // the srtoke is solid by default
      borderStrike = stroke;

      setUpDirectionalBorderSize(tableBorders, borderSize);
      tableBorders.strokes = setUpDirectionalBorderStroke(borderStrike);
      tableBorders.colors = setUpDirectionalBorderColor(borderColor)

      // in such cases, the inner cells also get a border of size 1
      // these are not overwritten by the css border property of table tag
      setUpDirectionalBorderSize(tableCellBorders, 1)

      tableCellBorders.strokes = setUpDirectionalBorderStroke(borderStrike);
      tableCellBorders.colors = setUpDirectionalBorderColor(borderColor)
    }

    if (Object.keys(tableStyles).length !== 0) {
      for (const tableStyle of Object.keys(tableStyles)) {
        if (tableStyle === 'border') {
          const [cssSize, cssStroke, cssColor] = cssBorderParser(tableStyles.border, docxDocumentInstance.tableBorders);
          borderSize = cssSize ?? borderSize;
          borderColor = cssColor || borderColor;
          borderStrike = cssStroke || borderStrike;
          // TODO: Remove these comments when handling left and right borders
          setUpDirectionalBorderSize(tableBorders, borderSize)
          tableBorders.strokes = { ...setUpDirectionalBorderStroke(borderStrike) };
          tableBorders.colors = { ...setUpDirectionalBorderColor(borderColor) };
        } else if (tableStyle === 'border-collapse') {
          if (tableStyles[tableStyle] === 'collapse') {
            tableBorders.insideV = borderSize;
            tableBorders.insideH = borderSize;
            tableBorders.strokes = {
              ...tableBorders.strokes,
              insideH: borderStrike,
              insideV: borderStrike,
            };
            tableBorders.colors = {
              ...tableBorders.colors,
              insideH: borderColor,
              insideV: borderColor,
            };
          } else {
            tableBorders.insideV = 0;
            tableBorders.insideH = 0;
          }
        } else if (tableStyle === 'border-width') {
          setUpDirectionalBorderSize(tableBorders, borderSizeParser(tableStyles['border-width']))
        } else if (tableStyle === 'border-style') {
          tableBorders.strokes = { ...setUpDirectionalBorderStroke(borderStyleParser(tableStyles['border-style'])) }
        } else if (tableStyle === 'border-color') {
          tableBorders.colors = { ...setUpDirectionalBorderColor(fixupColorCode(tableStyles['border-color'])) }
        } else if (tableStyle === 'border-left') {
          const [borderThickness, borderStroke, borderStrokeColor] = cssBorderParser(
            tableStyles['border-left']
          );
          tableBorders.left = borderThickness;
          tableBorders.colors = { ...tableBorders.colors, left: borderStrokeColor };
          tableBorders.strokes = { ...tableBorders.strokes, left: borderStroke };
        } else if (tableStyle === 'border-right') {
          const [borderThickness, borderStroke, borderStrokeColor] = cssBorderParser(
            tableStyles['border-right']
          );
          tableBorders.right = borderThickness;
          tableBorders.colors = { ...tableBorders.colors, right: borderStrokeColor };
          tableBorders.strokes = { ...tableBorders.strokes, right: borderStroke };
        } else if (tableStyle === 'border-top') {
          const [borderThickness, borderStroke, borderStrokeColor] = cssBorderParser(
            tableStyles['border-top']
          );
          tableBorders.top = borderThickness;
          tableBorders.colors = { ...tableBorders.colors, top: borderStrokeColor };
          tableBorders.strokes = { ...tableBorders.strokes, top: borderStroke };
        } else if (tableStyle === 'border-bottom') {
          const [borderThickness, borderStroke, borderStrokeColor] = cssBorderParser(
            tableStyles['border-bottom']
          );
          tableBorders.bottom = borderThickness;
          tableBorders.colors = { ...tableBorders.colors, bottom: borderStrokeColor };
          tableBorders.strokes = { ...tableBorders.strokes, bottom: borderStroke };
        } else if (tableStyle === 'border-left-color') {
          tableBorders.colors = { ...tableBorders.colors, left: fixupColorCode(tableStyles[tableStyle]) };
        } else if (tableStyle === 'border-right-color') {
          tableBorders.colors = { ...tableBorders.colors, right: fixupColorCode(tableStyles[tableStyle]) };
        } else if (tableStyle === 'border-top-color') {
          tableBorders.colors = { ...tableBorders.colors, top: fixupColorCode(tableStyles[tableStyle]) };
        } else if (tableStyle === 'border-bottom-color') {
          tableBorders.colors = { ...tableBorders.colors, bottom: fixupColorCode(tableStyles[tableStyle]) };
        } else if (tableStyle === 'border-left-width') {
          tableBorders.left = borderSizeParser(tableStyles[tableStyle])
        } else if (tableStyle === 'border-right-width') {
          tableBorders.right = borderSizeParser(tableStyles[tableStyle])
        } else if (tableStyle === 'border-top-width') {
          tableBorders.top = borderSizeParser(tableStyles[tableStyle])
        } else if (tableStyle === 'border-bottom-width') {
          tableBorders.bottom = borderSizeParser(tableStyles[tableStyle])
        } else if (tableStyle === 'border-left-style') {
          tableBorders.strokes = { ...tableBorders.strokes, left: borderStyleParser(tableStyles[tableStyle]) }
        } else if (tableStyle === 'border-right-style') {
          tableBorders.strokes = { ...tableBorders.strokes, right: borderStyleParser(tableStyles[tableStyle]) }
        } else if (tableStyle === 'border-top-style') {
          tableBorders.strokes = { ...tableBorders.strokes, top: borderStyleParser(tableStyles[tableStyle]) }
        } else if (tableStyle === 'border-bottom-style') {
          tableBorders.strokes = { ...tableBorders.strokes, bottom: borderStyleParser(tableStyles[tableStyle]) }
        }
      }
    }

    modifiedAttributes.tableBorder = tableBorders;
    modifiedAttributes.tableCellSpacing = 0;
    if (Object.keys(tableCellBorders).length) {
      modifiedAttributes.tableCellBorder = tableCellBorders;
    }

    let minimumWidth;
    let maximumWidth;
    let width;
    // Calculate minimum width of table
    if (pixelRegex.test(tableStyles['min-width'])) {
      minimumWidth = pixelToTWIP(tableStyles['min-width'].match(pixelRegex)[1]);
    } else if (percentageRegex.test(tableStyles['min-width'])) {
      const percentageValue = tableStyles['min-width'].match(percentageRegex)[1];
      minimumWidth = Math.round((percentageValue / 100) * attributes.maximumWidth);
    }

    // Calculate maximum width of table
    if (pixelRegex.test(tableStyles['max-width'])) {
      pixelRegex.lastIndex = 0;
      maximumWidth = pixelToTWIP(tableStyles['max-width'].match(pixelRegex)[1]);
    } else if (percentageRegex.test(tableStyles['max-width'])) {
      percentageRegex.lastIndex = 0;
      const percentageValue = tableStyles['max-width'].match(percentageRegex)[1];
      maximumWidth = Math.round((percentageValue / 100) * attributes.maximumWidth);
    }

    // Calculate specified width of table
    if (pixelRegex.test(tableStyles.width)) {
      pixelRegex.lastIndex = 0;
      width = pixelToTWIP(tableStyles.width.match(pixelRegex)[1]);
    } else if (percentageRegex.test(tableStyles.width)) {
      percentageRegex.lastIndex = 0;
      const percentageValue = tableStyles.width.match(percentageRegex)[1];
      width = Math.round((percentageValue / 100) * attributes.maximumWidth);
    }

    // If width isn't supplied, we should have min-width as the width.
    if (width) {
      modifiedAttributes.width = width;
      if (maximumWidth) {
        modifiedAttributes.width = Math.min(modifiedAttributes.width, maximumWidth);
      }
      if (minimumWidth) {
        modifiedAttributes.width = Math.max(modifiedAttributes.width, minimumWidth);
      }
    } else if (minimumWidth) {
      modifiedAttributes.width = minimumWidth;
    }
    if (modifiedAttributes.width) {
      modifiedAttributes.width = Math.min(modifiedAttributes.width, attributes.maximumWidth);
    }

    if (tableStyles.height) {
      modifiedAttributes.height = fixupRowHeight(tableStyles.height, docxDocumentInstance.pageSize.height);
    }
  }
  const tablePropertiesFragment = buildTableProperties(modifiedAttributes);
  tableFragment.import(tablePropertiesFragment);

  // We need to avoid building table grid multiple times
  // So we use a bool variable to check if in for loop
  // have we already built the grid, and add conditions accordingly
  // multiple grids can cause issue with table rendering
  let isTableGridBuilt = false;
  const rowSpanMap = new Map();
  if (vNodeHasChildren(vNode)) {
    for (let index = 0; index < vNode.children.length; index++) {
      const childVNode = vNode.children[index];
      if (childVNode.tagName === 'colgroup' && !isTableGridBuilt) {
        const tableGridFragment = buildTableGrid(childVNode, modifiedAttributes);
        tableFragment.import(tableGridFragment);
        isTableGridBuilt = true;
      } else if (childVNode.tagName === 'thead') {
        for (let iteratorIndex = 0; iteratorIndex < childVNode.children.length; iteratorIndex++) {
          const grandChildVNode = childVNode.children[iteratorIndex];
          if (grandChildVNode.tagName === 'tr') {
            if (iteratorIndex === 0 && !isTableGridBuilt) {
              const tableGridFragment = buildTableGridFromTableRow(
                grandChildVNode,
                modifiedAttributes
              );
              tableFragment.import(tableGridFragment);
              isTableGridBuilt = false;
            }
            const tableRowFragment = await buildTableRow(
              grandChildVNode,
              modifiedAttributes,
              rowSpanMap,
              docxDocumentInstance,
              setBorderIndexEquivalent(iteratorIndex, childVNode.children.length)
            );
            if (tableRowFragment) {
              tableFragment.import(tableRowFragment);
            }
          }
        }
      } else if (childVNode.tagName === 'tbody') {
        for (let iteratorIndex = 0; iteratorIndex < childVNode.children.length; iteratorIndex++) {
          const grandChildVNode = childVNode.children[iteratorIndex];
          if (grandChildVNode.tagName === 'tr') {
            if (iteratorIndex === 0 && !isTableGridBuilt) {
              const tableGridFragment = buildTableGridFromTableRow(
                grandChildVNode,
                modifiedAttributes
              );
              tableFragment.import(tableGridFragment);
              isTableGridBuilt = true;
            }
            const tableRowFragment = await buildTableRow(
              grandChildVNode,
              modifiedAttributes,
              rowSpanMap,
              docxDocumentInstance,
              setBorderIndexEquivalent(iteratorIndex, childVNode.children.length)
            );
            if (tableRowFragment) {
              tableFragment.import(tableRowFragment);
            }
          }
        }
      } else if (childVNode.tagName === 'tr') {
        if (index === 0) {
          const tableGridFragment = buildTableGridFromTableRow(childVNode, modifiedAttributes);
          tableFragment.import(tableGridFragment);
        }
        const tableRowFragment = await buildTableRow(
          childVNode,
          modifiedAttributes,
          rowSpanMap,
          docxDocumentInstance,
          setBorderIndexEquivalent(index, vNode.children.length)
        );
        if (tableRowFragment) {
          tableFragment.import(tableRowFragment);
        }
      }
    }
  }
  tableFragment.up();

  return tableFragment;
};

const buildPresetGeometry = () =>
  fragment({ namespaceAlias: { a: namespaces.a } })
    .ele('@a', 'prstGeom')
    .att('prst', 'rect')
    .up();

const buildExtents = ({ width, height }) =>
  fragment({ namespaceAlias: { a: namespaces.a } })
    .ele('@a', 'ext')
    .att('cx', width)
    .att('cy', height)
    .up();

const buildOffset = () =>
  fragment({ namespaceAlias: { a: namespaces.a } })
    .ele('@a', 'off')
    .att('x', '0')
    .att('y', '0')
    .up();

const buildGraphicFrameTransform = (attributes) => {
  const graphicFrameTransformFragment = fragment({ namespaceAlias: { a: namespaces.a } }).ele(
    '@a',
    'xfrm'
  );

  const offsetFragment = buildOffset();
  graphicFrameTransformFragment.import(offsetFragment);
  const extentsFragment = buildExtents(attributes);
  graphicFrameTransformFragment.import(extentsFragment);

  graphicFrameTransformFragment.up();

  return graphicFrameTransformFragment;
};

const buildShapeProperties = (attributes) => {
  const shapeProperties = fragment({ namespaceAlias: { pic: namespaces.pic } }).ele('@pic', 'spPr');

  const graphicFrameTransformFragment = buildGraphicFrameTransform(attributes);
  shapeProperties.import(graphicFrameTransformFragment);
  const presetGeometryFragment = buildPresetGeometry();
  shapeProperties.import(presetGeometryFragment);

  shapeProperties.up();

  return shapeProperties;
};

const buildFillRect = () =>
  fragment({ namespaceAlias: { a: namespaces.a } })
    .ele('@a', 'fillRect')
    .up();

const buildStretch = () => {
  const stretchFragment = fragment({ namespaceAlias: { a: namespaces.a } }).ele('@a', 'stretch');

  const fillRectFragment = buildFillRect();
  stretchFragment.import(fillRectFragment);

  stretchFragment.up();

  return stretchFragment;
};

const buildSrcRectFragment = () =>
  fragment({ namespaceAlias: { a: namespaces.a } })
    .ele('@a', 'srcRect')
    .att('b', '0')
    .att('l', '0')
    .att('r', '0')
    .att('t', '0')
    .up();

const buildBinaryLargeImageOrPicture = (relationshipId) =>
  fragment({
    namespaceAlias: { a: namespaces.a, r: namespaces.r },
  })
    .ele('@a', 'blip')
    .att('@r', 'embed', `rId${relationshipId}`)
    // FIXME: possible values 'email', 'none', 'print', 'hqprint', 'screen'
    .att('cstate', 'print')
    .up();

const buildBinaryLargeImageOrPictureFill = (relationshipId) => {
  const binaryLargeImageOrPictureFillFragment = fragment({
    namespaceAlias: { pic: namespaces.pic },
  }).ele('@pic', 'blipFill');
  const binaryLargeImageOrPictureFragment = buildBinaryLargeImageOrPicture(relationshipId);
  binaryLargeImageOrPictureFillFragment.import(binaryLargeImageOrPictureFragment);
  const srcRectFragment = buildSrcRectFragment();
  binaryLargeImageOrPictureFillFragment.import(srcRectFragment);
  const stretchFragment = buildStretch();
  binaryLargeImageOrPictureFillFragment.import(stretchFragment);

  binaryLargeImageOrPictureFillFragment.up();

  return binaryLargeImageOrPictureFillFragment;
};

const buildNonVisualPictureDrawingProperties = () =>
  fragment({ namespaceAlias: { pic: namespaces.pic } })
    .ele('@pic', 'cNvPicPr')
    .up();

const buildNonVisualDrawingProperties = (
  pictureId,
  pictureNameWithExtension,
  pictureDescription = ''
) =>
  fragment({ namespaceAlias: { pic: namespaces.pic } })
    .ele('@pic', 'cNvPr')
    .att('id', pictureId)
    .att('name', pictureNameWithExtension)
    .att('descr', pictureDescription)
    .up();

const buildNonVisualPictureProperties = (
  pictureId,
  pictureNameWithExtension,
  pictureDescription
) => {
  const nonVisualPicturePropertiesFragment = fragment({
    namespaceAlias: { pic: namespaces.pic },
  }).ele('@pic', 'nvPicPr');
  // TODO: Handle picture attributes
  const nonVisualDrawingPropertiesFragment = buildNonVisualDrawingProperties(
    pictureId,
    pictureNameWithExtension,
    pictureDescription
  );
  nonVisualPicturePropertiesFragment.import(nonVisualDrawingPropertiesFragment);
  const nonVisualPictureDrawingPropertiesFragment = buildNonVisualPictureDrawingProperties();
  nonVisualPicturePropertiesFragment.import(nonVisualPictureDrawingPropertiesFragment);
  nonVisualPicturePropertiesFragment.up();

  return nonVisualPicturePropertiesFragment;
};

const buildPicture = ({
  id,
  fileNameWithExtension,
  description,
  relationshipId,
  width,
  height,
}) => {
  const pictureFragment = fragment({ namespaceAlias: { pic: namespaces.pic } }).ele('@pic', 'pic');
  const nonVisualPicturePropertiesFragment = buildNonVisualPictureProperties(
    id,
    fileNameWithExtension,
    description
  );
  pictureFragment.import(nonVisualPicturePropertiesFragment);
  const binaryLargeImageOrPictureFill = buildBinaryLargeImageOrPictureFill(relationshipId);
  pictureFragment.import(binaryLargeImageOrPictureFill);
  const shapeProperties = buildShapeProperties({ width, height });
  pictureFragment.import(shapeProperties);
  pictureFragment.up();

  return pictureFragment;
};

const buildGraphicData = (graphicType, attributes) => {
  const graphicDataFragment = fragment({ namespaceAlias: { a: namespaces.a } })
    .ele('@a', 'graphicData')
    .att('uri', 'http://schemas.openxmlformats.org/drawingml/2006/picture');
  if (graphicType === 'picture') {
    const pictureFragment = buildPicture(attributes);
    graphicDataFragment.import(pictureFragment);
  }
  graphicDataFragment.up();

  return graphicDataFragment;
};

const buildGraphic = (graphicType, attributes) => {
  const graphicFragment = fragment({ namespaceAlias: { a: namespaces.a } }).ele('@a', 'graphic');
  // TODO: Handle drawing type
  const graphicDataFragment = buildGraphicData(graphicType, attributes);
  graphicFragment.import(graphicDataFragment);
  graphicFragment.up();

  return graphicFragment;
};

const buildDrawingObjectNonVisualProperties = (pictureId, pictureName) =>
  fragment({ namespaceAlias: { wp: namespaces.wp } })
    .ele('@wp', 'docPr')
    .att('id', pictureId)
    .att('name', pictureName)
    .up();

const buildWrapSquare = () =>
  fragment({ namespaceAlias: { wp: namespaces.wp } })
    .ele('@wp', 'wrapSquare')
    .att('wrapText', 'bothSides')
    .att('distB', '228600')
    .att('distT', '228600')
    .att('distL', '228600')
    .att('distR', '228600')
    .up();

// eslint-disable-next-line no-unused-vars
const buildWrapNone = () =>
  fragment({ namespaceAlias: { wp: namespaces.wp } })
    .ele('@wp', 'wrapNone')
    .up();

const buildEffectExtentFragment = () =>
  fragment({ namespaceAlias: { wp: namespaces.wp } })
    .ele('@wp', 'effectExtent')
    .att('b', '0')
    .att('l', '0')
    .att('r', '0')
    .att('t', '0')
    .up();

const buildExtent = ({ width, height }) =>
  fragment({ namespaceAlias: { wp: namespaces.wp } })
    .ele('@wp', 'extent')
    .att('cx', width)
    .att('cy', height)
    .up();

const buildPositionV = () =>
  fragment({ namespaceAlias: { wp: namespaces.wp } })
    .ele('@wp', 'positionV')
    .att('relativeFrom', 'paragraph')
    .ele('@wp', 'posOffset')
    .txt('19050')
    .up()
    .up();

const buildPositionH = () =>
  fragment({ namespaceAlias: { wp: namespaces.wp } })
    .ele('@wp', 'positionH')
    .att('relativeFrom', 'column')
    .ele('@wp', 'posOffset')
    .txt('19050')
    .up()
    .up();

const buildSimplePos = () =>
  fragment({ namespaceAlias: { wp: namespaces.wp } })
    .ele('@wp', 'simplePos')
    .att('x', '0')
    .att('y', '0')
    .up();

const buildAnchoredDrawing = (graphicType, attributes) => {
  const anchoredDrawingFragment = fragment({ namespaceAlias: { wp: namespaces.wp } })
    .ele('@wp', 'anchor')
    .att('distB', '0')
    .att('distL', '0')
    .att('distR', '0')
    .att('distT', '0')
    .att('relativeHeight', '0')
    .att('behindDoc', 'false')
    .att('locked', 'true')
    .att('layoutInCell', 'true')
    .att('allowOverlap', 'false')
    .att('simplePos', 'false');
  // Even though simplePos isnt supported by Word 2007 simplePos is required.
  const simplePosFragment = buildSimplePos();
  anchoredDrawingFragment.import(simplePosFragment);
  const positionHFragment = buildPositionH();
  anchoredDrawingFragment.import(positionHFragment);
  const positionVFragment = buildPositionV();
  anchoredDrawingFragment.import(positionVFragment);
  const extentFragment = buildExtent({ width: attributes.width, height: attributes.height });
  anchoredDrawingFragment.import(extentFragment);
  const effectExtentFragment = buildEffectExtentFragment();
  anchoredDrawingFragment.import(effectExtentFragment);
  const wrapSquareFragment = buildWrapSquare();
  anchoredDrawingFragment.import(wrapSquareFragment);
  const drawingObjectNonVisualPropertiesFragment = buildDrawingObjectNonVisualProperties(
    attributes.id,
    attributes.fileNameWithExtension
  );
  anchoredDrawingFragment.import(drawingObjectNonVisualPropertiesFragment);
  const graphicFragment = buildGraphic(graphicType, attributes);
  anchoredDrawingFragment.import(graphicFragment);

  anchoredDrawingFragment.up();

  return anchoredDrawingFragment;
};

const buildInlineDrawing = (graphicType, attributes) => {
  const inlineDrawingFragment = fragment({ namespaceAlias: { wp: namespaces.wp } })
    .ele('@wp', 'inline')
    .att('distB', '0')
    .att('distL', '0')
    .att('distR', '0')
    .att('distT', '0');

  const extentFragment = buildExtent({ width: attributes.width, height: attributes.height });
  inlineDrawingFragment.import(extentFragment);
  const effectExtentFragment = buildEffectExtentFragment();
  inlineDrawingFragment.import(effectExtentFragment);
  const drawingObjectNonVisualPropertiesFragment = buildDrawingObjectNonVisualProperties(
    attributes.id,
    attributes.fileNameWithExtension
  );
  inlineDrawingFragment.import(drawingObjectNonVisualPropertiesFragment);
  const graphicFragment = buildGraphic(graphicType, attributes);
  inlineDrawingFragment.import(graphicFragment);

  inlineDrawingFragment.up();

  return inlineDrawingFragment;
};

const buildDrawing = (inlineOrAnchored = false, graphicType, attributes) => {
  const drawingFragment = fragment({ namespaceAlias: { w: namespaces.w } }).ele('@w', 'drawing');
  const inlineOrAnchoredDrawingFragment = inlineOrAnchored
    ? buildInlineDrawing(graphicType, attributes)
    : buildAnchoredDrawing(graphicType, attributes);
  drawingFragment.import(inlineOrAnchoredDrawingFragment);
  drawingFragment.up();

  return drawingFragment;
};

export {
  buildParagraph,
  buildTable,
  buildNumberingInstances,
  buildLineBreak,
  buildIndentation,
  buildTextElement,
  buildBold,
  buildItalics,
  buildUnderline,
  buildDrawing,
  fixupLineHeight,
};
