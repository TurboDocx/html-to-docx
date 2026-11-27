import { defaultDocumentOptions } from '../constants';
import {
  pixelRegex,
  pixelToTWIP,
  cmRegex,
  cmToTWIP,
  inchRegex,
  inchToTWIP,
  pointRegex,
  pointToHIP,
  pointToTWIP,
} from './unit-conversion';

const fixupFontSize = (fontSize) => {
  let normalizedFontSize;
  if (pointRegex.test(fontSize)) {
    const matchedParts = fontSize.match(pointRegex);

    normalizedFontSize = pointToHIP(matchedParts[1]);
  } else if (fontSize) {
    // assuming it is already in HIP
    normalizedFontSize = fontSize;
  } else {
    normalizedFontSize = null;
  }

  return normalizedFontSize;
};

const normalizeUnits = (dimensioningObject, defaultDimensionsProperty) => {
  let normalizedUnitResult = {};
  if (typeof dimensioningObject === 'object' && dimensioningObject !== null) {
    Object.keys(dimensioningObject).forEach((key) => {
      if (pixelRegex.test(dimensioningObject[key])) {
        const matchedParts = dimensioningObject[key].match(pixelRegex);
        normalizedUnitResult[key] = pixelToTWIP(matchedParts[1]);
      } else if (cmRegex.test(dimensioningObject[key])) {
        const matchedParts = dimensioningObject[key].match(cmRegex);
        normalizedUnitResult[key] = cmToTWIP(matchedParts[1]);
      } else if (inchRegex.test(dimensioningObject[key])) {
        const matchedParts = dimensioningObject[key].match(inchRegex);
        normalizedUnitResult[key] = inchToTWIP(matchedParts[1]);
      } else if (dimensioningObject[key]) {
        normalizedUnitResult[key] = dimensioningObject[key];
      } else {
        // incase value is something like 0
        normalizedUnitResult[key] = defaultDimensionsProperty[key];
      }
    });
  } else {
    // eslint-disable-next-line no-param-reassign
    normalizedUnitResult = null;
  }

  return normalizedUnitResult;
};

const sectionUnitRegex = /^\s*(\d+(?:\.\d+)?|\.\d+)\s*(px|pt|cm|mm|in)?\s*$/i;

const sectionUnitToTWIP = {
  px: pixelToTWIP,
  pt: pointToTWIP,
  cm: cmToTWIP,
  mm: (amount) => cmToTWIP(amount / 10),
  in: inchToTWIP,
};

/**
 * One section dimension in twips; a number is already twips.
 * @param {Object} params - The parameters.
 * @param {*} params.value - The dimension as given.
 * @returns {number|null} The twips, or null when the value is not a size.
 */
const sectionValueToTWIP = ({ value }) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const matched = typeof value === 'string' ? value.match(sectionUnitRegex) : null;
  if (!matched) return null;
  const amount = Number(matched[1]);
  const unit = (matched[2] || '').toLowerCase();
  return unit ? sectionUnitToTWIP[unit](amount) : amount;
};

// Margins that are ST_TwipsMeasure (unsigned) in the schema; top and bottom are signed.
const unsignedSectionKeys = new Set(['left', 'right', 'header', 'footer', 'gutter']);

/**
 * A section's page size or margins in twips. Unlike the document's own, a 0 is
 * kept, and a value that is not a size is dropped, so the section takes the
 * document's.
 * @param {Object} params - The parameters.
 * @param {Object} params.dimensions - The section's pageSize or margins.
 * @returns {Object|undefined} The dimensions in twips.
 */
const normalizeSectionUnits = ({ dimensions }) => {
  if (typeof dimensions !== 'object' || dimensions === null) return undefined;
  const normalized = {};
  Object.keys(dimensions).forEach((key) => {
    const twips = sectionValueToTWIP({ value: dimensions[key] });
    // Those that are unsigned in the schema cannot be negative; top and bottom can.
    if (twips !== null && !(twips < 0 && unsignedSectionKeys.has(key))) {
      normalized[key] = twips;
    }
  });
  return normalized;
};

/**
 * Creates document options by normalizing the provided options and merging them with default options.
 *
 * @param {Object} documentOptions - The user-provided document options.
 * @returns {Object} - The merged and normalized document options.
 */

const createDocumentOptionsAndMergeWithDefaults = (documentOptions) => {
  // Start with a shallow copy of the user-provided options to avoid mutating the original object
  const normalizedDocumentOptions = { ...documentOptions };

  // Iterate over each key in the user-provided options
  Object.keys(documentOptions).forEach((key) => {
    switch (key) {
      case 'pageSize':
      case 'margins':
        normalizedDocumentOptions[key] = normalizeUnits(
          documentOptions[key],
          defaultDocumentOptions[key]
        );
        break;
      case 'fontSize':
      case 'complexScriptFontSize':
        normalizedDocumentOptions[key] = fixupFontSize(documentOptions[key]);
        break;
      // If there are other keys that require normalization, handle them here
      default:
        // No normalization needed; retain the original value
        break;
    }
  });

  // Every section's own page size and margins are given in the same units.
  if (Array.isArray(documentOptions.sections)) {
    normalizedDocumentOptions.sections = documentOptions.sections.map((section) => {
      if (typeof section !== 'object' || section === null) return section;
      const normalizedSection = { ...section };
      ['pageSize', 'margins'].forEach((key) => {
        if (section[key] !== undefined) {
          normalizedSection[key] = normalizeSectionUnits({ dimensions: section[key] });
        }
      });
      return normalizedSection;
    });
  }

  // Merge the normalized options with the default options.
  // User-provided options take precedence over default options.
  return { ...defaultDocumentOptions, ...normalizedDocumentOptions };
};

export default createDocumentOptionsAndMergeWithDefaults;
