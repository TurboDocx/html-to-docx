/* eslint-disable no-console */
const fs = require('fs');
// FIXME: Incase you have the npm package
// const HTMLtoDOCX = require('@turbodocx/html-to-docx');
const HTMLtoDOCX = require('../dist/html-to-docx.umd');

const filePath = './example-css-stylesheet.docx';

// The HTML carries NO inline styles of its own (except one, to show that inline
// styles always win). All of the look-and-feel comes from the stylesheet below.
const htmlString = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>CSS Stylesheet Example</title>
  <!-- Embedded <style> tags are honored too and are stripped from the output -->
  <style>
    .callout { color: #b30000; }
  </style>
</head>
<body>
  <h1 class="title">Quarterly Business Review</h1>
  <h2 id="subtitle">Q2 2026 — Confidential</h2>

  <p class="lead">This summary is styled entirely from an attached stylesheet.</p>

  <p>Regular body paragraph. Type selectors style every paragraph at once.</p>

  <p class="callout">Callout text colored by an embedded &lt;style&gt; tag.</p>

  <p class="lead" style="color: #006600;">
    This paragraph is <code>.lead</code> (blue) but has an inline green color —
    inline always wins, so it renders green.
  </p>

  <blockquote class="quote">
    "Selectors, specificity, and the cascade all work as you would expect."
  </blockquote>

  <table class="data">
    <tr><th>Region</th><th>Revenue</th></tr>
    <tr><td>North</td><td>$1.2M</td></tr>
    <tr><td>South</td><td>$0.9M</td></tr>
  </table>
</body>
</html>`;

// A normal CSS stylesheet: type, class, id, descendant and grouped selectors.
const css = `
  h1, h2 {
    text-align: center;
    font-family: 'Georgia';
  }
  .title {
    color: #1a3c7a;
    font-size: 28pt;
  }
  #subtitle {
    color: #888888;
    font-size: 14pt;
  }
  p {
    color: #222222;
    font-size: 12pt;
  }
  .lead {
    color: #1a73e8;
    font-size: 14pt;
  }
  blockquote.quote {
    color: #555555;
    text-align: center;
  }
  table.data {
    border-collapse: collapse;
  }
  table.data th {
    background-color: #1a3c7a;
    color: #ffffff;
    text-align: center;
  }
  table.data td {
    text-align: center;
  }
`;

(async () => {
  const fileBuffer = await HTMLtoDOCX(htmlString, null, {
    css,
    table: { row: { cantSplit: true } },
    // deterministicIds is ONLY for CI/CD testing. Do NOT use in production.
    deterministicIds: process.env.DETERMINISTIC_IDS === 'true',
  });

  fs.writeFile(filePath, fileBuffer, (error) => {
    if (error) {
      console.log('Docx file creation failed');
      return;
    }
    console.log('Docx file created successfully');
  });
})();
