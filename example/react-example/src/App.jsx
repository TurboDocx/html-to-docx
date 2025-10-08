import { useState } from 'react';
import HTMLtoDOCX from '@turbodocx/html-to-docx';
import { saveAs } from 'file-saver';
import './App.css';

const sampleHTML = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Sample Document</title>
  </head>
  <body>
    <h1>@turbodocx/html-to-docx React Example</h1>

    <h2>Image Support</h2>
    <p>Base64 encoded image:</p>
    <img
      src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg=="
      alt="Red dot"
    />

    <h2>Text Formatting</h2>
    <p>
      <strong>Bold text</strong>,
      <em>italic text</em>,
      <u>underlined text</u>, and
      <span style="color: #E74C3C;">colored text</span>.
    </p>

    <h2>Lists</h2>
    <h3>Unordered List</h3>
    <ul>
      <li>First item</li>
      <li>Second item</li>
      <li>Third item</li>
    </ul>

    <h3>Ordered List</h3>
    <ol>
      <li>Step one</li>
      <li>Step two</li>
      <li>Step three</li>
    </ol>

    <h2>Tables</h2>
    <table border="1" style="border-collapse: collapse;">
      <thead>
        <tr>
          <th>Header 1</th>
          <th>Header 2</th>
          <th>Header 3</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Row 1, Cell 1</td>
          <td>Row 1, Cell 2</td>
          <td>Row 1, Cell 3</td>
        </tr>
        <tr>
          <td>Row 2, Cell 1</td>
          <td>Row 2, Cell 2</td>
          <td>Row 2, Cell 3</td>
        </tr>
      </tbody>
    </table>

    <h2>Blockquote</h2>
    <blockquote>
      This is a blockquote demonstrating quoted text styling in the generated document.
    </blockquote>

    <h2>Custom Fonts</h2>
    <p style="font-family: 'Courier New', Courier, monospace;">Monospace font example</p>
    <p style="font-family: Georgia, serif;">Serif font example</p>

    <h2>Paragraphs with Indentation</h2>
    <p style="margin-left: 40px;">
      <strong>Left indented:</strong> Lorem ipsum dolor sit amet, consectetur adipiscing elit.
    </p>
    <p style="margin-right: 40px;">
      <strong>Right indented:</strong> Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
    </p>
  </body>
</html>`;

function App() {
  const [html, setHtml] = useState(sampleHTML);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateDocx = async () => {
    setIsGenerating(true);
    try {
      const fileBuffer = await HTMLtoDOCX(html, null, {
        table: { row: { cantSplit: true } },
        footer: true,
        pageNumber: true,
      });

      saveAs(fileBuffer, 'sample-document.docx');
    } catch (error) {
      console.error('Error generating DOCX:', error);
      alert('Failed to generate DOCX file. Check console for details.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="app">
      <div className="container">
        <header>
          <h1>@turbodocx/html-to-docx</h1>
          <p>Modern React Example with Vite</p>
        </header>

        <div className="content">
          <div className="editor-section">
            <h2>HTML Input</h2>
            <textarea
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              spellCheck="false"
            />
          </div>

          <div className="actions">
            <button
              onClick={handleGenerateDocx}
              disabled={isGenerating}
              className="generate-btn"
            >
              {isGenerating ? 'Generating...' : 'Generate DOCX'}
            </button>
          </div>

          <div className="info">
            <h3>Features Demonstrated:</h3>
            <ul>
              <li>Headers (H1-H6)</li>
              <li>Text formatting (bold, italic, underline, colors)</li>
              <li>Images (base64 encoded)</li>
              <li>Lists (ordered and unordered)</li>
              <li>Tables with borders</li>
              <li>Blockquotes</li>
              <li>Custom fonts</li>
              <li>Paragraph indentation</li>
            </ul>
          </div>
        </div>

        <footer>
          <p>
            Learn more at{' '}
            <a href="https://www.turbodocx.com" target="_blank" rel="noopener noreferrer">
              turbodocx.com
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
