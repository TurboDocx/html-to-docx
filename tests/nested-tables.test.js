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
});
