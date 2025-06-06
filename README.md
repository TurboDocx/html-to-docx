[![TurboDocx](./banner.png)](https://www.turbodocx.com)

html-to-docx
============
[![NPM Version][npm-image]][npm-url]
[![Type Script](https://shields.io/badge/TypeScript-3178C6?logo=TypeScript&logoColor=FFF&style=flat-square)](https://typescript.org)
[![Discord](https://img.shields.io/badge/Discord-Join%20Us-7289DA?logo=discord)](https://discord.gg/NYKwz4BcpX)
[![npm](https://img.shields.io/npm/dw/@turbodocx/html-to-docx)](https://www.npmjs.com/package/@turbodocx/html-to-docx)
[![X](https://img.shields.io/badge/X-@TurboDocx-1DA1F2?logo=x&logoColor=white)](https://twitter.com/TurboDocx)
[![Embed TurboDocx in Your App in Minutes](https://img.shields.io/badge/Embed%20TurboDocx%20in%20Your%20App%20in%20Minutes-8A2BE2)](https://www.turbodocx.com/use-cases/embedded-api?utm_source=github&utm_medium=repo&utm_campaign=open_source)

`@turbodocx/html-to-docx` is a powerful JavaScript library designed to convert HTML documents to DOCX format, compatible with Microsoft Word 2007+, LibreOffice Writer, Google Docs, WPS Writer, and other word processors. Inspired by [@PrivateOmega]("https://github.com/privateOmega/"), this is supported by TurboDocx to ensure ongoing development and improvements.

### Disclaimer

While `@turbodocx/html-to-docx` is robust and used in production environments, it is continually evolving. Please ensure it meets your specific needs through thorough testing. Note that it currently does not work directly in the browser.

## Installation

Use the npm to install the project.

```bash
npm install @turbodocx/html-to-docx
```

### TypeScript Support

This package includes TypeScript typings. No additional installation is required to use it with TypeScript projects.

### TypeScript Example

```typescript
import HtmlToDocx from "@turbodocx/html-to-docx";

const htmlString = `<!DOCTYPE html>
    <html lang="en">
        <head>
            <meta charset="UTF-8" />
            <title>Document</title>
        </head>
        <body>
            <h1>Hello world</h1>
        </body>
    </html>`;

// Basic usage
async function basicExample() {
  const docx = await HtmlToDocx(htmlString);
  // docx is ArrayBuffer in Node.js or Blob in browser environments
}

// With header
async function withHeader() {
  const headerHtml = "<p>Document Header</p>";
  const docx = await HtmlToDocx(htmlString, headerHtml);
}

// With document options
async function withOptions() {
  const docx = await HtmlToDocx(htmlString, null, {
    orientation: "landscape",
    title: "TypeScript Example",
    creator: "TurboDocx",
    table: {
      row: {
        cantSplit: true,
      },
      borderOptions: {
        size: 1,
        color: "000000"
      }
    },
    pageNumber: true,
    footer: true
  });
}

// With all parameters
async function complete() {
  const headerHtml = "<p>Document Header</p>";
  const footerHtml = "<p>Page Footer</p>";
  
  const docx = await HtmlToDocx(
    htmlString,
    headerHtml,
    {
      orientation: "landscape",
      pageSize: {
        width: 12240,
        height: 15840
      },
      margins: {
        top: 1440,
        right: 1800,
        bottom: 1440,
        left: 1800
      },
      title: "Complete Example",
      creator: "TurboDocx",
    },
    footerHtml
  );
}
```

For more comprehensive TypeScript examples, check out the following files in the `example/typescript` directory:

- `typescript-example.ts` - A complete example showing how to generate and save DOCX files using TypeScript
- `type-test.ts` - Demonstrates the type checking capabilities provided by the TypeScript definitions

### Running the TypeScript Examples

To run the TypeScript examples:

```bash
# Navigate to the example directory
cd example/typescript

# Install ts-node globally (if not already installed)
npm install -g ts-node typescript

# Ensure @turbodocx/html-to-docx is built and accessible
# From the root directory of the project:
# npm install
# npm run build

# Run the TypeScript example directly
ts-node typescript-example.ts
```

This will generate two DOCX files in the `example/typescript` directory:
- `basic-example.docx` - A simple document with minimal configuration
- `advanced-example.docx` - A document with headers, footers, and advanced formatting options

## Usage

```js
await HTMLtoDOCX(htmlString, headerHTMLString, documentOptions, footerHTMLString)
```

full fledged examples can be found under `example/`

### Parameters

- `htmlString` <[String]> clean html string equivalent of document content.
- `headerHTMLString` <[String]> clean html string equivalent of header. Defaults to `<p></p>` if header flag is `true`.
- `documentOptions` <?[Object]>
  - `orientation` <"portrait"|"landscape"> defines the general orientation of the document. Defaults to portrait.
  - `pageSize` <?[Object]> Defaults to U.S. letter portrait orientation.
    - `width` <[Number]> width of the page for all pages in this section in [TWIP]. Defaults to 12240. Maximum 31680. Supports equivalent measurement in [pixel], [cm] or [inch].
    - `height` <[Number]> height of the page for all pages in this section in [TWIP]. Defaults to 15840. Maximum 31680. Supports equivalent measurement in [pixel], [cm] or [inch].
  - `margins` <?[Object]>
    - `top` <[Number]> distance between the top of the text margins for the main document and the top of the page for all pages in this section in [TWIP]. Defaults to 1440. Supports equivalent measurement in [pixel], [cm] or [inch].
    - `right` <[Number]> distance between the right edge of the page and the right edge of the text extents for this document in [TWIP]. Defaults to 1800. Supports equivalent measurement in [pixel], [cm] or [inch].
    - `bottom` <[Number]> distance between the bottom of text margins for the document and the bottom of the page in [TWIP]. Defaults to 1440. Supports equivalent measurement in [pixel], [cm] or [inch].
    - `left` <[Number]> distance between the left edge of the page and the left edge of the text extents for this document in [TWIP]. Defaults to 1800. Supports equivalent measurement in [pixel], [cm] or [inch].
    - `header` <[Number]> distance from the top edge of the page to the top edge of the header in [TWIP]. Defaults to 720. Supports equivalent measurement in [pixel], [cm] or [inch].
    - `footer` <[Number]> distance from the bottom edge of the page to the bottom edge of the footer in [TWIP]. Defaults to 720. Supports equivalent measurement in [pixel], [cm] or [inch].
    - `gutter` <[Number]> amount of extra space added to the specified margin, above any existing margin values. This setting is typically used when a document is being created for binding in [TWIP]. Defaults to 0. Supports equivalent measurement in [pixel], [cm] or [inch].
  - `title` <?[String]> title of the document.
  - `subject` <?[String]> subject of the document.
  - `creator` <?[String]> creator of the document. Defaults to `html-to-docx`
  - `keywords` <?[Array]<[String]>> keywords associated with the document. Defaults to ['html-to-docx'].
  - `description` <?[String]> description of the document.
  - `lastModifiedBy` <?[String]> last modifier of the document. Defaults to `html-to-docx`.
  - `revision` <?[Number]> revision of the document. Defaults to `1`.
  - `createdAt` <?[Date]> time of creation of the document. Defaults to current time.
  - `modifiedAt` <?[Date]> time of last modification of the document. Defaults to current time.
  - `headerType` <"default"|"first"|"even"> type of header. Defaults to `default`.
  - `header` <?[Boolean]> flag to enable header. Defaults to `false`.
  - `footerType` <"default"|"first"|"even"> type of footer. Defaults to `default`.
  - `footer` <?[Boolean]> flag to enable footer. Defaults to `false`.
  - `font` <?[String]> font name to be used. Defaults to `Times New Roman`.
  - `fontSize` <?[Number]> size of font in HIP(Half of point). Defaults to `22`. Supports equivalent measure in [pt].
  - `complexScriptFontSize` <?[Number]> size of complex script font in HIP(Half of point). Defaults to `22`. Supports equivalent measure in [pt].
  - `table` <?[Object]>
    - `row` <?[Object]>
      - `cantSplit` <?[Boolean]> flag to allow table row to split across pages. Defaults to `false`.
    - `borderOptions` <?[Object]>
      - `size` <?[Number]> denotes the border size. Defaults to `0`.
      - `stroke` <?[String]> denotes the style of the borderStrike. Defaults to `nil`.
      - `color` <?[String]> determines the border color. Defaults to `000000`.
    - `addSpacingAfter` <?[Boolean]> flag to add an empty paragraph after tables for spacing. Defaults to `true`.
  - `pageNumber` <?[Boolean]> flag to enable page number in footer. Defaults to `false`. Page number works only if footer flag is set as `true`.
  - `skipFirstHeaderFooter` <?[Boolean]> flag to skip first page header and footer. Defaults to `false`.
  - `lineNumber` <?[Boolean]> flag to enable line numbering. Defaults to `false`.
  - `lineNumberOptions` <?[Object]>
    - `start` <[Number]> start of the numbering - 1. Defaults to `0`.
    - `countBy` <[Number]> skip numbering in how many lines in between + 1. Defaults to `1`.
    - `restart` <"continuous"|"newPage"|"newSection"> numbering restart strategy. Defaults to `continuous`.
  - `numbering` <?[Object]>
    - `defaultOrderedListStyleType` <?[String]> default ordered list style type. Defaults to `decimal`.
  - `decodeUnicode` <?[Boolean]> flag to enable unicode decoding of header, body and footer. Defaults to `false`.
  - `lang` <?[String]> language localization code for spell checker to work properly. Defaults to `en-US`.
  - `preProcessing` <?[Object]>
    - `skipHTMLMinify` <?[Boolean]> flag to skip minification of HTML. Defaults to `false`.
- `footerHTMLString` <[String]> clean html string equivalent of footer. Defaults to `<p></p>` if footer flag is `true`.

### Returns

<[Promise]<[Buffer]|[Blob]>>

## Notes

Currently page break can be implemented by having div with classname "page-break" or style "page-break-after" despite the values of the "page-break-after", and contents inside the div element will be ignored. `<div class="page-break" style="page-break-after: always;"></div>`


CSS list-style-type for `<ol>` element are now supported. Just do something like this in the HTML:
```
  <ol style="list-style-type:lower-alpha;">
    <li>List item</li>
    ...
  </ol>
```
List of supported list-style-types:
- upper-alpha, will result in `A. List item`
- lower-alpha, will result in `a. List item`
- upper-roman, will result in `I. List item`
- lower-roman, will result in `i. List item`
- lower-alpha-bracket-end, will result in `a) List item`
- decimal-bracket-end, will result in `1) List item`
- decimal-bracket, will result in `(1) List item`
- decimal, **(the default)** will result in `1. List item`

Also you could add attribute `data-start="n"` to start the numbering from the n-th.

`<ol data-start="2">` will start the numbering from ( B. b. II. ii. 2. )


Font family doesnt work consistently for all word processor softwares

- Word Desktop work as intended
- LibreOffice ignores the fontTable.xml file, and finds a font by itself
- Word Online ignores the fontTable.xml file, and finds closest font in their font library

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to branch new branches off of develop for contribution.

## Support
**Proudly Sponsored by TurboDocx** 
[!["Proudly Sponsored by TurboDocx"](https://image.typedream.com/cdn-cgi/image/width=1920,format=auto,fit=scale-down,quality=100/https://api.typedream.com/v0/document/public/de39171b-a5c9-49c5-bd9c-c2dfd5d632a2/2PZxyx12UwC5HrIA3p6lo16fCms_Group_16_1_.png)](https://www.TurboDocx.com)

## License

MIT

[npm-image]: https://img.shields.io/npm/v/@turbodocx/html-to-docx.svg
[npm-url]: https://npmjs.org/package/@turbodocx/html-to-docx
[html-docx-js]: https://github.com/evidenceprime/html-docx-js "html-docx-js"
[altchunks]: https://docs.microsoft.com/en-us/dotnet/api/documentformat.openxml.wordprocessing.altchunk?view=openxml-2.8.1 "altchunks"
[libtidy]: https://github.com/jure/node-libtidy "libtidy"
[String]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type "String"
[Object]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object "Object"
[Number]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type "Number"
[TWIP]: https://en.wikipedia.org/wiki/Twip "TWIP"
[Array]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array "Array"
[Date]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date "Date"
[Boolean]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Boolean_type "Boolean"
[Promise]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise "Promise"
[Buffer]: https://nodejs.org/api/buffer.html#buffer_buffer "Buffer"
[Blob]: https://developer.mozilla.org/en-US/docs/Web/API/Blob "Blob"
[pixel]: https://en.wikipedia.org/wiki/Pixel#:~:text=Pixels%2C%20abbreviated%20as%20%22px%22,what%20screen%20resolution%20views%20it. "pixel"
[cm]: https://en.wikipedia.org/wiki/Centimetre "cm"
[inch]: https://en.wikipedia.org/wiki/Inch "inch"
[pt]: https://en.wikipedia.org/wiki/Point_(typography) "pt"

## Contributors

<a href="https://github.com/TurboDocx/html-to-docx/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=turbodocx/html-to-docx" />
</a>

Made with [contrib.rocks](https://contrib.rocks).
