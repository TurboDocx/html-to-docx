/* eslint-disable no-console */
const fs = require('fs');
// FIXME: Incase you have the npm package
// const HTMLtoDOCX = require('html-to-docx');
const HTMLtoDOCX = require('../dist/html-to-docx.umd');

const filePath = './example-alignments.docx';


const htmlString = `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8" />
    <title>Document</title>
</head>

<body>
    <h2>Table Alignment Tests (using align attribute)</h2>

    <div>
        <p>Center align table (align="center")</p>
        <table align="center" style="border-collapse:collapse;" border=1>
            <tr>
                <td>Row 1, cell 1</td>
                <td>Row 1, cell 2</td>
            </tr>
            <tr>
                <td>Row 2, cell 1</td>
                <td>Row 2, cell 2</td>
            </tr>
        </table>
    </div>

    <div>
        <p>Left align table (align="left")</p>
        <table align="left" style="border-collapse:collapse;" border=1>
            <tr>
                <td>Row 1, cell 1</td>
                <td>Row 1, cell 2</td>
            </tr>
            <tr>
                <td>Row 2, cell 1</td>
                <td>Row 2, cell 2</td>
            </tr>
        </table>
    </div>

    <div>
        <p>Right align table (align="right")</p>
        <table align="right" style="border-collapse:collapse;" border=1>
            <tr>
                <td>R1, cell 1</td>
                <td>R 1, cell 2</td>
            </tr>
            <tr>
                <td>Row 2, cell 1</td>
                <td>Row 2, cell 2</td>
            </tr>
        </table>
    </div>

    <div>
        <p>Right align table with center text-align for cell content (align="right" style="text-align:center")</p>
        <table align="right" style="border-collapse:collapse; text-align:center" border=1>
            <tr>
                <td>R1, cell 1</td>
                <td>R 1, cell 2</td>
            </tr>
            <tr>
                <td>Row 2, cell 1</td>
                <td>Row 2, cell 2</td>
            </tr>
        </table>
    </div>

    <div>
        <p>No alignment given (should default to center)</p>
        <table style="border-collapse:collapse;" border=1>
            <tr>
                <td>Row 1, cell 1</td>
                <td>Row 1, cell 2</td>
            </tr>
            <tr>
                <td>Row 2, cell 1</td>
                <td>Row 2, cell 2</td>
            </tr>
        </table>
    </div>

    <h2>Paragraph Alignment Tests (using align attribute)</h2>

    <p align="left">This paragraph has align="left"</p>
    <p align="center">This paragraph has align="center"</p>
    <p align="right">This paragraph has align="right"</p>
    <p align="justify">This paragraph has align="justify". Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>

    <h2>Paragraph Alignment Tests (using CSS text-align)</h2>

    <p style="text-align: left">This paragraph has style="text-align: left"</p>
    <p style="text-align: center">This paragraph has style="text-align: center"</p>
    <p style="text-align: right">This paragraph has style="text-align: right"</p>
    <p style="text-align: justify">This paragraph has style="text-align: justify". Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>

    <h2>CSS text-align takes precedence over align attribute</h2>

    <p align="left" style="text-align: right">This paragraph has align="left" but style="text-align: right" - should be RIGHT aligned</p>
    <p align="right" style="text-align: center">This paragraph has align="right" but style="text-align: center" - should be CENTER aligned</p>

    <h2>Div Alignment Tests (using align attribute)</h2>

    <div align="center">
        <p>This div has align="center" - this text should be centered</p>
    </div>

    <div align="right">
        <p>This div has align="right" - this text should be right aligned</p>
    </div>

</body>

</html>`;

(async () => {
  const fileBuffer = await HTMLtoDOCX(htmlString, null, {
    table: {
      row: { cantSplit: true },
      addSpacingAfter: true,
      borderOptions: {
        size: 2,
        stroke: "single",
        color: "000000",
      },
    },
    footer: true,
    pageNumber: true,
    preprocessing: { skipHTMLMinify: false },
    imageProcessing: {
      // By default, shows a warning when sharp is not installed
      // Uncomment to suppress the warning (useful for intentional native SVG mode):
      // suppressSharpWarning: true,
    },
    // ===================================================================
    // WARNING: deterministicIds is ONLY for CI/CD testing purposes.
    // DO NOT use this option in production.
    // DO NOT change this line.
    // This option makes image filenames sequential (image-0.png, image-1.png)
    // instead of random UUIDs, allowing automated regression testing.
    // ===================================================================
    deterministicIds: process.env.DETERMINISTIC_IDS === 'true',
  });

  fs.writeFile(filePath, fileBuffer, (error) => {
    if (error) {
      console.log('Docx file creation failed');
      return;
    }
    console.log('Docx file created successfully');
  });
})();