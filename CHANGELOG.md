# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## Unreleased (1.24.0)

### Features

* **browserLayout:** new document option that lays the document out the way a browser renders the HTML. Off by default. It turns on:
  * CSS `line-height`, `em` / `rem` font sizes, paragraph `margin-top` / `margin-bottom`, paragraph borders, `font-weight` below 600 as not bold, `font-style: italic`, tab characters as `<w:tab/>`, and each paragraph mark's own run properties
  * table cell `padding` (`w:tcMar`), table `margin-left` indent, `table-layout: fixed`, `<thead>` as repeating header rows, floating tables (`data-wrap`), and `data-no-spacing-after`
  * floating pictures (`data-wrap`), picture crop, border and transparency (`data-crop-*`, `data-border-*`, `data-transparency`), and alt text on the drawing
  * `decimal-leading-zero`, `data-suffix`, outline numbering (`data-numbering="outline"`), `data-bullet` glyphs, Arial bullets for `disc` / `circle` / `square`, and checklists (`<ul data-checklist="true">`)
  * `data-shape` and `data-field` markers
* **symbolFont:** new option `{ checkbox?, glyph? }` naming the fonts of checklist boxes (default `Segoe UI Symbol`) and of symbol bullets (default `DejaVu Sans`), each listed in the font table with the other as its alternative. Used with `browserLayout`.
* **firstPage:** Word's "Different first page" header and footer, as `firstPage: { headerHTML, footerHTML }`.
* **sections:** page sections with their own orientation, size, margins, header and footer (`sections` + `<div data-docx-section>`).
* **table.cellHeadings:** headings inside table cells written as Word headings.
* **numbering:** `numbering.levelIndent` and `numbering.hangingIndent` set the list level indent and marker hanging, in twips.

### Bug Fixes

* the body's `w:sectPr` is written last, as the schema requires
* table grid column widths are written as whole twips
* a table with a `<thead>` and a `<tbody>` writes one `<w:tblGrid>`, not a second one between its rows (Word on the web could refuse to edit such a document)
* `<li><p>..</p>tail</li>` no longer writes `w:numId w:val="null"`
* `w:lineRule` is written only on `w:spacing`
* header and footer parts are written with `w:` prefixes, so template engines such as docxtemplater find their text
* the children of `w:tcPr`, `w:pPr` and `w:rPr` are written in schema order
* the `numbering` option no longer crashes when it omits `defaultOrderedListStyleType`

No change to output for callers who pass none of the new options (checked against 1.23.3 by the zero-regression suite), apart from the bug fixes above.

## [1.21.0](https://github.com/turbodocx/html-to-docx/compare/v1.20.1...v1.21.0) (2026-05-16)

### Features

* **page-breaks:** support `page-break-before: always` and refactor `page-break-after` ([#175](https://github.com/turbodocx/html-to-docx/issues/175))
* **tables:** honor alignment and per-cell border options ([#170](https://github.com/turbodocx/html-to-docx/issues/170), [#180](https://github.com/turbodocx/html-to-docx/issues/180), [#186](https://github.com/turbodocx/html-to-docx/pull/186))
* **formatting:** strikethrough support ([#184](https://github.com/turbodocx/html-to-docx/pull/184))
* **docs:** Agent Skill install path for AI-assisted setup ([#195](https://github.com/turbodocx/html-to-docx/pull/195), [#196](https://github.com/turbodocx/html-to-docx/pull/196))

### Bug Fixes

* **rPr:** sort `<w:rPr>` children to ECMA-376 EG_RPrBase spec order so Word renders all properties (previously dropped silently) ([#202](https://github.com/turbodocx/html-to-docx/pull/202))
* **inline-color:** inline `color` on `<strong>`/`<em>`/`<u>` overrides ancestor paragraph color ([#200](https://github.com/turbodocx/html-to-docx/issues/200), [#201](https://github.com/turbodocx/html-to-docx/pull/201))
* **nested-tables:** render tables nested inside table cells without corrupting the document ([#147](https://github.com/turbodocx/html-to-docx/issues/147), [#150](https://github.com/turbodocx/html-to-docx/pull/150))
* **lists:** render multiple paragraphs inside a single list item ([#145](https://github.com/turbodocx/html-to-docx/issues/145), [#148](https://github.com/turbodocx/html-to-docx/pull/148))
* **blockquote-images:** preserve docx context for images inside blockquotes

### Chores

* CI upgraded to Node 24 and supply-chain hardening ([#189](https://github.com/turbodocx/html-to-docx/pull/189))
* resolve 24 audit vulnerabilities
* use `pull_request_target` so fork PRs can post diff comments
* credit contributors (@odex21, @FultonG) and TurboDocx in generated DOCX metadata

### [1.20.1](https://github.com/turbodocx/html-to-docx/compare/v1.20.0...v1.20.1) (2026-02-05)
