/* eslint-disable no-console */
const fs = require('fs');
// FIXME: Incase you have the npm package
// const HTMLtoDOCX = require('html-to-docx');
const HTMLtoDOCX = require('../dist/html-to-docx.umd');

const filePath = './example-table-in-list.docx';

// A <table> nested inside an <li> is rendered as a real DOCX table.
//
// Word has no concept of a table carrying a bullet or number marker, so the
// table is emitted between the list item's paragraphs rather than on the
// marker line itself. Text before and after the table stays in the list.
const htmlString = `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8" />
    <title>Document</title>
</head>

<body>
    <h2>Table inside an unordered list</h2>

    <ul>
        <li>Plain item with no table</li>
        <li>
            <p>Item that introduces a table:</p>
            <table style="border-collapse:collapse;" border="1">
                <tr>
                    <th>Region</th>
                    <th>Units</th>
                </tr>
                <tr>
                    <td>North</td>
                    <td>120</td>
                </tr>
                <tr>
                    <td>South</td>
                    <td>340</td>
                </tr>
            </table>
            <p>Text after the table, still inside the same list item.</p>
        </li>
        <li>Item following the table</li>
    </ul>

    <h2>Table inside an ordered list</h2>

    <ol>
        <li>First step</li>
        <li>
            <p>Second step, with reference data:</p>
            <table style="border-collapse:collapse;" border="1">
                <tr>
                    <td>Timeout</td>
                    <td>30s</td>
                </tr>
                <tr>
                    <td>Retries</td>
                    <td>3</td>
                </tr>
            </table>
        </li>
        <li>Third step — numbering continues past the table</li>
    </ol>

    <h2>Table inside a nested list</h2>

    <ul>
        <li>
            Outer item
            <ul>
                <li>
                    <p>Nested item with a table:</p>
                    <table style="border-collapse:collapse;" border="1">
                        <tr>
                            <td>Nested</td>
                            <td>Cell</td>
                        </tr>
                    </table>
                </li>
            </ul>
        </li>
    </ul>
</body>

</html>`;

(async () => {
  const fileBuffer = await HTMLtoDOCX(htmlString, null, {
    table: {
      row: {
        cantSplit: true,
      },
      // Emits an empty paragraph after each table, including tables inside a
      // list item. Set to false to keep the following list text tight against
      // the table.
      addSpacingAfter: true,
    },
    footer: true,
    pageNumber: true,
  });

  fs.writeFile(filePath, fileBuffer, (error) => {
    if (error) {
      console.log('Docx file creation failed');
      return;
    }
    console.log('Docx file created successfully');
  });
})();
