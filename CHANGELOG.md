# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

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
