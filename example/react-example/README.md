# React Example - @turbodocx/html-to-docx

Modern React example demonstrating how to use @turbodocx/html-to-docx in a browser environment with Vite.

## Features

- ⚡️ **Vite** - Fast development with instant HMR
- ⚛️ **React 19** - Latest React features
- 🎨 **Modern UI** - Clean, responsive design
- 📝 **Live Editor** - Edit HTML and generate DOCX in real-time
- 🚀 **No polyfills needed** - Works directly in modern browsers

## Quick Start

```bash
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

## Usage

The example demonstrates:

- Converting HTML to DOCX in the browser
- Using the file-saver library to download generated files
- Handling various HTML elements (headings, lists, tables, images, etc.)
- Styling with custom fonts and colors
- Configuring options like page numbers and table settings

## Code Example

```jsx
import HTMLtoDOCX from '@turbodocx/html-to-docx';
import { saveAs } from 'file-saver';

async function generateDocument() {
  const fileBuffer = await HTMLtoDOCX(html, null, {
    table: { row: { cantSplit: true } },
    footer: true,
    pageNumber: true,
  });

  saveAs(fileBuffer, 'document.docx');
}
```

## Build for Production

```bash
npm run build
npm run preview
```

## Learn More

- [@turbodocx/html-to-docx Documentation](https://www.turbodocx.com)
- [Vite Documentation](https://vite.dev)
- [React Documentation](https://react.dev)
