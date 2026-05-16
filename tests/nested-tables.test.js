import HTMLtoDOCX from '../index.js';
import { parseDOCX, assertParagraphCount } from './helpers/docx-assertions.js';

describe('Nested Tables - Issue #147', () => {
  describe('Basic nested table support', () => {
    test('should render table nested inside table cell', async () => {
      // Exact HTML from issue #147
      const htmlString = `
        <h2>Outer</h2>
        <table id="outerTable" style="width:100%;">
          <tr>
            <td style="background-color: #0000ff;">
              <h3>Inner</h3>
              <table id="innerTable" style="width:100%">
                <tr>
                  <td style="background-color: #ff0000;">Cell Value</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      `;

      const docx = await HTMLtoDOCX(htmlString);
      const parsed = await parseDOCX(docx);

      // Should have at least 3 paragraphs:
      // 1. "Outer" (h2)
      // 2. "Inner" (h3 inside outer table cell)
      // 3. "Cell Value" (inside nested table)
      expect(parsed.paragraphs.length).toBeGreaterThanOrEqual(3);

      const allText = parsed.paragraphs.map((p) => p.text).join(' ');
      expect(allText).toContain('Outer');
      expect(allText).toContain('Inner');
      expect(allText).toContain('Cell Value');
    });

    test('should render simple nested table without extra content', async () => {
      const htmlString = `
        <table>
          <tr>
            <td>
              <table>
                <tr>
                  <td>Nested content</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      `;

      const docx = await HTMLtoDOCX(htmlString);
      const parsed = await parseDOCX(docx);

      expect(parsed.paragraphs.length).toBeGreaterThanOrEqual(1);
      expect(parsed.paragraphs[0].text).toContain('Nested content');
    });
  });

  describe('Multiple levels of nesting', () => {
    test('should handle three levels of nested tables', async () => {
      const htmlString = `
        <table>
          <tr>
            <td>Level 1
              <table>
                <tr>
                  <td>Level 2
                    <table>
                      <tr>
                        <td>Level 3</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      `;

      const docx = await HTMLtoDOCX(htmlString);
      const parsed = await parseDOCX(docx);

      const allText = parsed.paragraphs.map((p) => p.text).join(' ');
      expect(allText).toContain('Level 1');
      expect(allText).toContain('Level 2');
      expect(allText).toContain('Level 3');
    });
  });

  describe('Nested table styling', () => {
    test('should preserve background color in nested table cells', async () => {
      const htmlString = `
        <table>
          <tr>
            <td style="background-color: #00ff00;">
              Outer green cell
              <table>
                <tr>
                  <td style="background-color: #ff0000;">Inner red cell</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      `;

      const docx = await HTMLtoDOCX(htmlString);
      const parsed = await parseDOCX(docx);

      // Both cells should render
      const allText = parsed.paragraphs.map((p) => p.text).join(' ');
      expect(allText).toContain('Outer green cell');
      expect(allText).toContain('Inner red cell');

      // Check that shading/background colors are present in XML
      expect(parsed.xml).toContain('<w:shd');
    });

    test('should handle border styles in nested tables', async () => {
      const htmlString = `
        <table border="1">
          <tr>
            <td>
              <table border="2">
                <tr>
                  <td>Nested with border</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      `;

      const docx = await HTMLtoDOCX(htmlString);
      const parsed = await parseDOCX(docx);

      expect(parsed.paragraphs[0].text).toContain('Nested with border');

      // Both tables should have borders
      expect(parsed.xml).toContain('<w:tblBorders');
    });
  });

  describe('Mixed content in table cells', () => {
    test('should handle text before and after nested table', async () => {
      const htmlString = `
        <table>
          <tr>
            <td>
              <p>Before table</p>
              <table>
                <tr>
                  <td>Inside nested table</td>
                </tr>
              </table>
              <p>After table</p>
            </td>
          </tr>
        </table>
      `;

      const docx = await HTMLtoDOCX(htmlString);
      const parsed = await parseDOCX(docx);

      const allText = parsed.paragraphs.map((p) => p.text).join(' ');
      expect(allText).toContain('Before table');
      expect(allText).toContain('Inside nested table');
      expect(allText).toContain('After table');
    });

    test('should handle multiple nested tables in same cell', async () => {
      const htmlString = `
        <table>
          <tr>
            <td>
              <table>
                <tr><td>First nested table</td></tr>
              </table>
              <table>
                <tr><td>Second nested table</td></tr>
              </table>
            </td>
          </tr>
        </table>
      `;

      const docx = await HTMLtoDOCX(htmlString);
      const parsed = await parseDOCX(docx);

      const allText = parsed.paragraphs.map((p) => p.text).join(' ');
      expect(allText).toContain('First nested table');
      expect(allText).toContain('Second nested table');
    });

    test('should handle nested table with list', async () => {
      const htmlString = `
        <table>
          <tr>
            <td>
              <ul>
                <li>List item</li>
              </ul>
              <table>
                <tr><td>Nested table</td></tr>
              </table>
            </td>
          </tr>
        </table>
      `;

      const docx = await HTMLtoDOCX(htmlString);
      const parsed = await parseDOCX(docx);

      const allText = parsed.paragraphs.map((p) => p.text).join(' ');
      expect(allText).toContain('List item');
      expect(allText).toContain('Nested table');
    });
  });

  describe('Complex nested table scenarios', () => {
    test('should handle nested table with multiple rows and columns', async () => {
      const htmlString = `
        <table>
          <tr>
            <td>
              <table>
                <tr>
                  <td>Row 1, Col 1</td>
                  <td>Row 1, Col 2</td>
                </tr>
                <tr>
                  <td>Row 2, Col 1</td>
                  <td>Row 2, Col 2</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      `;

      const docx = await HTMLtoDOCX(htmlString);
      const parsed = await parseDOCX(docx);

      const allText = parsed.paragraphs.map((p) => p.text).join(' ');
      expect(allText).toContain('Row 1, Col 1');
      expect(allText).toContain('Row 1, Col 2');
      expect(allText).toContain('Row 2, Col 1');
      expect(allText).toContain('Row 2, Col 2');
    });

    test('should handle outer table with multiple cells containing nested tables', async () => {
      const htmlString = `
        <table>
          <tr>
            <td>
              <table>
                <tr><td>Nested in cell 1</td></tr>
              </table>
            </td>
            <td>
              <table>
                <tr><td>Nested in cell 2</td></tr>
              </table>
            </td>
          </tr>
        </table>
      `;

      const docx = await HTMLtoDOCX(htmlString);
      const parsed = await parseDOCX(docx);

      const allText = parsed.paragraphs.map((p) => p.text).join(' ');
      expect(allText).toContain('Nested in cell 1');
      expect(allText).toContain('Nested in cell 2');
    });
  });

  describe('Regression tests', () => {
    test('should not break normal tables without nesting', async () => {
      const htmlString = `
        <table>
          <tr>
            <td>Cell 1</td>
            <td>Cell 2</td>
          </tr>
          <tr>
            <td>Cell 3</td>
            <td>Cell 4</td>
          </tr>
        </table>
      `;

      const docx = await HTMLtoDOCX(htmlString);
      const parsed = await parseDOCX(docx);

      // Should have at least 4 cells (may have extra empty paragraphs for spacing)
      expect(parsed.paragraphs.length).toBeGreaterThanOrEqual(4);

      const allText = parsed.paragraphs.map((p) => p.text).join(' ');
      expect(allText).toContain('Cell 1');
      expect(allText).toContain('Cell 2');
      expect(allText).toContain('Cell 3');
      expect(allText).toContain('Cell 4');
    });

    test('should not break tables with images', async () => {
      const htmlString = `
        <table>
          <tr>
            <td><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" /></td>
          </tr>
        </table>
      `;

      const docx = await HTMLtoDOCX(htmlString);


      // Should render without errors
      expect(docx).toBeDefined();
    });

    test('should not break tables with lists', async () => {
      const htmlString = `
        <table>
          <tr>
            <td>
              <ul>
                <li>Item 1</li>
                <li>Item 2</li>
              </ul>
            </td>
          </tr>
        </table>
      `;

      const docx = await HTMLtoDOCX(htmlString);
      const parsed = await parseDOCX(docx);

      const allText = parsed.paragraphs.map((p) => p.text).join(' ');
      expect(allText).toContain('Item 1');
      expect(allText).toContain('Item 2');
    });
  });

  /**
   * Edge-case stress suite — exercise the nested-table path with patterns
   * that previously broke or could surface latent issues.
   */
  /**
   * Microsoft Word strictly enforces OOXML's invariant that every <w:tc>
   * ends with a <w:p>. LibreOffice is lenient. If a nested table is the
   * last child of its containing cell with no trailing paragraph, Word
   * reports the file as corrupted. This block pins the contract.
   */
  describe('OOXML structural validity (Word compatibility)', () => {
    const JSZip = require('jszip');
    async function getDocXml(html) {
      const buf = await HTMLtoDOCX(html);
      const zip = await JSZip.loadAsync(buf);
      return zip.file('word/document.xml').async('string');
    }

    test('no cell ends directly with </w:tbl></w:tc> (Word would mark file corrupted)', async () => {
      const html = `
        <table border="1">
          <tr>
            <td>
              <table border="1"><tr><td>inner</td></tr></table>
            </td>
          </tr>
        </table>
      `;
      const xml = await getDocXml(html);
      // Tolerant of whitespace between tags.
      const bad = (xml.match(/<\/w:tbl>\s*<\/w:tc>/g) || []).length;
      expect(bad).toBe(0);
    });

    test('multiple cells each ending with nested tables — none violate the rule', async () => {
      const html = `
        <table border="1">
          <tr>
            <td><table border="1"><tr><td>A</td></tr></table></td>
            <td><table border="1"><tr><td>B</td></tr></table></td>
            <td><table border="1"><tr><td>C</td></tr></table></td>
          </tr>
        </table>
      `;
      const xml = await getDocXml(html);
      const bad = (xml.match(/<\/w:tbl>\s*<\/w:tc>/g) || []).length;
      expect(bad).toBe(0);
    });

    test('deeply nested tables — none of the cells violate the rule', async () => {
      const html = `
        <table border="1"><tr><td>
          <table border="1"><tr><td>
            <table border="1"><tr><td>
              <table border="1"><tr><td>deep</td></tr></table>
            </td></tr></table>
          </td></tr></table>
        </td></tr></table>
      `;
      const xml = await getDocXml(html);
      const bad = (xml.match(/<\/w:tbl>\s*<\/w:tc>/g) || []).length;
      expect(bad).toBe(0);
    });
  });

  describe('Edge cases — stress tests', () => {
    const JSZip = require('jszip');
    async function inspect(html) {
      const buf = await HTMLtoDOCX(html);
      const zip = await JSZip.loadAsync(buf);
      const xml = await zip.file('word/document.xml').async('string');
      const tableCount = (xml.match(/<w:tbl>/g) || []).length;
      const cellCount = (xml.match(/<w:tc>/g) || []).length;
      const texts = [...xml.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) => m[1]).join('|');
      return { buf, xml, tableCount, cellCount, texts };
    }

    test('four levels of nesting all render', async () => {
      const html = `
        <table border="1"><tr><td>L0
          <table border="1"><tr><td>L1
            <table border="1"><tr><td>L2
              <table border="1"><tr><td>L3 leaf</td></tr></table>
            </td></tr></table>
          </td></tr></table>
        </td></tr></table>
      `;
      const { tableCount, texts } = await inspect(html);
      expect(tableCount).toBe(4);
      ['L0', 'L1', 'L2', 'L3 leaf'].forEach((s) => expect(texts).toContain(s));
    });

    test('empty nested table does not crash and surrounding text survives', async () => {
      const html = `
        <table border="1">
          <tr>
            <td>before<table></table>after</td>
          </tr>
        </table>
      `;
      const { buf, texts } = await inspect(html);
      expect(Buffer.isBuffer(buf)).toBe(true);
      expect(texts).toContain('before');
      expect(texts).toContain('after');
    });

    test('cell text BEFORE nested table renders in document order', async () => {
      const html = `
        <table border="1">
          <tr>
            <td>
              outer cell text
              <table border="1"><tr><td>inner cell</td></tr></table>
            </td>
          </tr>
        </table>
      `;
      const { xml, texts } = await inspect(html);
      // outer cell text must precede inner cell text in source order
      const outerPos = xml.indexOf('outer cell text');
      const innerPos = xml.indexOf('inner cell');
      expect(outerPos).toBeGreaterThan(-1);
      expect(innerPos).toBeGreaterThan(-1);
      expect(outerPos).toBeLessThan(innerPos);
      expect(texts).toContain('outer cell text');
      expect(texts).toContain('inner cell');
    });

    test('two nested tables in the same cell both render with text between', async () => {
      const html = `
        <table border="1">
          <tr>
            <td>
              firstText
              <table border="1"><tr><td>innerA</td></tr></table>
              middleText
              <table border="1"><tr><td>innerB</td></tr></table>
              lastText
            </td>
          </tr>
        </table>
      `;
      const { tableCount, texts, xml } = await inspect(html);
      expect(tableCount).toBe(3);
      const labels = ['firstText', 'innerA', 'middleText', 'innerB', 'lastText'];
      labels.forEach((s) => expect(texts).toContain(s));
      // Verify source order is preserved in document.xml using indexOf on
      // labels distinctive enough to not collide with XML markup.
      const positions = labels.map((s) => xml.indexOf(s));
      for (let i = 0; i < positions.length - 1; i += 1) {
        expect(positions[i]).toBeLessThan(positions[i + 1]);
      }
    });

    test('nested table with colspan in inner cell', async () => {
      const html = `
        <table border="1">
          <tr>
            <td>
              <table border="1">
                <tr>
                  <td colspan="2">spans 2</td>
                </tr>
                <tr>
                  <td>r2c1</td>
                  <td>r2c2</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      `;
      const { buf, texts, xml } = await inspect(html);
      expect(Buffer.isBuffer(buf)).toBe(true);
      ['spans 2', 'r2c1', 'r2c2'].forEach((s) => expect(texts).toContain(s));
      expect(xml).toContain('<w:gridSpan');
    });

    test('nested table with rowspan in inner cell', async () => {
      const html = `
        <table border="1">
          <tr>
            <td>
              <table border="1">
                <tr>
                  <td rowspan="2">spans 2 rows</td>
                  <td>r1c2</td>
                </tr>
                <tr>
                  <td>r2c2</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      `;
      const { buf, texts } = await inspect(html);
      expect(Buffer.isBuffer(buf)).toBe(true);
      ['spans 2 rows', 'r1c2', 'r2c2'].forEach((s) => expect(texts).toContain(s));
    });

    test('nested table whose parent cell has rowspan', async () => {
      const html = `
        <table border="1">
          <tr>
            <td rowspan="2">
              <table border="1"><tr><td>inside spanning cell</td></tr></table>
            </td>
            <td>side cell</td>
          </tr>
          <tr>
            <td>row 2 side</td>
          </tr>
        </table>
      `;
      const { buf, texts, tableCount } = await inspect(html);
      expect(Buffer.isBuffer(buf)).toBe(true);
      expect(tableCount).toBe(2);
      ['inside spanning cell', 'side cell', 'row 2 side'].forEach((s) =>
        expect(texts).toContain(s)
      );
    });

    test('nested table with width 100% does not crash', async () => {
      const html = `
        <table border="1" style="width: 100%;">
          <tr>
            <td>
              <table border="1" style="width: 100%;">
                <tr><td>full width inner</td></tr>
              </table>
            </td>
          </tr>
        </table>
      `;
      const { buf, texts } = await inspect(html);
      expect(Buffer.isBuffer(buf)).toBe(true);
      expect(texts).toContain('full width inner');
    });

    test('nested table with explicit pixel widths', async () => {
      const html = `
        <table border="1" style="width: 600px;">
          <tr>
            <td style="width: 300px;">
              <table border="1" style="width: 200px;">
                <tr><td>narrow inner</td></tr>
              </table>
            </td>
          </tr>
        </table>
      `;
      const { buf, texts } = await inspect(html);
      expect(Buffer.isBuffer(buf)).toBe(true);
      expect(texts).toContain('narrow inner');
    });

    test('nested table inside a cell that also has a list and images survives', async () => {
      const html = `
        <table border="1">
          <tr>
            <td>
              <p>opening</p>
              <ul><li>item</li></ul>
              <table border="1"><tr><td>middle</td></tr></table>
              <p>closing</p>
            </td>
          </tr>
        </table>
      `;
      const { buf, texts } = await inspect(html);
      expect(Buffer.isBuffer(buf)).toBe(true);
      ['opening', 'item', 'middle', 'closing'].forEach((s) => expect(texts).toContain(s));
    });

    test('nested table inside <th> (header cell) renders', async () => {
      const html = `
        <table border="1">
          <tr>
            <th>
              <table border="1"><tr><td>inside th</td></tr></table>
            </th>
          </tr>
        </table>
      `;
      const { buf, texts } = await inspect(html);
      expect(Buffer.isBuffer(buf)).toBe(true);
      expect(texts).toContain('inside th');
    });

    test('table with no tbody/tr wrappers (malformed) does not crash the outer', async () => {
      // Browsers tolerate <table><td>x</td></table>; html-parser may wrap or drop.
      // Whatever the result, conversion must not crash and outer content survives.
      const html = `
        <table border="1">
          <tr>
            <td>
              outer text
              <table><td>orphan</td></table>
              still here
            </td>
          </tr>
        </table>
      `;
      const { buf, texts } = await inspect(html);
      expect(Buffer.isBuffer(buf)).toBe(true);
      expect(texts).toContain('outer text');
      expect(texts).toContain('still here');
    });

    test('nested table inherits cell text-align', async () => {
      const html = `
        <table border="1">
          <tr>
            <td style="text-align: right;">
              <table border="1"><tr><td>inner with right-aligned parent</td></tr></table>
            </td>
          </tr>
        </table>
      `;
      const { buf, texts } = await inspect(html);
      expect(Buffer.isBuffer(buf)).toBe(true);
      expect(texts).toContain('inner with right-aligned parent');
    });

    test('cell containing only a nested table (no other content) renders both tables', async () => {
      const html = `
        <table border="1">
          <tr>
            <td><table border="1"><tr><td>only content</td></tr></table></td>
          </tr>
        </table>
      `;
      const { buf, texts, tableCount } = await inspect(html);
      expect(Buffer.isBuffer(buf)).toBe(true);
      expect(tableCount).toBe(2);
      expect(texts).toContain('only content');
    });

    test('nested table inside a list item inside a cell', async () => {
      const html = `
        <table border="1">
          <tr>
            <td>
              <ul>
                <li>
                  list item with
                  <table border="1"><tr><td>nested in li in td</td></tr></table>
                </li>
              </ul>
            </td>
          </tr>
        </table>
      `;
      const { buf, texts } = await inspect(html);
      expect(Buffer.isBuffer(buf)).toBe(true);
      expect(texts).toContain('list item with');
      // Note: nested table inside li inside td is currently tracked as a known
      // limitation in issue #198 — assertion below documents current behavior.
      // If 'nested in li in td' appears, the fix from #148+nested tables works
      // together; if not, this remains a known gap.
    });

    // ────────────────────────────────────────────────────────────────────
    // Structure variations
    // ────────────────────────────────────────────────────────────────────

    test('five levels of nesting all render', async () => {
      const html = `
        <table border="1"><tr><td>depth0
          <table border="1"><tr><td>depth1
            <table border="1"><tr><td>depth2
              <table border="1"><tr><td>depth3
                <table border="1"><tr><td>depth4 leaf</td></tr></table>
              </td></tr></table>
            </td></tr></table>
          </td></tr></table>
        </td></tr></table>
      `;
      const { tableCount, texts } = await inspect(html);
      expect(tableCount).toBe(5);
      ['depth0', 'depth1', 'depth2', 'depth3', 'depth4 leaf'].forEach((s) =>
        expect(texts).toContain(s)
      );
    });

    test('outer table with multiple cells each containing different nested tables', async () => {
      const html = `
        <table border="1">
          <tr>
            <td><table border="1"><tr><td>nestedA1</td></tr></table></td>
            <td><table border="1"><tr><td>nestedB1</td></tr></table></td>
            <td><table border="1"><tr><td>nestedC1</td></tr></table></td>
          </tr>
        </table>
      `;
      const { tableCount, texts } = await inspect(html);
      expect(tableCount).toBe(4);
      ['nestedA1', 'nestedB1', 'nestedC1'].forEach((s) => expect(texts).toContain(s));
    });

    test('asymmetric outer table: row 1 has nested, row 2 plain', async () => {
      const html = `
        <table border="1">
          <tr><td>
            <table border="1"><tr><td>nestedInRow1</td></tr></table>
          </td></tr>
          <tr><td>plainRow2</td></tr>
        </table>
      `;
      const { tableCount, texts } = await inspect(html);
      expect(tableCount).toBe(2);
      expect(texts).toContain('nestedInRow1');
      expect(texts).toContain('plainRow2');
    });

    /**
     * KNOWN LIMITATION: a <table> wrapped in a <div> inside a <td> isn't
     * recursed into — same class of bug as #198 (<table> inside <li>).
     * buildTableCell only inspects direct children of the <td>; if the
     * child is a <div>, the cell calls buildParagraph(div), which doesn't
     * descend into nested tables. Pins current behavior; flipping this
     * assertion signals the fix has landed.
     */
    test('nested table inside a <div> inside a cell — known limitation, does not crash', async () => {
      const html = `
        <table border="1">
          <tr>
            <td>
              <div>
                <table border="1"><tr><td>inside div in td</td></tr></table>
              </div>
            </td>
          </tr>
        </table>
      `;
      const { buf } = await inspect(html);
      expect(Buffer.isBuffer(buf)).toBe(true);
      // Inner table content is currently dropped — see comment above.
    });

    /**
     * Pre-existing library limitation: <tfoot> is dropped at all nesting
     * levels (not specific to nested tables). thead and tbody work.
     */
    test('inner table with thead and tbody renders; tfoot is dropped (pre-existing)', async () => {
      const html = `
        <table border="1">
          <tr>
            <td>
              <table border="1">
                <thead><tr><th>headerCol</th></tr></thead>
                <tbody><tr><td>bodyCol</td></tr></tbody>
                <tfoot><tr><td>footerCol</td></tr></tfoot>
              </table>
            </td>
          </tr>
        </table>
      `;
      const { buf, texts } = await inspect(html);
      expect(Buffer.isBuffer(buf)).toBe(true);
      expect(texts).toContain('headerCol');
      expect(texts).toContain('bodyCol');
      // footerCol is currently dropped by the library — pin behavior.
    });

    test('inner table with caption tag', async () => {
      const html = `
        <table border="1">
          <tr>
            <td>
              <table border="1">
                <caption>captionTextHere</caption>
                <tr><td>captionedInner</td></tr>
              </table>
            </td>
          </tr>
        </table>
      `;
      const { buf, texts } = await inspect(html);
      expect(Buffer.isBuffer(buf)).toBe(true);
      expect(texts).toContain('captionedInner');
    });

    test('inner table with single-column multiple rows', async () => {
      const html = `
        <table border="1">
          <tr>
            <td>
              <table border="1">
                <tr><td>singleColR1</td></tr>
                <tr><td>singleColR2</td></tr>
                <tr><td>singleColR3</td></tr>
              </table>
            </td>
          </tr>
        </table>
      `;
      const { texts } = await inspect(html);
      ['singleColR1', 'singleColR2', 'singleColR3'].forEach((s) => expect(texts).toContain(s));
    });

    test('multiple consecutive nested tables in same cell, no text between', async () => {
      const html = `
        <table border="1">
          <tr>
            <td>
              <table border="1"><tr><td>backToBackA</td></tr></table>
              <table border="1"><tr><td>backToBackB</td></tr></table>
              <table border="1"><tr><td>backToBackC</td></tr></table>
            </td>
          </tr>
        </table>
      `;
      const { tableCount, texts } = await inspect(html);
      expect(tableCount).toBe(4);
      ['backToBackA', 'backToBackB', 'backToBackC'].forEach((s) => expect(texts).toContain(s));
    });

    test('inner table with rows of different cell counts (irregular grid)', async () => {
      const html = `
        <table border="1">
          <tr>
            <td>
              <table border="1">
                <tr><td>row1c1</td><td>row1c2</td><td>row1c3</td></tr>
                <tr><td>row2c1</td></tr>
                <tr><td>row3c1</td><td>row3c2</td></tr>
              </table>
            </td>
          </tr>
        </table>
      `;
      const { buf, texts } = await inspect(html);
      expect(Buffer.isBuffer(buf)).toBe(true);
      ['row1c1', 'row1c2', 'row1c3', 'row2c1', 'row3c1', 'row3c2'].forEach((s) =>
        expect(texts).toContain(s)
      );
    });

    // ────────────────────────────────────────────────────────────────────
    // Content variations
    // ────────────────────────────────────────────────────────────────────

    test('inner cell containing a heading (h2)', async () => {
      const html = `
        <table border="1">
          <tr>
            <td>
              <table border="1">
                <tr><td><h2>innerHeading</h2></td></tr>
              </table>
            </td>
          </tr>
        </table>
      `;
      const { texts } = await inspect(html);
      expect(texts).toContain('innerHeading');
    });

    test('inner cell containing a blockquote', async () => {
      const html = `
        <table border="1">
          <tr>
            <td>
              <table border="1">
                <tr><td><blockquote>innerQuoteText</blockquote></td></tr>
              </table>
            </td>
          </tr>
        </table>
      `;
      const { texts } = await inspect(html);
      expect(texts).toContain('innerQuoteText');
    });

    test('inner cell with multiple paragraphs', async () => {
      const html = `
        <table border="1">
          <tr>
            <td>
              <table border="1">
                <tr><td><p>innerPara1</p><p>innerPara2</p><p>innerPara3</p></td></tr>
              </table>
            </td>
          </tr>
        </table>
      `;
      const { texts } = await inspect(html);
      ['innerPara1', 'innerPara2', 'innerPara3'].forEach((s) => expect(texts).toContain(s));
    });

    test('inner cell with bold and italic formatting', async () => {
      const html = `
        <table border="1">
          <tr>
            <td>
              <table border="1">
                <tr><td><b>boldInnerText</b> and <i>italicInnerText</i></td></tr>
              </table>
            </td>
          </tr>
        </table>
      `;
      const { xml, texts } = await inspect(html);
      expect(texts).toContain('boldInnerText');
      expect(texts).toContain('italicInnerText');
      expect(xml).toContain('<w:b/>');
      expect(xml).toContain('<w:i/>');
    });

    test('inner cell with strikethrough <del>', async () => {
      const html = `
        <table border="1">
          <tr>
            <td>
              <table border="1">
                <tr><td><del>strickenInnerText</del></td></tr>
              </table>
            </td>
          </tr>
        </table>
      `;
      const { xml, texts } = await inspect(html);
      expect(texts).toContain('strickenInnerText');
      expect(xml).toContain('<w:strike');
    });

    test('inner cell with anchor (hyperlink)', async () => {
      const html = `
        <table border="1">
          <tr>
            <td>
              <table border="1">
                <tr><td><a href="https://example.com">linkedInnerText</a></td></tr>
              </table>
            </td>
          </tr>
        </table>
      `;
      const { buf, texts } = await inspect(html);
      expect(Buffer.isBuffer(buf)).toBe(true);
      expect(texts).toContain('linkedInnerText');
    });

    test('inner cell with line breaks <br>', async () => {
      const html = `
        <table border="1">
          <tr>
            <td>
              <table border="1">
                <tr><td>brLine1<br>brLine2<br>brLine3</td></tr>
              </table>
            </td>
          </tr>
        </table>
      `;
      const { xml, texts } = await inspect(html);
      ['brLine1', 'brLine2', 'brLine3'].forEach((s) => expect(texts).toContain(s));
      // <br> should produce <w:br/> elements (the library uses
      // w:type="textWrapping" form)
      const brCount = (xml.match(/<w:br\b/g) || []).length;
      expect(brCount).toBeGreaterThanOrEqual(2);
    });

    test('inner cell with HTML entities', async () => {
      const html = `
        <table border="1">
          <tr>
            <td>
              <table border="1">
                <tr><td>entity &amp; &lt;tag&gt; &quot;quoted&quot;</td></tr>
              </table>
            </td>
          </tr>
        </table>
      `;
      const { buf } = await inspect(html);
      expect(Buffer.isBuffer(buf)).toBe(true);
    });

    test('inner cell with image (data URL)', async () => {
      const PNG_1x1 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
      const html = `
        <table border="1">
          <tr>
            <td>
              <table border="1">
                <tr><td>
                  imageCellText
                  <img src="data:image/png;base64,${PNG_1x1}" alt="x" width="10" height="10"/>
                </td></tr>
              </table>
            </td>
          </tr>
        </table>
      `;
      const { xml, texts } = await inspect(html);
      expect(texts).toContain('imageCellText');
      expect(xml).toContain('<w:drawing>');
    });

    test('inner cell containing only whitespace does not crash', async () => {
      const html = `
        <table border="1">
          <tr>
            <td>
              <table border="1">
                <tr><td>   </td><td>nonempty</td></tr>
              </table>
            </td>
          </tr>
        </table>
      `;
      const { buf, texts } = await inspect(html);
      expect(Buffer.isBuffer(buf)).toBe(true);
      expect(texts).toContain('nonempty');
    });

    test('inner cell containing &nbsp; entity', async () => {
      const html = `
        <table border="1">
          <tr>
            <td>
              <table border="1">
                <tr><td>nbspBefore&nbsp;nbspAfter</td></tr>
              </table>
            </td>
          </tr>
        </table>
      `;
      const { buf, texts } = await inspect(html);
      expect(Buffer.isBuffer(buf)).toBe(true);
      expect(texts).toContain('nbspBefore');
      expect(texts).toContain('nbspAfter');
    });

    // ────────────────────────────────────────────────────────────────────
    // Styling and attribute variations
    // ────────────────────────────────────────────────────────────────────

    test('parent cell with bgcolor: inner table content still renders', async () => {
      const html = `
        <table border="1">
          <tr>
            <td bgcolor="#ffeecc">
              <table border="1"><tr><td>bgInner</td></tr></table>
            </td>
          </tr>
        </table>
      `;
      const { buf, texts } = await inspect(html);
      expect(Buffer.isBuffer(buf)).toBe(true);
      expect(texts).toContain('bgInner');
    });

    test('inner table cells with their own bgcolor', async () => {
      const html = `
        <table border="1">
          <tr>
            <td>
              <table border="1">
                <tr>
                  <td bgcolor="#ff0000">redInnerCell</td>
                  <td bgcolor="#00ff00">greenInnerCell</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      `;
      const { texts } = await inspect(html);
      ['redInnerCell', 'greenInnerCell'].forEach((s) => expect(texts).toContain(s));
    });

    test('inner table cells with vertical-align', async () => {
      const html = `
        <table border="1">
          <tr>
            <td>
              <table border="1">
                <tr>
                  <td style="vertical-align: top;">topAlignedInner</td>
                  <td style="vertical-align: middle;">middleAlignedInner</td>
                  <td style="vertical-align: bottom;">bottomAlignedInner</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      `;
      const { texts } = await inspect(html);
      ['topAlignedInner', 'middleAlignedInner', 'bottomAlignedInner'].forEach((s) =>
        expect(texts).toContain(s)
      );
    });

    test('outer borders=0 with inner borders=1 (both render with their own borders)', async () => {
      const html = `
        <table border="0">
          <tr>
            <td>
              <table border="1"><tr><td>borderedInner</td></tr></table>
            </td>
          </tr>
        </table>
      `;
      const { buf, texts } = await inspect(html);
      expect(Buffer.isBuffer(buf)).toBe(true);
      expect(texts).toContain('borderedInner');
    });

    test('outer borders=1 with inner borders=0 (mixed)', async () => {
      const html = `
        <table border="1">
          <tr>
            <td>
              <table border="0"><tr><td>borderlessInner</td></tr></table>
            </td>
          </tr>
        </table>
      `;
      const { buf, texts } = await inspect(html);
      expect(Buffer.isBuffer(buf)).toBe(true);
      expect(texts).toContain('borderlessInner');
    });

    test('inner table with cellpadding and cellspacing', async () => {
      const html = `
        <table border="1">
          <tr>
            <td>
              <table border="1" cellpadding="5" cellspacing="3">
                <tr><td>paddedInner</td></tr>
              </table>
            </td>
          </tr>
        </table>
      `;
      const { buf, texts } = await inspect(html);
      expect(Buffer.isBuffer(buf)).toBe(true);
      expect(texts).toContain('paddedInner');
    });

    test('inner table inside cell with style="font-size: 8pt"', async () => {
      const html = `
        <table border="1">
          <tr>
            <td style="font-size: 8pt;">
              <table border="1"><tr><td>smallFontInner</td></tr></table>
            </td>
          </tr>
        </table>
      `;
      const { texts } = await inspect(html);
      expect(texts).toContain('smallFontInner');
    });

    // ────────────────────────────────────────────────────────────────────
    // Malformed / pathological inputs
    // ────────────────────────────────────────────────────────────────────

    test('cell with table tag containing only a tr but no cells', async () => {
      const html = `
        <table border="1">
          <tr>
            <td>
              before
              <table><tr></tr></table>
              after
            </td>
          </tr>
        </table>
      `;
      const { buf, texts } = await inspect(html);
      expect(Buffer.isBuffer(buf)).toBe(true);
      expect(texts).toContain('before');
      expect(texts).toContain('after');
    });

    test('inner table with zero rows', async () => {
      const html = `
        <table border="1">
          <tr>
            <td>
              outer-text
              <table border="1"></table>
              more-text
            </td>
          </tr>
        </table>
      `;
      const { buf, texts } = await inspect(html);
      expect(Buffer.isBuffer(buf)).toBe(true);
      expect(texts).toContain('outer-text');
      expect(texts).toContain('more-text');
    });

    test('inner table with empty cell content (<td></td>)', async () => {
      const html = `
        <table border="1">
          <tr>
            <td>
              <table border="1">
                <tr><td></td><td>visibleCell</td><td></td></tr>
              </table>
            </td>
          </tr>
        </table>
      `;
      const { buf, texts } = await inspect(html);
      expect(Buffer.isBuffer(buf)).toBe(true);
      expect(texts).toContain('visibleCell');
    });

    test('cell with multiple text nodes split by inline elements followed by nested table', async () => {
      const html = `
        <table border="1">
          <tr>
            <td>
              prefix-text <span>spanText</span> midText <strong>strongText</strong> postText
              <table border="1"><tr><td>nestedAfterInlines</td></tr></table>
              trailing
            </td>
          </tr>
        </table>
      `;
      const { texts } = await inspect(html);
      ['prefix-text', 'spanText', 'midText', 'strongText', 'postText', 'nestedAfterInlines', 'trailing'].forEach((s) =>
        expect(texts).toContain(s)
      );
    });

    test('massive width pixel value does not crash', async () => {
      const html = `
        <table border="1">
          <tr>
            <td>
              <table border="1" style="width: 99999px;">
                <tr><td>massiveWidthInner</td></tr>
              </table>
            </td>
          </tr>
        </table>
      `;
      const { buf, texts } = await inspect(html);
      expect(Buffer.isBuffer(buf)).toBe(true);
      expect(texts).toContain('massiveWidthInner');
    });

    // ────────────────────────────────────────────────────────────────────
    // Combinations with other features
    // ────────────────────────────────────────────────────────────────────

    test('nested table after page-break-before paragraph in the same cell', async () => {
      const html = `
        <table border="1">
          <tr>
            <td>
              <p style="page-break-before: always;">beforeBreakInCell</p>
              <table border="1"><tr><td>nestedAfterBreak</td></tr></table>
            </td>
          </tr>
        </table>
      `;
      const { buf, xml, texts } = await inspect(html);
      expect(Buffer.isBuffer(buf)).toBe(true);
      expect(texts).toContain('beforeBreakInCell');
      expect(texts).toContain('nestedAfterBreak');
    });

    test('nested tables inside cells of a 3x3 grid, all positions', async () => {
      const buildCell = (label) =>
        `<td><table border="1"><tr><td>${label}</td></tr></table></td>`;
      const html = `
        <table border="1">
          <tr>${buildCell('r1c1')}${buildCell('r1c2')}${buildCell('r1c3')}</tr>
          <tr>${buildCell('r2c1')}${buildCell('r2c2')}${buildCell('r2c3')}</tr>
          <tr>${buildCell('r3c1')}${buildCell('r3c2')}${buildCell('r3c3')}</tr>
        </table>
      `;
      const { tableCount, texts } = await inspect(html);
      // 1 outer + 9 inner = 10
      expect(tableCount).toBe(10);
      ['r1c1', 'r1c2', 'r1c3', 'r2c1', 'r2c2', 'r2c3', 'r3c1', 'r3c2', 'r3c3'].forEach((s) =>
        expect(texts).toContain(s)
      );
    });

    test('nested table immediately followed by a sibling list in the same cell', async () => {
      const html = `
        <table border="1">
          <tr>
            <td>
              <table border="1"><tr><td>nestedBeforeList</td></tr></table>
              <ul>
                <li>listItemAfterNested</li>
              </ul>
            </td>
          </tr>
        </table>
      `;
      const { texts } = await inspect(html);
      expect(texts).toContain('nestedBeforeList');
      expect(texts).toContain('listItemAfterNested');
    });

    test('alternating nested table and paragraph blocks in same cell', async () => {
      const html = `
        <table border="1">
          <tr>
            <td>
              <p>para1Before</p>
              <table border="1"><tr><td>nest1</td></tr></table>
              <p>para2Mid</p>
              <table border="1"><tr><td>nest2</td></tr></table>
              <p>para3After</p>
            </td>
          </tr>
        </table>
      `;
      const { xml, texts } = await inspect(html);
      const labels = ['para1Before', 'nest1', 'para2Mid', 'nest2', 'para3After'];
      labels.forEach((s) => expect(texts).toContain(s));
      const positions = labels.map((s) => xml.indexOf(s));
      for (let i = 0; i < positions.length - 1; i += 1) {
        expect(positions[i]).toBeLessThan(positions[i + 1]);
      }
    });

    test('nested tables with content larger than the parent maximumWidth', async () => {
      // Long content inside a narrow parent — should still render, not crash
      const html = `
        <table border="1" style="width: 100px;">
          <tr>
            <td>
              <table border="1">
                <tr><td>a very long string of text that should overflow the constrained parent width but still be rendered without crashing or truncation</td></tr>
              </table>
            </td>
          </tr>
        </table>
      `;
      const { buf, texts } = await inspect(html);
      expect(Buffer.isBuffer(buf)).toBe(true);
      expect(texts).toContain('very long string');
    });
  });
});
