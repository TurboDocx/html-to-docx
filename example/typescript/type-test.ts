/**
 * This file demonstrates TypeScript type checking
 * It's not meant to be executed, but rather to test type definitions
 */

import HTMLtoDOCX from "@turbodocx/html-to-docx";

const htmlString = `<!DOCTYPE html>
    <html lang="en">
        <head>
            <meta charset="UTF-8" />
            <title>Document</title>
        </head>
        <body>
            <h1>Hello world</h1>
        </body>
    </html>`;

// $ExpectType Promise<Blob> | Promise<ArrayBuffer>
const doc1 = HTMLtoDOCX(htmlString);

// $ExpectType Promise<Blob> | Promise<ArrayBuffer>
const doc2 = HTMLtoDOCX(htmlString, "<p>Header</p>");

// $ExpectType Promise<Blob> | Promise<ArrayBuffer>
const doc3 = HTMLtoDOCX(htmlString, null, {
    orientation: "landscape",
    table: {
        row: {
            cantSplit: true,
        },
    },
});

// $ExpectType Promise<Blob> | Promise<ArrayBuffer>
const doc4 = HTMLtoDOCX(
    htmlString,
    null,
    {
        orientation: "landscape",
        table: {
            row: {
                cantSplit: true,
            },
        },
    },
    "<p>Footer</p>",
);

// @ts-expect-error - This should show a TypeScript error because parameters are in wrong order
const doc5 = HTMLtoDOCX(htmlString, {
    orientation: "landscape",
    table: {
        row: {
            cantSplit: true,
        },
    },
});

const doc6 = HTMLtoDOCX(htmlString, null, {
    // @ts-expect-error - This should show a TypeScript error because orientation has invalid value
    orientation: "invalid",
});

const doc7 = HTMLtoDOCX(htmlString, null, {
    // @ts-expect-error - This should show a TypeScript error because headerType has invalid value
    headerType: "invalid",
}); 