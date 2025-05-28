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

async function generateDocuments() {
    try {
        // Basic example
        const basicDocResult = await HTMLtoDOCX(htmlString);
        let basicDocData: Buffer | Uint8Array;
        if (basicDocResult instanceof Buffer) {
            basicDocData = basicDocResult;
        } else if (basicDocResult instanceof ArrayBuffer) {
            basicDocData = Buffer.from(basicDocResult);
        } else if (typeof Blob !== 'undefined' && basicDocResult instanceof Blob) {
            console.log("Received Blob for basicDocResult, converting to ArrayBuffer then Buffer...");
            const arrayBuffer = await basicDocResult.arrayBuffer();
            basicDocData = Buffer.from(arrayBuffer);
        } else {
            console.error("Unexpected result type for basicDocResult:", typeof basicDocResult);
            console.log("basicDocResult constructor name:", basicDocResult?.constructor?.name);
            return;
        }
        fs.writeFileSync(path.join(__dirname, "basic-example.docx"), basicDocData);
        console.log("Basic document created: basic-example.docx");

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
        
        let advancedDocData: Buffer | Uint8Array;
        if (advancedDocResult instanceof Buffer) {
            advancedDocData = advancedDocResult;
        } else if (advancedDocResult instanceof ArrayBuffer) {
            advancedDocData = Buffer.from(advancedDocResult);
        } else if (typeof Blob !== 'undefined' && advancedDocResult instanceof Blob) {
            console.log("Received Blob for advancedDocResult, converting to ArrayBuffer then Buffer...");
            const arrayBuffer = await advancedDocResult.arrayBuffer();
            advancedDocData = Buffer.from(arrayBuffer);
        } else {
            console.error("Unexpected result type for advancedDocResult:", typeof advancedDocResult);
            console.log("advancedDocResult constructor name:", advancedDocResult?.constructor?.name);
            return;
        }
        fs.writeFileSync(path.join(__dirname, "advanced-example.docx"), advancedDocData);
        console.log("Advanced document created: advanced-example.docx");
        
    } catch (error) {
        console.error("Error generating documents:", error);
    }
}

generateDocuments(); 