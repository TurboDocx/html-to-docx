/* eslint-disable no-console */
const HTMLtoDOCX = require('./dist/html-to-docx.umd');

// Simple test to understand the image processing flow
const htmlString = `
<html>
<body>
  <p>Single image test:</p>
  <img src="https://upload.wikimedia.org/wikipedia/commons/e/ee/Porsche_992_Turbo_S_1X7A0413.jpg" alt="Test image" width="200">
</body>
</html>`;

async function debugTest() {
  console.log('Testing with verbose logging enabled...');
  
  const buffer = await HTMLtoDOCX(htmlString, null, {
    imageProcessing: {
      maxRetries: 1,
      verboseLogging: true
    }
  });
  
  console.log('Document created successfully, size:', buffer.length);
}

debugTest().catch(console.error);