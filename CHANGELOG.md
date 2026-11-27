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

### [1.23.3](https://github.com/TurboDocx/html-to-docx/compare/v1.23.2...v1.23.3) (2026-10-30)


### Bug Fixes

* **table:** always end a table cell with a paragraph, so Word no longer reports the file as corrupted. Affected cells whose children emit nothing (an empty `<li>`, `<ul>` or `<figure>`, or an image that fails to load) and, since 1.23.2, a list ending in a table with `table.addSpacingAfter: false` ([#262](https://github.com/TurboDocx/html-to-docx/pull/262))

### [1.23.2](https://github.com/TurboDocx/html-to-docx/compare/v1.23.1...v1.23.2) (2026-10-30)


### Bug Fixes

* **list:** render a `<table>` nested inside an `<li>` between the list item's paragraphs instead of silently dropping it ([#229](https://github.com/TurboDocx/html-to-docx/pull/229))


### Chores

* **deps:** raise runtime minimums to `axios` ^1.20.0 and `probe-image-size` ^7.4.0
* **deps:** lockfile security bumps for `follow-redirects`, `fast-uri`, `handlebars`, `brace-expansion`, and `serialize-javascript`, plus Next.js example bumps ([#246](https://github.com/TurboDocx/html-to-docx/pull/246), [#250](https://github.com/TurboDocx/html-to-docx/pull/250), [#251](https://github.com/TurboDocx/html-to-docx/pull/251), [#257](https://github.com/TurboDocx/html-to-docx/pull/257))

### [1.23.1](https://github.com/TurboDocx/html-to-docx/compare/v1.23.0...v1.23.1) (2026-09-11)

Dependency-security hygiene. No change to the published library runtime — the npm tarball ships only `dist/`, type defs, `scripts/`, `README`, and `LICENSE`, so none of these dependencies reach consumers. This release re-pins the release branch, which was still carrying the advisories below.


### Chores

* **deps:** bump `js-yaml` to 3.15.2 / 4.3.2 — high, GHSA-2883-xcg3-v3hh (dev tooling only)
* **deps:** bump `next` to 16.3.4 in the Next.js example — **critical**, GHSA-2xp9-vwfh-vxw4 + GHSA-p293-qw3h-jr36 (example app) ([#239](https://github.com/TurboDocx/html-to-docx/pull/239))
* **deps:** bump `sharp` to 0.35.4 and `baseline-browser-mapping` to 2.11.0 in the Next.js example — high / moderate, GHSA-rgj7-g3m4-5g8c + GHSA-w5vr-8v7q-w6rv ([#242](https://github.com/TurboDocx/html-to-docx/pull/242))

## [1.23.0](https://github.com/TurboDocx/html-to-docx/compare/v1.22.2...v1.23.0) (2026-09-10)


### Bug Fixes

* **image:** convert SVG `ex` units to pixels (1ex = 0.5em) instead of silently treating them as px ([#241](https://github.com/TurboDocx/html-to-docx/pull/241))


### Chores

* **deps:** security bumps for fast-uri, browserslist, and baseline-browser-mapping ([#238](https://github.com/TurboDocx/html-to-docx/pull/238))
* **ci:** split docx-diff into an untrusted `pull_request` build plus a trusted `workflow_run` comment, and harden the diff output-path guard

### [1.22.2](https://github.com/TurboDocx/html-to-docx/compare/v1.22.1...v1.22.2) (2026-08-24)


### Bug Fixes

* **build:** correct repository.url owner casing (TurboDocx) for npm provenance ([e57fdad](https://github.com/TurboDocx/html-to-docx/commit/e57fdadf2be1d9a99650bacb13ac2701fd845b25))

### [1.22.1](https://github.com/turbodocx/html-to-docx/compare/v1.22.0...v1.22.1) (2026-08-23)


### Bug Fixes

* **security:** close runtime Dependabot advisories (form-data, postcss) ([#214](https://github.com/turbodocx/html-to-docx/issues/214)) ([7b58683](https://github.com/turbodocx/html-to-docx/commit/7b58683908fec16f705d041d1b4753ed95b914dc))

## [1.22.0](https://github.com/turbodocx/html-to-docx/compare/v1.21.0...v1.22.0) (2026-06-15)

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
