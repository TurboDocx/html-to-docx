import HTMLtoDOCX from "@turbodocx/html-to-docx";
import * as fs from "fs";
import * as path from "path";

/**
 * RTL (Right-to-Left) Language Support Example
 * Demonstrates Arabic and Hebrew text rendering with proper RTL direction
 */

const arabicHtmlString = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8" />
        <title>مثال باللغة العربية</title>
    </head>
    <body>
        <h1>مرحبا بالعالم</h1>
        <p>هذا نص تجريبي باللغة العربية ليظهر من اليمين إلى اليسار. يدعم هذا المثال النصوص العربية والعبرية.</p>
        
        <h2>قائمة مرقمة</h2>
        <ol>
            <li>العنصر الأول</li>
            <li>العنصر الثاني</li>
            <li>العنصر الثالث</li>
        </ol>
        
        <h2>قائمة نقطية</h2>
        <ul>
            <li>نقطة أولى</li>
            <li>نقطة ثانية</li>
            <li>نقطة ثالثة</li>
        </ul>
        
        <table border="1">
            <tr>
                <th>الاسم</th>
                <th>العمر</th>
                <th>المدينة</th>
            </tr>
            <tr>
                <td>أحمد</td>
                <td>25</td>
                <td>الرياض</td>
            </tr>
            <tr>
                <td>فاطمة</td>
                <td>30</td>
                <td>دبي</td>
            </tr>
        </table>
    </body>
</html>`;

const hebrewHtmlString = `<!DOCTYPE html>
<html lang="he" dir="rtl">
    <head>
        <meta charset="UTF-8" />
        <title>דוגמה בעברית</title>
    </head>
    <body>
        <h1>שלום עולם</h1>
        <p>זהו טקסט לדוגמה בעברית המוצג מימין לשמאל. דוגמה זו תומכת בטקסט עברי וערבי.</p>
        
        <h2>רשימה ממוספרת</h2>
        <ol>
            <li>פריט ראשון</li>
            <li>פריט שני</li>
            <li>פריט שלישי</li>
        </ol>
        
        <table border="1">
            <tr>
                <th>שם</th>
                <th>גיל</th>
                <th>עיר</th>
            </tr>
            <tr>
                <td>דוד</td>
                <td>28</td>
                <td>תל אביב</td>
            </tr>
        </table>
    </body>
</html>`;

const mixedContentHtml = `<!DOCTYPE html>
<html>
    <head>
        <meta charset="UTF-8" />
        <title>Mixed Content Example</title>
    </head>
    <body>
        <h1>Mixed Language Document</h1>
        <p>This document contains both LTR and RTL content.</p>
        
        <div dir="rtl">
            <h2>النص العربي</h2>
            <p>هذا نص باللغة العربية في وثيقة مختلطة.</p>
        </div>
        
        <div dir="ltr">
            <h2>English Text</h2>
            <p>This is English text in a mixed document.</p>
        </div>
        
        <div dir="rtl">
            <h2>טקסט עברי</h2>
            <p>זהו טקסט עברי במסמך מעורב.</p>
        </div>
    </body>
</html>`;

async function saveDocxFile(docResult: Buffer | ArrayBuffer | Blob, fileName: string, docType: string) {
    let docData: Buffer;
    if (docResult instanceof Buffer) {
        docData = docResult;
    } else if (docResult instanceof ArrayBuffer) {
        docData = Buffer.from(docResult);
    } else if (typeof Blob !== 'undefined' && docResult instanceof Blob) {
        console.log(`Received Blob for ${docType}, converting to ArrayBuffer then Buffer...`);
        const arrayBuffer = await docResult.arrayBuffer();
        docData = Buffer.from(arrayBuffer);
    } else {
        console.error(`Unexpected result type for ${docType}:`, typeof docResult);
        return;
    }
    
    // Save to root directory as requested
    const rootPath = path.join(__dirname, '../../', fileName);
    fs.writeFileSync(rootPath, docData);
    console.log(`${docType} RTL document created: ${fileName}`);
}

async function generateRTLDocuments() {
    try {
        // Arabic RTL document
        const arabicDoc = await HTMLtoDOCX(
            arabicHtmlString,
            null,
            {
                direction: "rtl",
                lang: "ar-SA",
                font: "Arial",
                title: "Arabic RTL Example",
                creator: "TurboDocx RTL Test"
            }
        );
        await saveDocxFile(arabicDoc, "arabic-rtl-test.docx", "Arabic RTL");

        // Hebrew RTL document
        const hebrewDoc = await HTMLtoDOCX(
            hebrewHtmlString,
            null,
            {
                direction: "rtl",
                lang: "he-IL",
                font: "Arial",
                title: "Hebrew RTL Example",
                creator: "TurboDocx RTL Test"
            }
        );
        await saveDocxFile(hebrewDoc, "hebrew-rtl-test.docx", "Hebrew RTL");

        // Mixed content document (default LTR with RTL sections)
        const mixedDoc = await HTMLtoDOCX(
            mixedContentHtml,
            null,
            {
                direction: "ltr", // Default direction
                lang: "en-US",
                font: "Arial",
                title: "Mixed Content Example",
                creator: "TurboDocx RTL Test"
            }
        );
        await saveDocxFile(mixedDoc, "mixed-content-test.docx", "Mixed Content");

        // LTR document for comparison
        const ltrDoc = await HTMLtoDOCX(
            `<h1>Left-to-Right Document</h1><p>This is a standard LTR document for comparison.</p>`,
            null,
            {
                direction: "ltr",
                lang: "en-US",
                font: "Arial",
                title: "LTR Example",
                creator: "TurboDocx RTL Test"
            }
        );
        await saveDocxFile(ltrDoc, "ltr-comparison-test.docx", "LTR Comparison");

    } catch (error) {
        console.error("Error generating RTL documents:", error);
    }
}

generateRTLDocuments();