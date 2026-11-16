// Unit tests for MathML (<math>) support
// Equations are converted to OMML through the user-supplied `math.converter` option.

import HTMLtoDOCX from '../index';
import { parseDOCX } from './helpers/docx-assertions';

const MATHML_NS = 'xmlns="http://www.w3.org/1998/Math/MathML"';

/**
 * Minimal stand-in for a real MathML -> OMML converter (e.g. mathml2omml):
 * emits one <m:r> holding the text content of the MathML.
 * @param {string} mathml - serialized <math> element
 * @returns {string} OMML markup
 */
const stubConverter = (mathml) => {
  const text = mathml
    .replaceAll(/<[^>]+>/g, '')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&');
  const escaped = text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  return `<m:oMath><m:r><m:t>${escaped}</m:t></m:r></m:oMath>`;
};

const convert = async (htmlString, converter = stubConverter, options = {}) => {
  const docx = await HTMLtoDOCX(htmlString, null, { ...options, math: { converter } });
  return parseDOCX(docx);
};

const bodyXml = (parsed) => parsed.xml.replaceAll(/\s*\n\s*/g, '');

describe('MathML support', () => {
  let warnSpy;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  describe('without a converter', () => {
    test('keeps the equation content as plain text instead of dropping it', async () => {
      const docx = await HTMLtoDOCX(
        `<p>Let <math ${MATHML_NS}><mi>x</mi><mo>=</mo><mn>2</mn></math> be.</p>`
      );
      const parsed = await parseDOCX(docx);
      const xml = bodyXml(parsed);

      expect(xml).not.toContain('<m:oMath');
      expect(xml).toContain('x=2');
      expect(xml).toContain('Let ');
      expect(xml).toContain(' be.');
    });
  });

  describe('converter input', () => {
    test('receives the serialized MathML with namespace and escaped text', async () => {
      const converter = jest.fn(stubConverter);
      await convert(
        `<p><math class="eq" style="color:red"><mn>0</mn><mo>&lt;</mo><mi>n</mi></math></p>`,
        converter
      );

      expect(converter).toHaveBeenCalledTimes(1);
      const [mathml, context] = converter.mock.calls[0];
      expect(mathml).toBe(
        '<math xmlns="http://www.w3.org/1998/Math/MathML"><mn>0</mn><mo>&lt;</mo><mi>n</mi></math>'
      );
      expect(context).toStrictEqual({ display: false });
    });

    test('passes display: true for display="block" equations', async () => {
      const converter = jest.fn(stubConverter);
      await convert(`<math ${MATHML_NS} display="block"><mi>x</mi></math>`, converter);

      expect(converter.mock.calls[0][1]).toStrictEqual({ display: true });
      expect(converter.mock.calls[0][0]).toContain('display="block"');
    });

    test('self-closing MathML elements do not swallow their siblings', async () => {
      const converter = jest.fn(stubConverter);
      await convert(
        `<p><math ${MATHML_NS}><mi>a</mi><mspace width="1em"/><mo>&#x2264;</mo><mi>b</mi></math></p>`,
        converter
      );

      expect(converter.mock.calls[0][0]).toBe(
        '<math xmlns="http://www.w3.org/1998/Math/MathML"><mi>a</mi><mspace width="1em"/><mo>≤</mo><mi>b</mi></math>'
      );
    });

    test('drops insignificant whitespace between MathML elements', async () => {
      const converter = jest.fn(stubConverter);
      await convert(
        `<p><math ${MATHML_NS}>\n  <mrow>\n    <mi> x </mi>\n    <mtext> and </mtext>\n  </mrow>\n</math></p>`,
        converter
      );

      expect(converter.mock.calls[0][0]).toBe(
        '<math xmlns="http://www.w3.org/1998/Math/MathML"><mrow><mi>x</mi><mtext> and </mtext></mrow></math>'
      );
    });
  });

  describe('document output', () => {
    test('declares the math namespace on the document root', async () => {
      const parsed = await convert(`<p><math ${MATHML_NS}><mi>x</mi></math></p>`);
      expect(parsed.xml).toContain(
        'xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"'
      );
    });

    test('places an inline equation between the surrounding runs of the same paragraph', async () => {
      const parsed = await convert(`<p>Let <math ${MATHML_NS}><mi>x</mi></math> be positive.</p>`);
      const xml = bodyXml(parsed);

      expect(xml).toMatch(
        /<w:p>.*<w:t xml:space="preserve">Let <\/w:t><\/w:r><m:oMath[^>]*><m:r><m:t>x<\/m:t><\/m:r><\/m:oMath><w:r>.*<w:t xml:space="preserve"> be positive.<\/w:t>.*<\/w:p>/
      );
    });

    test('renders a top-level display equation in its own paragraph as m:oMathPara', async () => {
      const parsed = await convert(
        `<p>Before</p><math ${MATHML_NS} display="block"><mi>x</mi></math><p>After</p>`
      );
      const xml = bodyXml(parsed);

      expect(xml).toMatch(/<w:p>(<w:pPr>.*?<\/w:pPr>)?<m:oMathPara[^>]*><m:oMath>/);
      expect(xml).toContain('Before');
      expect(xml).toContain('After');
    });

    test('supports adjacent equations', async () => {
      const parsed = await convert(
        `<p><math ${MATHML_NS}><mi>a</mi></math><math ${MATHML_NS}><mi>b</mi></math></p>`
      );
      expect([...bodyXml(parsed).matchAll(/<m:oMath[\s>]/g)]).toHaveLength(2);
    });

    test.each([
      ['strong', `<p><strong>Let <math ${MATHML_NS}><mi>x</mi></math></strong> ok</p>`],
      [
        'span',
        `<p><span style="color:#1a237e">Let <math ${MATHML_NS}><mi>x</mi></math></span> ok</p>`,
      ],
      ['a', `<p><a href="https://example.com">Let <math ${MATHML_NS}><mi>x</mi></math></a> ok</p>`],
      ['li', `<ul><li>Let <math ${MATHML_NS}><mi>x</mi></math> ok</li></ul>`],
      ['td', `<table><tr><td><p>Let <math ${MATHML_NS}><mi>x</mi></math> ok</p></td></tr></table>`],
      [
        'td (direct child)',
        `<table><tr><td><math ${MATHML_NS}><mi>x</mi></math></td></tr></table>`,
      ],
    ])('renders equations nested in <%s>', async (_name, html) => {
      const parsed = await convert(html);
      expect(bodyXml(parsed)).toContain('<m:t>x</m:t>');
    });

    test('keeps the space after an inline element that ends with an equation', async () => {
      const parsed = await convert(
        `<p><strong>Let <math ${MATHML_NS}><mi>x</mi></math></strong> be.</p>`
      );
      expect(bodyXml(parsed)).toContain('<w:t xml:space="preserve"> be.</w:t>');
    });

    test('works with right-to-left paragraphs', async () => {
      const parsed = await convert(
        `<p dir="rtl">لتكن <span dir="ltr"><math ${MATHML_NS}><mi>f</mi></math></span> دالة</p>`
      );
      const xml = bodyXml(parsed);
      expect(xml).toContain('<m:t>f</m:t>');
      expect(xml).toContain(' دالة');
    });
  });

  describe('converter output handling', () => {
    test('escapes raw "<" emitted inside m:t and does not double-escape entities', async () => {
      const parsed = await convert(
        `<p><math ${MATHML_NS}><mi>x</mi></math></p>`,
        () => '<m:oMath><m:r><m:t>a<b</m:t></m:r><m:r><m:t>c&lt;d</m:t></m:r></m:oMath>'
      );
      const xml = bodyXml(parsed);
      expect(xml).toContain('<m:t>a&lt;b</m:t>');
      expect(xml).toContain('<m:t>c&lt;d</m:t>');
      expect(xml).not.toContain('&amp;lt;');
    });

    test('accepts output that already declares namespaces or has an XML declaration', async () => {
      const parsed = await convert(
        `<p><math ${MATHML_NS}><mi>x</mi></math></p>`,
        () =>
          '<?xml version="1.0"?><m:oMath xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><m:r><w:rPr><w:b/></w:rPr><m:t>x</m:t></m:r></m:oMath>'
      );
      expect(bodyXml(parsed)).toContain('<m:t>x</m:t>');
    });

    test('keeps spacing-only runs', async () => {
      const parsed = await convert(
        `<p><math ${MATHML_NS}><mi>x</mi></math></p>`,
        () => '<m:oMath><m:r><m:t xml:space="preserve"> </m:t></m:r></m:oMath>'
      );
      expect(bodyXml(parsed)).toContain(' </m:t>');
    });

    test('wraps inline converter output in m:oMathPara for display equations', async () => {
      const parsed = await convert(`<math ${MATHML_NS} display="block"><mi>x</mi></math>`);
      expect(bodyXml(parsed)).toMatch(/<m:oMathPara[^>]*><m:oMath><m:r><m:t>x<\/m:t>/);
    });

    test('supports asynchronous converters', async () => {
      const parsed = await convert(`<p><math ${MATHML_NS}><mi>x</mi></math></p>`, (m) =>
        Promise.resolve(stubConverter(m))
      );
      expect(bodyXml(parsed)).toContain('<m:t>x</m:t>');
    });

    test('falls back to plain text when the converter throws', async () => {
      const parsed = await convert(`<p>Let <math ${MATHML_NS}><mi>y</mi></math></p>`, () => {
        throw new Error('boom');
      });
      const xml = bodyXml(parsed);
      expect(xml).not.toContain('<m:oMath');
      expect(xml).toContain('<w:t xml:space="preserve">y</w:t>');
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('boom'));
    });

    test.each([
      ['not OMML', () => '<w:r><w:t>x</w:t></w:r>'],
      ['malformed XML', () => '<m:oMath><m:r><m:t>x</m:r></m:oMath>'],
    ])('falls back to plain text when the output is %s', async (_name, converter) => {
      const parsed = await convert(`<p><math ${MATHML_NS}><mi>z</mi></math></p>`, converter);
      const xml = bodyXml(parsed);
      expect(xml).not.toContain('<m:oMath');
      expect(xml).toContain('<w:t xml:space="preserve">z</w:t>');
    });
  });
});
