/* eslint-disable no-console */
const fs = require('fs');
// FIXME: Incase you have the npm package
// const HTMLtoDOCX = require('html-to-docx');
const HTMLtoDOCX = require('../dist/html-to-docx.umd');

const filePath = './example-table_alignments.docx';


const htmlString = `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8" />
    <title>Document</title>
</head>

<body>
    <div>
        <p>Center align table</p>
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
        <p>Left align table</p>
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
        <p>Right align table</p>
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
        <p>Right align table</p>
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
        <p>No alignment given</p>
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