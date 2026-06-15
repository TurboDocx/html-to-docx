"use client";

import { useState } from "react";

import { EXAMPLES } from "./examples";

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export default function DocxGenerator() {
  const [activeId, setActiveId] = useState(EXAMPLES[0].id);
  const [html, setHtml] = useState(EXAMPLES[0].html);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const active = EXAMPLES.find((e) => e.id === activeId) ?? EXAMPLES[0];

  // Switching tabs loads that example's markup into the editable textarea.
  function selectExample(id: string) {
    const example = EXAMPLES.find((e) => e.id === id);
    if (!example) return;
    setActiveId(example.id);
    setHtml(example.html);
    setError(null);
  }

  async function handleGenerate() {
    setBusy(true);
    setError(null);
    try {
      // Import on demand so the library (and its polyfills) are code-split
      // into a separate chunk and never evaluated during server rendering.
      const { default: HTMLtoDOCX } = await import("@turbodocx/html-to-docx");

      // In the browser the library resolves to a Blob; coerce defensively
      // so this also works if a build ever returns an ArrayBuffer/Buffer.
      const result = await HTMLtoDOCX(html, undefined, { title: active.title });
      const blob =
        result instanceof Blob
          ? result
          : new Blob([result as BlobPart], { type: DOCX_MIME });

      downloadBlob(blob, active.filename);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card">
      <div className="tabs" role="tablist" aria-label="Example">
        {EXAMPLES.map((example) => (
          <button
            key={example.id}
            role="tab"
            type="button"
            aria-selected={example.id === activeId}
            className={`tab${example.id === activeId ? " active" : ""}`}
            onClick={() => selectExample(example.id)}
          >
            {example.label}
          </button>
        ))}
      </div>

      <label htmlFor="html-input">HTML source</label>
      <textarea
        id="html-input"
        value={html}
        onChange={(e) => setHtml(e.target.value)}
        rows={16}
        spellCheck={false}
      />
      <button onClick={handleGenerate} disabled={busy}>
        {busy ? "Generating…" : `Generate & download ${active.filename}`}
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
