/* eslint-disable no-console */
const HTMLtoDOCX = require('./dist/html-to-docx.umd');

// Test HTML with an image that might fail
const htmlString = `
<html>
<body>
  <h1>Configuration Test</h1>
  <p>Testing image retry and verbose logging:</p>
  <img src="https://upload.wikimedia.org/wikipedia/commons/e/ee/Porsche_992_Turbo_S_1X7A0413.jpg" alt="Test image" width="200">
  <img src="https://upload.wikimedia.org/wikipedia/commons/e/ee/Porsche_992_Turbo_S_1X7A0413.jpg" alt="Test image duplicate" width="100">
</body>
</html>`;

async function testDefaultConfig() {
  console.log('\n=== Testing with DEFAULT configuration (maxRetries: 2, verboseLogging: false) ===');
  const defaultBuffer = await HTMLtoDOCX(htmlString);
  console.log('Default config - Document created successfully, size:', defaultBuffer.length);
}

async function testVerboseConfig() {
  console.log('\n=== Testing with VERBOSE configuration (maxRetries: 3, verboseLogging: true) ===');
  const verboseBuffer = await HTMLtoDOCX(htmlString, null, {
    imageProcessing: {
      maxRetries: 3,
      verboseLogging: true
    }
  });
  console.log('Verbose config - Document created successfully, size:', verboseBuffer.length);
}

async function testMinimalRetryConfig() {
  console.log('\n=== Testing with MINIMAL RETRY configuration (maxRetries: 1, verboseLogging: false) ===');
  const minimalBuffer = await HTMLtoDOCX(htmlString, null, {
    imageProcessing: {
      maxRetries: 1,
      verboseLogging: false
    }
  });
  console.log('Minimal retry config - Document created successfully, size:', minimalBuffer.length);
}

async function runTests() {
  try {
    await testDefaultConfig();
    await testVerboseConfig();
    await testMinimalRetryConfig();
    console.log('\n=== All configuration tests completed successfully! ===');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

runTests();