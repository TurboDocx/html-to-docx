import HTMLtoDOCX from "@turbodocx/html-to-docx";
import * as fs from "fs";
import * as path from "path";

/**
 * This file demonstrates how to use html-to-docx with TypeScript
 * Run with ts-node or compile with tsc and then run with node
 */

const htmlString = `<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <title>TypeScript Example</title>
    </head>
    <body>
        <h1>Hello from TypeScript</h1>
        <p>This document was created using TypeScript and html-to-docx</p>
        
        <h2>Features</h2>
        <ul>
            <li>Convert HTML to DOCX</li>
            <li>Full TypeScript support</li>
            <li>Customizable options</li>
        </ul>
        
        <table border="1">
            <tr>
                <th>Feature</th>
                <th>Supported</th>
            </tr>
            <tr>
                <td>Headers and Footers</td>
                <td>Yes</td>
            </tr>
            <tr>
                <td>Custom Page Size</td>
                <td>Yes</td>
            </tr>
            <tr>
                <td>Tables</td>
                <td>Yes</td>
            </tr>
        </table>
    </body>
</html>`;

const headerHtml = `<p style="text-align: right;">TurboDocx Example</p>`;
const footerHtml = `<p style="text-align: center;">Page <span id="pageNumber">X</span> of <span id="totalPages">Y</span></p>`;

async function saveDocxFile(
  docResult: Buffer | ArrayBuffer | Blob,
  fileName: string,
  docType: string
) {
  let docData: Buffer;

  if (docResult === null) {
    console.error(`docResult is null for ${docType}`);
    return;
  }

  // Use instanceof checks for more reliable type detection
  switch (true) {
    case docResult instanceof Buffer:
      docData = docResult;
      break;
    case docResult instanceof ArrayBuffer:
      docData = Buffer.from(docResult);
      break;
    case typeof Blob !== 'undefined' && docResult instanceof Blob:
      console.log(`Received Blob for ${docType}, converting to ArrayBuffer then Buffer...`);
      const arrayBuffer = await docResult.arrayBuffer();
      docData = Buffer.from(arrayBuffer);
      break;
    default:
      console.error(`Unexpected result type for ${docType}:`, typeof docResult);
      console.log(`${docType} constructor name:`, docResult?.constructor?.name);
      return;
  }

  fs.writeFileSync(path.join(__dirname, fileName), docData);
  console.log(`${docType} document created: ${fileName}`);
}
async function generateDocuments() {
    try {
        // Basic example
        const basicDocResult = await HTMLtoDOCX(htmlString);
        await saveDocxFile(basicDocResult, "basic-example.docx", "Basic");

        // Advanced example with all options
        const advancedDocResult = await HTMLtoDOCX(
            htmlString,
            headerHtml,
            {
                orientation: "portrait",
                pageSize: {
                    width: 12240, // Letter width in TWIP
                    height: 15840 // Letter height in TWIP
                },
                margins: {
                    top: 1440,
                    right: 1800,
                    bottom: 1440,
                    left: 1800,
                    header: 720,
                    footer: 720
                },
                title: "TypeScript Example",
                subject: "HTML to DOCX Conversion",
                creator: "TurboDocx",
                keywords: ["html", "docx", "typescript", "conversion"],
                description: "An example document created with html-to-docx and TypeScript",
                lastModifiedBy: "TypeScript Example",
                revision: 1,
                header: true,
                headerType: "default",
                footer: true,
                footerType: "default",
                pageNumber: true,
                table: {
                    row: {
                        cantSplit: true
                    },
                    borderOptions: {
                        size: 2,
                        color: "000000"
                    }
                }
            },
            footerHtml
        );
        
        await saveDocxFile(advancedDocResult, "advanced-example.docx", "Advanced");
        
        // RTL Direction test
        const rtlTestResult = await HTMLtoDOCX(
            `<h1>Direction Test</h1><p>This tests the direction property in TypeScript.</p>`,
            null,
            {
                direction: "rtl",
                lang: "ar-SA",
                title: "RTL Direction Test",
                creator: "TypeScript RTL Test"
            }
        );
        
        await saveDocxFile(rtlTestResult, "typescript-rtl-test.docx", "RTL Test");
        
    } catch (error) {
        console.error("Error generating documents:", error);
    }
}

generateDocuments(); 