/* eslint-disable no-console */

/**
 * Deterministic DOCX generation example for CI testing.
 * This version uses the deterministicIds option to ensure reproducible output.
 */

const fs = require('fs');
const HTMLtoDOCX = require('../dist/html-to-docx.umd');

const filePath = './example-node.docx';

const htmlString = `<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <title>Document</title>
    </head>
    <body>
        <div>
            <p>Taken from wikipedia</p>
            <img
                src="data:image/png;base64, iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg=="
                alt="Red dot"
            />
            <img
                src="https://upload.wikimedia.org/wikipedia/commons/4/47/PNG_transparency_demonstration_1.png"
                alt="Red dot"
            />
        </div>
    </body>
</html>`;

(async () => {
  const docx = await HTMLtoDOCX(htmlString, null, {
    deterministicIds: true, // Enable deterministic IDs for reproducible output
  });

  fs.writeFile(filePath, docx, (error) => {
    if (error) {
      console.log('An error occurred');
      throw error;
    }
    console.log('Docx file created successfully');
  });
})();
