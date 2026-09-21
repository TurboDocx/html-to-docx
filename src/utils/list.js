// Bullet glyphs for an explicit list-style-type on <ul>. Unicode glyphs from
// the General Punctuation and Geometric Shapes blocks are covered by common
// text fonts (Arial, Times New Roman, Calibri, Liberation Sans, DejaVu Sans),
// so they render in Word and LibreOffice without Symbol/Wingdings, whose
// private-use code points depend on those fonts being installed. Arial keeps
// the glyph identical across levels and platforms (LibreOffice resolves it to
// the metric-compatible Liberation Sans).
export const unorderedListBulletFont = 'Arial';
export const unorderedListBullets = {
  disc: '\u2022', // •
  circle: '\u25E6', // ◦
  square: '\u25AA', // ▪
};

// Glyphs Arial carries (its WGL4 set). Any other bullet glyph — the dingbats and
// symbols Google Docs' presets use: ❖ ➢ ➔ ❏ ◆ ★ — is drawn in DejaVu Sans,
// which covers them and is installed wherever TurboDocx converts documents.
const arialBulletGlyphs = new Set([
  '\u2022', // •
  '\u25E6', // ◦
  '\u25AA', // ▪
  '\u25CF', // ●
  '\u25CB', // ○
  '\u25A0', // ■
]);
export const symbolBulletFont = 'DejaVu Sans';

// <ul data-bullet="❖">: the list's own glyph, when it is exactly one character.
const getDataBullet = (attributes) => {
  const value = attributes && attributes['data-bullet'];
  if (typeof value !== 'string' || Array.from(value).length !== 1) {
    return null;
  }
  return {
    glyph: value,
    font: arialBulletGlyphs.has(value) ? unorderedListBulletFont : symbolBulletFont,
  };
};

const getUnorderedListBullet = (style, attributes) => {
  const dataBullet = getDataBullet(attributes);
  if (dataBullet) {
    return dataBullet;
  }
  const listType =
    style && typeof style['list-style-type'] === 'string'
      ? style['list-style-type'].trim().toLowerCase()
      : '';
  if (!Object.prototype.hasOwnProperty.call(unorderedListBullets, listType)) {
    return null;
  }
  return { glyph: unorderedListBullets[listType], font: unorderedListBulletFont };
};

class ListStyleBuilder {
  // defaults is an object passed in from constants.js / numbering with the following properties:
  // defaultOrderedListStyleType: 'decimal' (unless otherwise specified)
  constructor(defaults) {
    this.defaults = defaults || { defaultOrderedListStyleType: 'decimal' };
  }

  // eslint-disable-next-line class-methods-use-this
  getListStyleType(listType) {
    switch (listType) {
      case 'upper-roman':
        return 'upperRoman';
      case 'lower-roman':
        return 'lowerRoman';
      case 'upper-alpha':
      case 'upper-alpha-bracket-end':
        return 'upperLetter';
      case 'lower-alpha':
      case 'lower-alpha-bracket-end':
        return 'lowerLetter';
      case 'decimal-leading-zero':
        return 'decimalZero';
      case 'decimal':
      case 'decimal-bracket':
        return 'decimal';
      default:
        return this.defaults.defaultOrderedListStyleType;
    }
  }

  // attributes['data-suffix'] of ")" closes a count with a bracket, "1)", for
  // the formats list-style-type cannot express that way on its own.
  getListPrefixSuffix(style, lvl, attributes) {
    let listType = this.defaults.defaultOrderedListStyleType;

    if (style && style['list-style-type']) {
      listType = style['list-style-type'];
    }
    const suffix = attributes && attributes['data-suffix'] === ')' ? ')' : '.';

    switch (listType) {
      case 'upper-roman':
      case 'lower-roman':
      case 'upper-alpha':
      case 'lower-alpha':
      case 'decimal-leading-zero':
        return `%${lvl + 1}${suffix}`;
      case 'upper-alpha-bracket-end':
      case 'lower-alpha-bracket-end':
      case 'decimal-bracket-end':
        return `%${lvl + 1})`;
      case 'decimal-bracket':
        return `(%${lvl + 1})`;
      case 'decimal':
      default:
        return `%${lvl + 1}${suffix}`;
    }
  }

  // Multilevel outline text for `level` of a list whose first level is
  // `baseLevel`: "%1." then "%1.%2." then "%1.%2.%3." ...
  // eslint-disable-next-line class-methods-use-this
  getOutlineListLevelText(level, baseLevel = 0) {
    const firstLevel = level < baseLevel ? level : baseLevel;
    let levelText = '';
    for (let outlineLevel = firstLevel; outlineLevel <= level; outlineLevel += 1) {
      levelText += `%${outlineLevel + 1}.`;
    }
    return levelText;
  }

  // A data-bullet glyph, else an explicit disc/circle/square, as a Unicode glyph
  // in a font that has it (see unorderedListBullets and getDataBullet). Lists
  // with neither keep the Symbol-font private-use bullet.
  // eslint-disable-next-line class-methods-use-this
  getUnorderedListPrefixSuffix(style, attributes) {
    const bullet = getUnorderedListBullet(style, attributes);
    return bullet ? bullet.glyph : '\uF0B7';
  }

  // Font for the bullet glyph returned by getUnorderedListPrefixSuffix.
  // eslint-disable-next-line class-methods-use-this
  getUnorderedListFont(style, attributes) {
    const bullet = getUnorderedListBullet(style, attributes);
    return bullet ? bullet.font : 'Symbol';
  }
}

export default ListStyleBuilder;
