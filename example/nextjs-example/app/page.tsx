import DocxGenerator from "./DocxGenerator";

export default function Home() {
  return (
    <main>
      <h1>@turbodocx/html-to-docx + Next.js</h1>
      <p>
        Type some HTML, click the button, and a Word document is generated{" "}
        <strong>in your browser</strong> and downloaded. No API route, no server.
      </p>
      <DocxGenerator />
      <p className="hint">
        See the <code>README.md</code> in this folder for how it works and for a
        server-side (Route Handler) variant.
      </p>
    </main>
  );
}
