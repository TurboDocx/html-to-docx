/* eslint-disable no-console */
const fs = require('fs');
const HTMLtoDOCX = require('../dist/html-to-docx.umd');

async function testTestHTML() {
  console.log('🚀 Testing with test.html file...\n');

  try {
    // Read the test.html file
    const htmlContent = fs.readFileSync('../test.html', 'utf-8');

    console.log('📄 Generating document from test.html...');
    const docx = await HTMLtoDOCX(htmlContent, null, {
      orientation: 'portrait',
      title: 'Risk Assessment Test',
      creator: '@turbodocx/html-to-docx',
      imageProcessing: {
        svgHandling: 'native', // Use native SVG since Sharp isn't installed
        verboseLogging: true,
      },
    });

    fs.writeFileSync('./test-html-output.docx', docx);
    console.log('✅ Created: test-html-output.docx');
    console.log('   → Document generated from test.html with inline SVG support\n');

    console.log('✨ Success! Open test-html-output.docx to view the result.');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testTestHTML();
