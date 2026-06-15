// Example HTML documents rendered by <DocxGenerator />.
// Kept out of the component so the (large, inline-image) markup stays readable.

export interface DocxExample {
  id: string;
  label: string;
  title: string; // document `title` metadata passed to HTMLtoDOCX
  filename: string; // download filename
  html: string;
}

// A small gradient PNG embedded as a base64 data URL. Inlining the image keeps
// the example self-contained — no network request, no CORS. (Remote <img src>
// URLs work too, but the host must allow cross-origin requests; see the README.)
const LOGO_DATA_URL = "data:image/png;base64,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";

// 1. Simple — the original one-paragraph demo.
export const SIMPLE_HTML = `<h1>Hello from the browser</h1>
<p>This <strong>.docx</strong> was generated entirely client-side with
<code>@turbodocx/html-to-docx</code> &mdash; no server round-trip.</p>
<ul>
  <li>Pure JavaScript, no headless browser or binaries</li>
  <li>Returns a <code>Blob</code> in the browser</li>
  <li>Downloaded with <code>URL.createObjectURL</code></li>
</ul>`;

// 2. Complex — exercises nested elements, tables, an embedded image, code
//    blocks, and the full inline-formatting pipeline.
export const COMPLEX_HTML = `<h1>Complex document showcase</h1>
<p>
  This document exercises the <strong>full</strong> <em>inline</em> and
  <u>block</u> formatting pipeline: <s>strikethrough</s>, <code>inline code</code>,
  custom colors, font sizes and families, hyperlinks, nested lists, tables, and an
  embedded image &mdash; all rendered
  <strong><em><u>client-side</u></em></strong> in the browser.
</p>

<h2>1. Inline formatting</h2>
<p>
  Combine <strong>bold</strong>, <em>italic</em>, <u>underline</u>, and
  <s>strikethrough</s>, or <strong><em><u>stack them together</u></em></strong>.
  Inline <code>monospace</code> works too, alongside
  <a href="https://github.com/TurboDocx/html-to-docx">hyperlinks</a>,
  super<sup>script</sup>, and sub<sub>script</sub>.
</p>

<h2>2. Color, size &amp; font</h2>
<p>
  Inline styles control <span style="color: #4f46e5;">text color</span>,
  <span style="font-size: 22px;">font size</span>, and
  <span style="font-family: 'Courier New', monospace;">font family</span>
  &mdash; independently or all at once.
</p>
<p style="font-family: Georgia, serif; font-size: 18px; color: #1d4ed8;">
  This entire paragraph is <strong>Georgia, 18px, blue</strong> via a style on the
  <code>&lt;p&gt;</code> itself.
</p>
<p>
  <span style="font-size: 26px; color: #16a34a;">Big&nbsp;green</span>,
  <span style="font-size: 10px; color: #6b7280;">small grey</span>, and
  <span style="background-color: #fef08a; color: #92400e;">highlighted</span>
  text share a single line.
</p>
<p>
  Everything combined:
  <span style="font-family: 'Times New Roman', serif; font-size: 16px; color: #b45309;"><strong><em>serif bold italic in amber</em></strong></span>.
</p>

<h2>3. Nested lists</h2>
<ol>
  <li>First top-level item
    <ul>
      <li>Nested bullet with <strong>bold</strong> text</li>
      <li>Nested bullet with <code>code</code>
        <ul>
          <li>Even <em>deeper</em> nesting</li>
        </ul>
      </li>
    </ul>
  </li>
  <li>Second item with <em>emphasis</em></li>
  <li>Third item</li>
</ol>

<h2>4. Table</h2>
<table border="1" style="border-collapse: collapse; width: 100%;">
  <thead>
    <tr>
      <th>Feature</th>
      <th>Browser</th>
      <th>Node.js</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Returns</td>
      <td><code>Blob</code></td>
      <td><code>Buffer</code></td>
    </tr>
    <tr>
      <td>SVG &rarr; PNG (<code>sharp</code>)</td>
      <td><s>Not available</s></td>
      <td><strong>Available</strong></td>
    </tr>
    <tr>
      <td>Setup</td>
      <td><em>Zero config</em></td>
      <td><em>Zero config</em></td>
    </tr>
  </tbody>
</table>

<h2>5. Embedded image</h2>
<p>A base64-encoded PNG embedded inline (no network request needed):</p>
<p><img src="${LOGO_DATA_URL}" alt="Gradient banner" width="240" height="96" /></p>

<h2>6. Code block</h2>
<pre><code>import HTMLtoDOCX from "@turbodocx/html-to-docx";

const blob = await HTMLtoDOCX(html, undefined, {
  title: "My Document",
});</code></pre>

<h2>7. Blockquote</h2>
<blockquote>
  <p>&ldquo;The whole integration is one client component and an <code>import</code>.&rdquo;</p>
</blockquote>

<hr />
<p style="text-align: center;"><em>Generated with @turbodocx/html-to-docx</em></p>`;

export const EXAMPLES: DocxExample[] = [
  {
    id: "simple",
    label: "Simple",
    title: "TurboDocx Next.js Example — Simple",
    filename: "simple.docx",
    html: SIMPLE_HTML,
  },
  {
    id: "complex",
    label: "Complex",
    title: "TurboDocx Next.js Example — Complex",
    filename: "complex.docx",
    html: COMPLEX_HTML,
  },
];
