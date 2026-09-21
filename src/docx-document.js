import { create, fragment } from 'xmlbuilder2';
import { nanoid } from 'nanoid';
import { parseDataUrl, isSVG, convertSVGtoPNG, parseSVGDimensions } from './utils/image';

// Track if we've already warned about missing sharp (show once per process)
let sharpMissingWarningShown = false;

import {
  generateCoreXML,
  generateStylesXML,
  generateNumberingXMLTemplate,
  generateThemeXML,
  documentRelsXML as documentRelsXMLString,
  settingsXML as settingsXMLString,
  webSettingsXML as webSettingsXMLString,
  contentTypesXML as contentTypesXMLString,
  fontTableXML as fontTableXMLString,
  genericRelsXML as genericRelsXMLString,
  generateDocumentTemplate,
} from './schemas';
import { convertVTreeToXML } from './helpers';
import namespaces from './namespaces';
import {
  footerType as footerFileType,
  headerType as headerFileType,
  themeType as themeFileType,
  landscapeMargins,
  portraitMargins,
  defaultOrientation,
  landscapeWidth,
  landscapeHeight,
  applicationName,
  defaultFont,
  defaultFontSize,
  defaultLang,
  hyperlinkType,
  documentFileName,
  imageType,
  defaultDocumentOptions,
} from './constants';
import ListStyleBuilder from './utils/list';
import { fontFamilyToTableObject } from './utils/font-family-conversion';

function generateContentTypesFragments(contentTypesXML, type, objects) {
  if (objects && Array.isArray(objects)) {
    objects.forEach((object) => {
      const contentTypesFragment = fragment({ defaultNamespace: { ele: namespaces.contentTypes } })
        .ele('Override')
        .att('PartName', `/word/${type}${object[`${type}Id`]}.xml`)
        .att(
          'ContentType',
          `application/vnd.openxmlformats-officedocument.wordprocessingml.${type}+xml`
        )
        .up();

      contentTypesXML.root().import(contentTypesFragment);
    });
  }
}

function generateSectionReferenceXML(documentXML, documentSectionType, objects, isEnabled) {
  if (isEnabled && objects && Array.isArray(objects) && objects.length) {
    const xmlFragment = fragment();
    objects.forEach(({ relationshipId, type }) => {
      const objectFragment = fragment({ namespaceAlias: { w: namespaces.w, r: namespaces.r } })
        .ele('@w', `${documentSectionType}Reference`)
        .att('@r', 'id', `rId${relationshipId}`)
        .att('@w', 'type', type)
        .up();
      xmlFragment.import(objectFragment);
    });

    documentXML.root().first().first().import(xmlFragment);
  }
}

function generateXMLString(xmlString, direction) {
  const xmlDocumentString = create({ encoding: 'UTF-8', standalone: true }, xmlString);

  // RTL condition xml styles addition
  if (direction === 'rtl') {
    const rtlStyle = fragment({ namespaceAlias: { w: namespaces.w } })
      .ele('@w', 'style')
      .att('@w', 'type', 'paragraph')
      .att('@w', 'styleId', 'RTLDefault')
      .ele('@w', 'name')
      .att('@w', 'val', 'RTL Default')
      .up()
      .ele('@w', 'pPr')
      .ele('@w', 'jc')
      .att('@w', 'val', 'right')
      .up()
      .ele('@w', 'bidi')
      .up()
      .up()
      .up();

    xmlDocumentString.root().import(rtlStyle);
  }

  return xmlDocumentString.toString({ prettyPrint: true });
}

async function generateSectionXML(vTree, type = 'header') {
  const sectionXML = create({
    encoding: 'UTF-8',
    standalone: true,
    namespaceAlias: {
      w: namespaces.w,
      ve: namespaces.ve,
      o: namespaces.o,
      r: namespaces.r,
      v: namespaces.v,
      wp: namespaces.wp,
      w10: namespaces.w10,
    },
  }).ele('@w', type === 'header' ? 'hdr' : 'ftr');

  const XMLFragment = fragment();
  await convertVTreeToXML(this, vTree, XMLFragment);
  if (type === 'footer' && XMLFragment.first().node.tagName === 'p' && this.pageNumber) {
    XMLFragment.first().import(
      fragment({ namespaceAlias: { w: namespaces.w } })
        .ele('@w', 'fldSimple')
        .att('@w', 'instr', 'PAGE')
        .ele('@w', 'r')
        .up()
        .up()
    );
  }
  sectionXML.root().import(XMLFragment);

  const referenceName = type === 'header' ? 'Header' : 'Footer';
  this[`last${referenceName}Id`] += 1;

  return { [`${type}Id`]: this[`last${referenceName}Id`], [`${type}XML`]: sectionXML };
}

class DocxDocument {
  constructor(properties) {
    this.zip = properties.zip;
    this.htmlString = properties.htmlString;
    this.orientation = properties.orientation;
    this.pageSize = properties.pageSize || defaultDocumentOptions.pageSize;
    this.deterministicIds = properties.deterministicIds || false;

    const isPortraitOrientation = this.orientation === defaultOrientation;
    const height = this.pageSize.height ? this.pageSize.height : landscapeHeight;
    const width = this.pageSize.width ? this.pageSize.width : landscapeWidth;

    this.width = isPortraitOrientation ? width : height;
    this.height = isPortraitOrientation ? height : width;

    const defaultMargins = isPortraitOrientation ? portraitMargins : landscapeMargins;
    const marginsObject = properties.margins || {};

    this.margins = {
      top: marginsObject.top !== undefined ? marginsObject.top : defaultMargins.top,
      right: marginsObject.right !== undefined ? marginsObject.right : defaultMargins.right,
      bottom: marginsObject.bottom !== undefined ? marginsObject.bottom : defaultMargins.bottom,
      left: marginsObject.left !== undefined ? marginsObject.left : defaultMargins.left,
      header: marginsObject.header !== undefined ? marginsObject.header : defaultMargins.header,
      footer: marginsObject.footer !== undefined ? marginsObject.footer : defaultMargins.footer,
      gutter: marginsObject.gutter !== undefined ? marginsObject.gutter : defaultMargins.gutter,
    };

    this.availableDocumentSpace = this.width - this.margins.left - this.margins.right;
    this.title = properties.title || '';
    this.subject = properties.subject || '';
    this.creator = properties.creator || applicationName;
    this.keywords = properties.keywords || [applicationName];
    this.description = properties.description || '';
    this.lastModifiedBy = properties.lastModifiedBy || applicationName;
    this.revision = properties.revision || 1;
    this.createdAt = properties.createdAt || new Date();
    this.modifiedAt = properties.modifiedAt || new Date();
    this.headerType = properties.headerType || 'default';
    this.header = properties.header || false;
    this.footerType = properties.footerType || 'default';
    this.footer = properties.footer || false;
    this.font = properties.font || defaultFont;
    this.fontSize = properties.fontSize || defaultFontSize;
    this.complexScriptFontSize = properties.complexScriptFontSize || defaultFontSize;
    this.lang = properties.lang || defaultLang;
    this.direction = properties.direction || 'ltr';
    this.tableRowCantSplit =
      (properties.table && properties.table.row && properties.table.row.cantSplit) || false;
    this.tableBorders =
      (properties.table && properties.table.borderOptions) ||
      defaultDocumentOptions.table.borderOptions;
    this.pageNumber = properties.pageNumber || false;
    this.skipFirstHeaderFooter = properties.skipFirstHeaderFooter || false;
    this.lineNumber = properties.lineNumber ? properties.lineNumberOptions : null;
    this.addSpacingAfterTable =
      properties.table && properties.table.addSpacingAfter !== undefined
        ? properties.table.addSpacingAfter
        : defaultDocumentOptions.table.addSpacingAfter;
    this.heading = properties.heading || defaultDocumentOptions.heading;
    this.imageProcessing = properties.imageProcessing || defaultDocumentOptions.imageProcessing;
    this.lastNumberingId = 0;
    this.lastMediaId = 0;
    this.lastHeaderId = 0;
    this.lastFooterId = 0;
    this.stylesObjects = [];
    this.numberingObjects = [];
    this.fontTableObjects = [];
    this.relationshipFilename = documentFileName;
    this.relationships = [{ fileName: documentFileName, lastRelsId: 5, rels: [] }];
    this.mediaFiles = [];
    this.headerObjects = [];
    this.footerObjects = [];
    this.documentXML = null;

    this.generateContentTypesXML = this.generateContentTypesXML.bind(this);
    this.generateDocumentXML = this.generateDocumentXML.bind(this);
    this.generateCoreXML = this.generateCoreXML.bind(this);
    this.generateSettingsXML = this.generateSettingsXML.bind(this);
    this.generateWebSettingsXML = this.generateWebSettingsXML.bind(this);
    this.generateStylesXML = this.generateStylesXML.bind(this);
    this.generateFontTableXML = this.generateFontTableXML.bind(this);
    this.generateThemeXML = this.generateThemeXML.bind(this);
    this.generateNumberingXML = this.generateNumberingXML.bind(this);
    this.generateRelsXML = this.generateRelsXML.bind(this);
    this.createMediaFile = this.createMediaFile.bind(this);
    this.createDocumentRelationships = this.createDocumentRelationships.bind(this);
    this.generateHeaderXML = this.generateHeaderXML.bind(this);
    this.generateFooterXML = this.generateFooterXML.bind(this);
    this.generateSectionXML = generateSectionXML.bind(this);

    this.ListStyleBuilder = new ListStyleBuilder(properties.numbering);
  }

  generateContentTypesXML() {
    const contentTypesXML = create({ encoding: 'UTF-8', standalone: true }, contentTypesXMLString);

    generateContentTypesFragments(contentTypesXML, 'header', this.headerObjects);
    generateContentTypesFragments(contentTypesXML, 'footer', this.footerObjects);

    return contentTypesXML.toString({ prettyPrint: true });
  }

  generateDocumentXML() {
    const documentXML = create(
      { encoding: 'UTF-8', standalone: true },
      generateDocumentTemplate(this.width, this.height, this.orientation, this.margins)
    );
    documentXML.root().first().import(this.documentXML);

    generateSectionReferenceXML(documentXML, 'header', this.headerObjects, this.header);
    generateSectionReferenceXML(documentXML, 'footer', this.footerObjects, this.footer);

    if ((this.header || this.footer) && this.skipFirstHeaderFooter) {
      documentXML
        .root()
        .first()
        .first()
        .import(fragment({ namespaceAlias: { w: namespaces.w } }).ele('@w', 'titlePg'));
    }
    if (this.lineNumber) {
      const { countBy, start, restart } = this.lineNumber;
      documentXML
        .root()
        .first()
        .first()
        .import(
          fragment({ namespaceAlias: { w: namespaces.w } })
            .ele('@w', 'lnNumType')
            .att('@w', 'countBy', countBy)
            .att('@w', 'start', start)
            .att('@w', 'restart', restart)
        );
    }

    return documentXML.toString({ prettyPrint: true });
  }

  generateCoreXML() {
    return generateXMLString(
      generateCoreXML(
        this.title,
        this.subject,
        this.creator,
        this.keywords,
        this.description,
        this.lastModifiedBy,
        this.revision,
        this.createdAt,
        this.modifiedAt
      )
    );
  }

  // eslint-disable-next-line class-methods-use-this
  generateSettingsXML() {
    return generateXMLString(settingsXMLString);
  }

  // eslint-disable-next-line class-methods-use-this
  generateWebSettingsXML() {
    return generateXMLString(webSettingsXMLString);
  }

  generateStylesXML() {
    return generateXMLString(
      generateStylesXML(
        this.font,
        this.fontSize,
        this.complexScriptFontSize,
        this.lang,
        this.heading
      ),
      this.direction
    );
  }

  generateFontTableXML() {
    const fontTableXML = create({ encoding: 'UTF-8', standalone: true }, fontTableXMLString);
    const fontNames = [
      'Arial',
      'Calibri',
      'Calibri Light',
      'Courier New',
      'Symbol',
      'Times New Roman',
    ];
    this.fontTableObjects.forEach(({ fontName, genericFontName, altName }) => {
      if (!fontNames.includes(fontName)) {
        fontNames.push(fontName);
        const fontFragment = fragment({
          namespaceAlias: { w: namespaces.w },
        })
          .ele('@w', 'font')
          .att('@w', 'name', fontName);

        switch (genericFontName) {
          case 'serif':
            fontFragment.ele('@w', 'altName').att('@w', 'val', 'Times New Roman');
            fontFragment.ele('@w', 'family').att('@w', 'val', 'roman');
            fontFragment.ele('@w', 'pitch').att('@w', 'val', 'variable');
            break;
          case 'sans-serif':
            fontFragment.ele('@w', 'altName').att('@w', 'val', altName || 'Arial');
            fontFragment.ele('@w', 'family').att('@w', 'val', 'swiss');
            fontFragment.ele('@w', 'pitch').att('@w', 'val', 'variable');
            break;
          case 'monospace':
            fontFragment.ele('@w', 'altName').att('@w', 'val', 'Courier New');
            fontFragment.ele('@w', 'family').att('@w', 'val', 'modern');
            fontFragment.ele('@w', 'pitch').att('@w', 'val', 'fixed');
            break;
          default:
            break;
        }

        fontTableXML.root().import(fontFragment);
      }
    });

    return fontTableXML.toString({ prettyPrint: true });
  }

  generateThemeXML() {
    return generateXMLString(generateThemeXML(this.font));
  }

  generateNumberingXML() {
    const numberingXML = create(
      { encoding: 'UTF-8', standalone: true },
      generateNumberingXMLTemplate()
    );

    const abstractNumberingFragments = fragment();
    const numberingFragments = fragment();

    // The way we generate the numbering Objects is a bit different from the original implementation
    // If there are nested lists in original document or html, instead of providing the start value for the lists
    // we generate a new list for each ul or ol tag we encounter.
    // FIXME: This is not the best way to handle nested lists, we should find a better way to handle this
    // The current implementation is a quick fix to handle nested lists
    // For every ul or ol encountered, all levels have the same startValue
    // This helps in handling the indentation for that particular level in the transformation
    this.numberingObjects.forEach(({ numberingId, type, properties, outline, baseLevel }) => {
      const abstractNumberingFragment = fragment({ namespaceAlias: { w: namespaces.w } })
        .ele('@w', 'abstractNum')
        .att('@w', 'abstractNumId', String(numberingId));

      let startValue = 1;
      if (properties.attributes && properties.attributes['data-start']) {
        startValue = properties.attributes['data-start'];
      } else if (properties.start) {
        startValue = properties.start;
      }
      [...Array(9).keys()].forEach((level) => {
        let levelStart = type === 'ol' ? startValue : '1';
        let numberFormat =
          type === 'ol'
            ? this.ListStyleBuilder.getListStyleType(
                properties.style && properties.style['list-style-type']
              )
            : 'bullet';
        let levelText =
          type === 'ol'
            ? this.ListStyleBuilder.getListPrefixSuffix(
                properties.style,
                level,
                properties.attributes
              )
            : this.ListStyleBuilder.getUnorderedListPrefixSuffix(
                properties.style,
                properties.attributes
              );
        // "01." is as wide as an outline "1.1.": hang it as far so it clears its text.
        let hangingIndent = numberFormat === 'decimalZero' ? 540 : 360;
        if (type === 'ol' && outline) {
          // Outline levels are all decimal; only the list's own first level
          // honours its start value, deeper levels restart at 1 under their parent.
          levelStart = level === baseLevel ? startValue : '1';
          numberFormat = 'decimal';
          levelText = this.ListStyleBuilder.getOutlineListLevelText(level, baseLevel);
          // "1.1.1." is wider than "1.": give each deeper level 180 more twips.
          hangingIndent = 360 + 180 * Math.max(0, level - baseLevel);
        }

        const levelFragment = fragment({ namespaceAlias: { w: namespaces.w } })
          .ele('@w', 'lvl')
          .att('@w', 'ilvl', level)
          .ele('@w', 'start')
          .att('@w', 'val', levelStart)
          .up()
          .ele('@w', 'numFmt')
          .att('@w', 'val', numberFormat)
          .up()
          .ele('@w', 'lvlText')
          .att('@w', 'val', levelText)
          .up()
          .ele('@w', 'lvlJc')
          .att('@w', 'val', 'left')
          .up()
          .ele('@w', 'pPr')
          .ele('@w', 'tabs')
          .ele('@w', 'tab')
          .att('@w', 'val', 'num')
          .att('@w', 'pos', (level + 1) * 720)
          .up()
          .up()
          .ele('@w', 'ind')
          .att('@w', 'left', (level + 1) * 720)
          .att('@w', 'hanging', hangingIndent)
          .up()
          .up()
          .up();

        if (type === 'ul') {
          const bulletFont = this.ListStyleBuilder.getUnorderedListFont(
            properties.style,
            properties.attributes
          );
          const bulletRunPropertiesFragment = fragment({ namespaceAlias: { w: namespaces.w } });
          const bulletFontsElement = bulletRunPropertiesFragment
            .ele('@w', 'rPr')
            .ele('@w', 'rFonts')
            .att('@w', 'ascii', bulletFont)
            .att('@w', 'hAnsi', bulletFont);
          if (bulletFont !== 'Symbol') {
            // Pin every script slot so Word never picks another font for the glyph.
            bulletFontsElement.att('@w', 'eastAsia', bulletFont).att('@w', 'cs', bulletFont);
          }
          bulletFontsElement.att('@w', 'hint', 'default');
          levelFragment.last().import(bulletRunPropertiesFragment);
        }
        abstractNumberingFragment.import(levelFragment);
      });
      abstractNumberingFragment.up();
      abstractNumberingFragments.import(abstractNumberingFragment);

      numberingFragments.import(
        fragment({ namespaceAlias: { w: namespaces.w } })
          .ele('@w', 'num')
          .att('@w', 'numId', String(numberingId))
          .ele('@w', 'abstractNumId')
          .att('@w', 'val', String(numberingId))
          .up()
          .up()
      );
    });

    numberingXML.root().import(abstractNumberingFragments);
    numberingXML.root().import(numberingFragments);

    return numberingXML.toString({ prettyPrint: true });
  }

  // eslint-disable-next-line class-methods-use-this
  appendRelationships(xmlFragment, relationships) {
    relationships.forEach(({ relationshipId, type, target, targetMode }) => {
      xmlFragment.import(
        fragment({ defaultNamespace: { ele: namespaces.relationship } })
          .ele('Relationship')
          .att('Id', `rId${relationshipId}`)
          .att('Type', type)
          .att('Target', target)
          .att('TargetMode', targetMode)
          .up()
      );
    });
  }

  generateRelsXML() {
    const relationshipXMLStrings = this.relationships.map(({ fileName, rels }) => {
      const xmlFragment = create(
        { encoding: 'UTF-8', standalone: true },
        fileName === documentFileName ? documentRelsXMLString : genericRelsXMLString
      );
      this.appendRelationships(xmlFragment.root(), rels);

      return { fileName, xmlString: xmlFragment.toString({ prettyPrint: true }) };
    });

    return relationshipXMLStrings;
  }

  // options.outline: multilevel "1. / 1.1. / 1.1.1." numbering whose first
  // rendered level is options.baseLevel (the list's nesting depth).
  createNumbering(type, properties, options = {}) {
    this.lastNumberingId += 1;
    this.numberingObjects.push({
      numberingId: this.lastNumberingId,
      type,
      properties,
      outline: Boolean(options.outline),
      baseLevel: options.baseLevel || 0,
    });

    return this.lastNumberingId;
  }

  // Every <wp:docPr> in a part needs an id no other drawing uses, or Word
  // reports the ids as duplicated and renumbers them on save. Pictures take
  // theirs from the media counter, so shapes draw from the same counter rather
  // than starting a second sequence that would collide with it. The number
  // also rises with source order, which is what the shape anchors use as their
  // z-order so a later shape paints over an earlier one.
  createDrawingId() {
    this.lastMediaId += 1;
    return this.lastMediaId;
  }

  createFont(fontFamily) {
    const fontTableObject = fontFamilyToTableObject(fontFamily, this.font);
    this.fontTableObjects.push(fontTableObject);
    return fontTableObject.fontName;
  }

  // Adds a font table entry for a font the converter itself uses (rather than
  // one parsed from a CSS font-family list), with an optional alternative name.
  registerFont({ fontName, genericFontName, altName }) {
    if (!this.fontTableObjects.some((fontTableObject) => fontTableObject.fontName === fontName)) {
      this.fontTableObjects.push({ fontName, genericFontName, altName });
    }
    return fontName;
  }

  async createMediaFile(base64String) {
    const parsed = parseDataUrl(base64String);
    if (!parsed) {
      throw new Error('Invalid base64 string');
    }

    let base64FileContent = parsed.base64;
    let mimeType = parsed.mimeType;

    // Extract file extension from MIME type (e.g., image/jpeg -> jpeg)
    const mimeTypePart = mimeType.match(/\/(.*?)$/);
    let fileExtension =
      !mimeTypePart || mimeTypePart[1] === 'octet-stream' ? 'png' : mimeTypePart[1];

    // Handle SVG images based on svgHandling option
    const svgHandling =
      this.imageProcessing?.svgHandling ||
      defaultDocumentOptions.imageProcessing.svgHandling;

    if (isSVG(mimeType) && svgHandling === 'convert') {
      try {
        // Convert SVG to PNG for backward compatibility with older Word versions
        // Decode base64 to get SVG string for dimension extraction
        const svgString = Buffer.from(base64FileContent, 'base64').toString('utf-8');

        // Extract dimensions from SVG using improved parser that handles:
        // - Decimal values (100.5)
        // - Units (100px, 10cm, 5in, etc.)
        // - ViewBox as fallback
        const { width, height } = parseSVGDimensions(svgString);

        const pngBuffer = await convertSVGtoPNG(base64FileContent, { width, height });
        base64FileContent = pngBuffer.toString('base64');
        fileExtension = 'png';
        mimeType = 'image/png';
      } catch (error) {
        // Sharp not available - fall back to native SVG mode
        if (error.message.includes('Sharp is not installed')) {
          // Only show the warning once per process to avoid spam (unless suppressed)
          const suppressWarning =
            this.imageProcessing?.suppressSharpWarning ||
            defaultDocumentOptions.imageProcessing.suppressSharpWarning;

          if (!sharpMissingWarningShown && !suppressWarning) {
            // eslint-disable-next-line no-console
            console.warn(
              '\n[INFO] Sharp not installed - SVG images will be embedded natively (requires Office 2019+ or Microsoft 365).\n' +
                'For maximum compatibility with all Word versions, install sharp: npm install sharp\n' +
                'Learn more: https://github.com/TurboDocx/html-to-docx#svg-image-support\n'
            );
            sharpMissingWarningShown = true;
          }
        } else {
          // eslint-disable-next-line no-console
          console.error(`[ERROR] Failed to convert SVG to PNG: ${error.message}`);
        }
        // Fall back to using SVG directly if conversion fails
        fileExtension = 'svg';
      }
    } else if (isSVG(mimeType)) {
      // Use SVG natively (Office 2019+ support)
      fileExtension = 'svg';
    }

    // Use deterministic IDs when deterministicIds option is enabled (for CI diff testing)
    const imageId = this.deterministicIds ? this.lastMediaId.toString() : nanoid();
    const fileNameWithExtension = `image-${imageId}.${fileExtension}`;

    this.lastMediaId += 1;

    return {
      id: this.lastMediaId,
      fileContent: base64FileContent,
      fileNameWithExtension,
      isSVG: fileExtension === 'svg',
    };
  }

  createDocumentRelationships(fileName = 'document', type, target, targetMode = 'External') {
    let relationshipObject = this.relationships.find(
      (relationship) => relationship.fileName === fileName
    );
    let lastRelsId = 1;
    if (relationshipObject) {
      lastRelsId = relationshipObject.lastRelsId + 1;
      relationshipObject.lastRelsId = lastRelsId;
    } else {
      relationshipObject = { fileName, lastRelsId, rels: [] };
      this.relationships.push(relationshipObject);
    }
    let relationshipType;
    switch (type) {
      case hyperlinkType:
        relationshipType = namespaces.hyperlinks;
        break;
      case imageType:
        relationshipType = namespaces.images;
        break;
      case headerFileType:
        relationshipType = namespaces.headers;
        break;
      case footerFileType:
        relationshipType = namespaces.footers;
        break;
      case themeFileType:
        relationshipType = namespaces.themes;
        break;
    }

    relationshipObject.rels.push({
      relationshipId: lastRelsId,
      type: relationshipType,
      target,
      targetMode,
    });

    return lastRelsId;
  }

  generateHeaderXML(vTree) {
    return this.generateSectionXML(vTree, 'header');
  }

  generateFooterXML(vTree) {
    return this.generateSectionXML(vTree, 'footer');
  }
}

export default DocxDocument;
