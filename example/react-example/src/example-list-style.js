import React from 'react';

const ListStyleExample = () => {
  const htmlString = `<!DOCTYPE html>
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
    
    <!-- Test 4: Edge Cases -->
    <h2>Test 4: Edge Cases</h2>
    <ul style="color: orange;">
        <li>Single item with inherited orange</li>
    </ul>
    
    <ol style="font-size: 24px;">
        <!-- Empty list - should not crash -->
    </ol>
    
    <!-- Test 5: Mixed Content in List Items -->
    <h2>Test 5: Mixed Content in List Items</h2>
    <ul style="color: navy; font-family: Courier;">
        <li>Plain text in navy Courier</li>
        <li><strong>Bold text</strong> in navy Courier</li>
        <li><em>Italic text</em> in navy Courier</li>
        <li><span style="color: red;">Span with red color</span> - red should override navy</li>
        <li>Text with <a href="#" style="color: green;">green link</a> in navy Courier</li>
    </ul>
</body>
</html>`;

  const handleDownload = async () => {
    try {
      // Note: This would require the html-to-docx library to be properly imported
      // For demonstration purposes, showing the structure
      console.log('HTML content ready for conversion:', htmlString);
      
      // TODO: Integrate with html-to-docx library for actual DOCX generation
      
      alert('HTML content logged to console. Integrate with html-to-docx library for actual conversion.');
    } catch (error) {
      console.error('Error generating document:', error);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>List Style Inheritance Test</h1>
      <p>This example demonstrates various edge cases for list style inheritance in HTML to DOCX conversion.</p>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Test Cases Included:</h2>
        <ul>
          <li><strong>Conflicting Styles:</strong> Child elements overriding parent styles</li>
          <li><strong>Triple Nested Lists:</strong> Deep nesting with different style properties</li>
          <li><strong>Complex Style Combinations:</strong> Multiple CSS properties on lists</li>
          <li><strong>Edge Cases:</strong> Empty lists and single items</li>
          <li><strong>Mixed Content:</strong> Various HTML elements within list items</li>
        </ul>
      </div>
      
      <button 
        onClick={handleDownload}
        style={{
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        Generate DOCX (Console Log)
      </button>
      
      <div style={{ marginTop: '30px', border: '1px solid #ccc', padding: '15px', backgroundColor: '#f9f9f9' }}>
        <h3>HTML Preview:</h3>
        <div dangerouslySetInnerHTML={{ __html: htmlString }} />
      </div>
    </div>
  );
};

export default ListStyleExample;