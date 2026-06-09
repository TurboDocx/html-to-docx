# Next.js example — `@turbodocx/html-to-docx`

A minimal [Next.js](https://nextjs.org) (App Router, TypeScript) app that turns HTML
into a downloadable Word `.docx` **entirely in the browser** — no API route, no
server round-trip. The whole integration is one client component and an `import`.

> Looking for Node.js / server usage? See the other files in [`../`](../) and the
> root [README](../../README.md). A server-side (Route Handler) variant is shown
> at the bottom of this file.

## Run it

This example is wired to the **local** copy of the library via
`"@turbodocx/html-to-docx": "file:../.."`, so it always reflects the source in
this repo. The published artifacts (`dist/`) are git-ignored and built on demand,
so build the library once at the repo root first:

```bash
# from the repository root
npm install
npm run build      # produces dist/ that file:../.. links against
```

Then run the example:

```bash
cd example/nextjs-example
npm install
npm run dev        # http://localhost:3000
```

In **your own** app you skip all of that — just install from npm:

```bash
npm install @turbodocx/html-to-docx
```

## How it works

`app/DocxGenerator.tsx` is a Client Component (`"use client"`). On click it
generates the document and triggers a download:

```tsx
"use client";

async function handleGenerate(html: string) {
  // Imported on click so the library is code-split into its own chunk and is
  // never evaluated during server rendering.
  const { default: HTMLtoDOCX } = await import("@turbodocx/html-to-docx");

  // In the browser the library returns a Blob.
  const blob = await HTMLtoDOCX(html, undefined, { title: "My Document" });

  const url = URL.createObjectURL(blob as Blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "document.docx";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
```

That's the whole integration — a plain `import`, no bundler config. Two things
make it work cleanly in Next.js:

1. **Client-side only.** The library returns a `Blob` in the browser and a
   `Buffer` in Node. Generating in a Client Component on a user action keeps you
   on the `Blob` path and away from server rendering.
2. **The package ships a browser build.** Its `exports` map has a `browser`
   condition that resolves bundlers (Next.js/Turbopack, Vite, webpack) to a
   self-contained ESM build with Node polyfills already bundled in. So a default
   `import` just works — no aliases, no `Buffer`/`process` polyfills,
   no `next.config` changes.

### Simpler still: a top-level import

If you don't need code-splitting, a plain top-level import in a Client Component
works too — the library has no top-level browser-only side effects, so it is safe
to import even while the component is prerendered on the server:

```tsx
"use client";
import HTMLtoDOCX from "@turbodocx/html-to-docx";
// ...call HTMLtoDOCX(html, ...) in your click handler
```

The on-demand `import()` above is preferred only because it keeps the library out
of your first-load JS. Use whichever fits your app.

### Remote images

The basic HTML → DOCX path needs nothing extra. Remote images (referenced by URL)
are fetched at generation time, so the image host must allow cross-origin
requests (CORS) — or pre-convert images to base64 data URLs, or generate
server-side (below). SVG-to-PNG rasterization (`sharp`) is Node-only; in the
browser, SVGs are embedded natively (Word 2019+).

## Other bundlers (Vite, webpack, SvelteKit, Astro…)

The same `browser` export condition means these work with a plain `import` too —
no special configuration. (Older versions of this package, before the browser
ESM build was added, needed a manual alias + `vite-plugin-node-polyfills` under
Vite; see [#203](https://github.com/TurboDocx/html-to-docx/issues/203). That
workaround is no longer required.)

## Server-side variant (optional)

To generate on the server instead (smaller client bundle, `sharp`/SVG
rasterization available, returns a `Buffer`), use a Route Handler:

```ts
// app/api/docx/route.ts
import HTMLtoDOCX from "@turbodocx/html-to-docx";

export async function POST(req: Request) {
  const { html } = await req.json();
  const buffer = (await HTMLtoDOCX(html, undefined, {})) as Buffer;
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": 'attachment; filename="document.docx"',
    },
  });
}
```

The client then `fetch`es `/api/docx` and downloads the response blob.
