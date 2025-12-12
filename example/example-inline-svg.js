const fs = require('fs');
// Use the built version, or install via: npm install @turbodocx/html-to-docx
// const HTMLtoDOCX = require('@turbodocx/html-to-docx');
const HTMLtoDOCX = require('../dist/html-to-docx.umd');

// Simple HTML with inline SVG element
const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Inline SVG Test</title>
</head>
<body>
    <h1>Testing Inline SVG Elements</h1>

    <p>This document tests inline SVG elements (not img tags with SVG sources).</p>

    <h2>1. Simple Inline SVG Circle</h2>
    <p>A basic SVG shape:</p>
    <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="#3498db" />
    </svg>

    <h2>2. Inline SVG with Multiple Elements</h2>
    <p>A more complex SVG:</p>
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150">
        <rect x="10" y="10" width="80" height="60" fill="#e74c3c" />
        <circle cx="150" cy="40" r="30" fill="#2ecc71" />
        <line x1="10" y1="100" x2="190" y2="100" stroke="#34495e" stroke-width="3" />
    </svg>

    <h2>3. SVG from test.html</h2>
    <p>Testing with a radar chart SVG:</p>
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
        <g>
            <path stroke="#06233F" fill="none" d="M 200,150L 200,90L 250,120L 280,150L 250,180L 200,210L 150,180L 120,150Z"></path>
            <path stroke="#06233F" fill="#44C8F5" fill-opacity="0.6" stroke-width="2" d="M200,110L230,125L255,150L230,175L200,190L170,175L145,150L170,125L200,110Z"></path>
        </g>
    </svg>

    <p>End of inline SVG test document.</p>
</body>
</html>
`;

async function generateDocument() {
  console.log('🚀 Generating inline SVG example document...\n');

  try {
    // Test with SVG→PNG conversion (default, requires sharp)
    console.log('📄 Generating document with SVG→PNG conversion...');
    const docx = await HTMLtoDOCX(htmlContent, null, {
      orientation: 'portrait',
      title: 'Inline SVG Test',
      creator: '@turbodocx/html-to-docx',
      imageProcessing: {
        svgHandling: 'convert', // Convert SVG to PNG
        verboseLogging: true,
      },
    });

    fs.writeFileSync('./example-inline-svg-convert.docx', docx);
    console.log('✅ Created: example-inline-svg-convert.docx');
    console.log('   → Inline SVGs converted to PNG\n');

    // Test with native SVG support
    console.log('📄 Generating document with native SVG support...');
    const docxNative = await HTMLtoDOCX(htmlContent, null, {
      orientation: 'portrait',
      title: 'Inline SVG Test - Native',
      creator: '@turbodocx/html-to-docx',
      imageProcessing: {
        svgHandling: 'native', // Use native SVG
        verboseLogging: true,
      },
    });

    fs.writeFileSync('./example-inline-svg-native.docx', docxNative);
    console.log('✅ Created: example-inline-svg-native.docx');
    console.log('   → Inline SVGs embedded as native SVG\n');

    console.log('✨ Success! Open the generated .docx files to view inline SVGs.');
    console.log('\nNote:');
    console.log('- PNG conversion version works in all Word versions');
    console.log('- Native SVG version requires Office 2019+ or Microsoft 365');
  } catch (error) {
    console.error('❌ Error generating document:', error);
    process.exit(1);
  }
}

generateDocument();
