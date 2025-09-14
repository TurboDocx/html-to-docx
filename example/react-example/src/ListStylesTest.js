import React from 'react';
import { saveAs } from 'file-saver';
import HTMLtoDOCX from 'html-to-docx';

const ListStylesTest = () => {
  const generateListStylesDocument = async () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
          <title>List Edge Cases Test</title>
      </head>
      <body>
          <h1>List Style Inheritance Edge Cases</h1>
          
          <!-- Test 1: Conflicting Styles -->
          <h2>Test 1: Conflicting Styles</h2>
          <ul style="color: red; font-size: 16px;">
              <li style="color: blue;">Should be BLUE (child overrides parent)</li>
              <li>Should be RED (inherits from parent)</li>
              <li style="font-size: 20px;">Should be RED but LARGER</li>
          </ul>
          
          <!-- Test 2: Triple Nested Lists -->
          <h2>Test 2: Triple Nested Lists</h2>
          <ul style="color: red; font-family: Arial;">
              <li>Level 1 - Red Arial
                  <ol style="color: green; font-size: 18px;">
                      <li>Level 2 - Green Arial 18px
                          <ul style="color: blue; font-family: Times;">
                              <li>Level 3 - Blue Times 18px</li>
                              <li style="color: purple;">Level 3 - Purple Times 18px</li>
                          </ul>
                      </li>
                      <li>Level 2 - Green Arial 18px</li>
                  </ol>
              </li>
              <li>Level 1 - Red Arial</li>
          </ul>
          
          <!-- Test 3: Complex Style Combinations -->
          <h2>Test 3: Complex Style Combinations</h2>
          <ol style="background-color: lightgray; padding: 10px; margin: 20px; font-weight: bold;">
              <li style="text-decoration: underline;">Bold + Underline + Gray Background</li>
              <li style="text-align: center; font-style: italic;">Bold + Italic + Center + Gray Background</li>
              <li>
                  <ul style="background-color: lightyellow; font-weight: normal;">
                      <li>Normal weight + Yellow background (should override gray)</li>
                      <li style="color: red; text-decoration: line-through;">Red + Strikethrough + Yellow</li>
                  </ul>
              </li>
          </ol>
          
          <!-- Test 4: Empty and Single Item Lists -->
          <h2>Test 4: Edge Cases</h2>
          <ul style="color: orange;">
              <li>Single item with inherited orange</li>
          </ul>
          
          <ol style="font-size: 24px;">
              <!-- Empty list - should not crash -->
          </ol>
          
          <!-- Test 5: Mixed Content -->
          <h2>Test 5: Mixed Content in List Items</h2>
          <ul style="color: navy; font-family: Courier;">
              <li>Plain text in navy Courier</li>
              <li><strong>Bold text</strong> in navy Courier</li>
              <li><em>Italic text</em> in navy Courier</li>
              <li><span style="color: red;">Span with red color</span> - red should override navy</li>
              <li>Text with <a href="#" style="color: green;">green link</a> in navy Courier</li>
          </ul>
      </body>
      </html>
    `;

    try {
      const docxBuffer = await HTMLtoDOCX(htmlContent, null, {
        orientation: 'portrait',
        margins: { top: 720, right: 720, bottom: 720, left: 720 },
        title: 'List Edge Cases Test',
      });

      const blob = new Blob([docxBuffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      saveAs(blob, 'list-styles-test.docx');
      
      console.log('✅ List styles test completed: list-styles-test.docx');
    } catch (error) {
      console.error('❌ Error in list styles test:', error);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>List Styles Test</h2>
      <p>Test list style inheritance edge cases including conflicting styles, nested lists, and mixed content.</p>
      <button 
        onClick={generateListStylesDocument}
        style={{
          padding: '10px 20px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Generate List Styles Test Document
      </button>
    </div>
  );
};

export default ListStylesTest;