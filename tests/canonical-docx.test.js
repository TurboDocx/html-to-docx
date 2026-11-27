import { canonicalXml } from './helpers/canonical-docx';

/**
 * The zero-regression suite's canonical form must forgive only 1.23.3's known invalid output,
 * never hide the same mistake in this branch's output.
 */

const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';
const grid = '<w:tblGrid><w:gridCol w:w="4320"/></w:tblGrid>';
const row = '<w:tr><w:tc><w:p/></w:tc></w:tr>';
const table = (inner) =>
  `<w:document ${W}><w:body><w:tbl><w:tblPr/>${inner}</w:tbl></w:body></w:document>`;
const gridCount = (text) => text.split('<w:tblGrid ').length - 1;

describe('the canonical form and a table grid', () => {
  it("keeps a second grid in this branch's output, so the suite sees it", () => {
    const xml = table(`${grid}${row}${grid}${row}`);

    expect(gridCount(canonicalXml({ xml }))).toBe(2);
  });

  it("drops 1.23.3's second grid between the rows", () => {
    const xml = table(`${grid}${row}${grid}${row}`);

    expect(gridCount(canonicalXml({ xml, dropLateGrids: true }))).toBe(1);
  });

  it("keeps a table's only grid, even when it follows a row", () => {
    const xml = table(`${row}${grid}${row}`);

    expect(gridCount(canonicalXml({ xml, dropLateGrids: true }))).toBe(1);
    expect(gridCount(canonicalXml({ xml }))).toBe(1);
  });
});
