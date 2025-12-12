/* eslint-disable no-console */
const fs = require('fs');
const HTMLtoDOCX = require('../dist/html-to-docx.umd');

async function testVariousSVGs() {
  console.log('🔬 Testing various SVG scenarios with verbose logging...\n');

  // Test 1: Simple SVG with xmlns
  const test1 = `
    <h3>Test 1: Simple SVG with xmlns</h3>
    <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <circle cx="50" cy="50" r="40" fill="#3498db" />
    </svg>
  `;

  // Test 2: Simple SVG without xmlns (should be added automatically)
  const test2 = `
    <h3>Test 2: Simple SVG without xmlns</h3>
    <svg width="100" height="100">
      <circle cx="50" cy="50" r="40" fill="#e74c3c" />
    </svg>
  `;

  // Test 3: Complex nested SVG
  const test3 = `
    <h3>Test 3: Complex nested SVG</h3>
    <svg width="200" height="150" viewBox="0 0 200 150">
      <g class="group1">
        <rect x="10" y="10" width="80" height="60" fill="#2ecc71" />
        <g class="nested">
          <circle cx="150" cy="40" r="30" fill="#f39c12" />
        </g>
      </g>
      <line x1="10" y1="100" x2="190" y2="100" stroke="#34495e" stroke-width="3" />
    </svg>
  `;

  // Test 4: SVG with text elements
  const test4 = `
    <h3>Test 4: SVG with text</h3>
    <svg width="200" height="100" viewBox="0 0 200 100">
      <text x="100" y="50" text-anchor="middle" font-size="20" fill="#2c3e50">Hello SVG</text>
    </svg>
  `;

  // Test 5: Radar chart style SVG (like from test.html)
  const test5 = `
    <h3>Test 5: Radar chart style SVG</h3>
    <svg width="400" height="300" viewBox="0 0 400 300">
      <g tabindex="-1" id="layer1">
        <g class="polar-grid">
          <path stroke="#06233F" fill="none" d="M 200,150L 200,90L 250,120L 280,150L 250,180L 200,210L 150,180L 120,150Z"></path>
          <path stroke="#06233F" fill="#44C8F5" fill-opacity="0.6" stroke-width="2" d="M200,110L230,125L255,150L230,175L200,190L170,175L145,150L170,125L200,110Z"></path>
        </g>
      </g>
    </svg>
  `;

  const allTests = test1 + test2 + test3 + test4 + test5;

  try {
    console.log('📄 Generating comprehensive test document with verbose logging...\n');
    const docx = await HTMLtoDOCX(allTests, null, {
      orientation: 'portrait',
      title: 'SVG Test Suite',
      imageProcessing: {
        svgHandling: 'native',
        verboseLogging: true,
      },
    });

    fs.writeFileSync('./comprehensive-svg-test.docx', docx);
    console.log('\n✅ Created: comprehensive-svg-test.docx');
    console.log('   → Document with 5 different SVG test cases\n');

    console.log('✨ Success! Open the file to verify all SVGs render correctly.');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testVariousSVGs();
