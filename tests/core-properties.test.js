/**
 * docProps/core.xml holds the document options (title, subject, creator, ...) as XML text,
 * so characters that are special in XML must be escaped.
 *
 * https://github.com/TurboDocx/html-to-docx/issues/244
 */
import JSZip from 'jszip';
import HTMLtoDOCX from '../index.js';
import generateCoreXML from '../src/schemas/core.js';
import { applicationName } from '../src/constants.js';

const readCoreXml = async (options) => {
  const docx = await HTMLtoDOCX('<p>body</p>', null, options);
  const zip = await JSZip.loadAsync(docx);
  return zip.file('docProps/core.xml').async('string');
};

describe('generateCoreXML escaping', () => {
  test('escapes XML special characters in every text property', () => {
    const xml = generateCoreXML(
      'A & B <Draft>',
      'Subject <1>',
      'Me & "You"',
      ['one<1>', 'two & three'],
      "Description <d> 'q'",
      'Last <editor>'
    );

    expect(xml).toContain('<dc:title>A &amp; B &lt;Draft&gt;</dc:title>');
    expect(xml).toContain('<dc:subject>Subject &lt;1&gt;</dc:subject>');
    expect(xml).toContain('<dc:creator>Me &amp; "You"</dc:creator>');
    expect(xml).toContain('<cp:keywords>one&lt;1&gt;, two &amp; three</cp:keywords>');
    expect(xml).toContain("<dc:description>Description &lt;d&gt; 'q'</dc:description>");
    expect(xml).toContain('<cp:lastModifiedBy>Last &lt;editor&gt;</cp:lastModifiedBy>');
  });

  test('does not let a property inject elements into the metadata', () => {
    const xml = generateCoreXML('</dc:title><dc:creator>Someone Else</dc:creator><dc:title>');

    expect(xml.match(/<dc:creator>/g)).toHaveLength(1);
    expect(xml).not.toContain('Someone Else</dc:creator>');
    expect(xml).toContain('&lt;/dc:title&gt;&lt;dc:creator&gt;Someone Else');
  });

  test('leaves plain values and the defaults unchanged', () => {
    const xml = generateCoreXML('My Title', 'About things', 'Jane Doe', ['alpha', 'beta']);

    expect(xml).toContain('<dc:title>My Title</dc:title>');
    expect(xml).toContain('<dc:subject>About things</dc:subject>');
    expect(xml).toContain('<dc:creator>Jane Doe</dc:creator>');
    expect(xml).toContain('<cp:keywords>alpha, beta</cp:keywords>');
    expect(generateCoreXML()).toContain(`<dc:creator>${applicationName}</dc:creator>`);
  });
});

describe('document options in the generated file', () => {
  test('exports a document whose title contains < and >', async () => {
    const coreXml = await readCoreXml({ title: 'Contract <Draft>' });

    expect(coreXml).toContain('<dc:title>Contract &lt;Draft&gt;</dc:title>');
  });

  test('keeps an ampersand in the title a single entity', async () => {
    const coreXml = await readCoreXml({ title: 'A & B' });

    expect(coreXml).toContain('<dc:title>A &amp; B</dc:title>');
  });
});
