"use client";

import { useState } from "react";

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const DEFAULT_HTML = `<h1>Hello from the browser</h1>
<p>This <strong>.docx</strong> was generated entirely client-side with
<code>@turbodocx/html-to-docx</code> &mdash; no server round-trip.</p>
<ul>
  <li>Pure JavaScript, no headless browser or binaries</li>
  <li>Returns a <code>Blob</code> in the browser</li>
  <li>Downloaded with <code>URL.createObjectURL</code></li>
</ul>`;

export default function DocxGenerator() {
  const [html, setHtml] = useState(DEFAULT_HTML);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setBusy(true);
    setError(null);
    try {
      // Import on demand so the library (and its polyfills) are code-split
      // into a separate chunk and never evaluated during server rendering.
      const { default: HTMLtoDOCX } = await import("@turbodocx/html-to-docx");

      // In the browser the library resolves to a Blob; coerce defensively
      // so this also works if a build ever returns an ArrayBuffer/Buffer.
      const result = await HTMLtoDOCX(html, undefined, {
        title: "TurboDocx Next.js Example",
      });
      const blob =
        result instanceof Blob
          ? result
          : new Blob([result as BlobPart], { type: DOCX_MIME });

      downloadBlob(blob, "document.docx");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card">
      <label htmlFor="html-input">HTML source</label>
      <textarea
        id="html-input"
        value={html}
        onChange={(e) => setHtml(e.target.value)}
        rows={10}
        spellCheck={false}
      />
      <button onClick={handleGenerate} disabled={busy}>
        {busy ? "Generating…" : "Generate & download .docx"}
      </button>
      {error && <p className="error">Error: {error}</p>}
    </section>
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke on the next tick so the browser has started the download first.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
