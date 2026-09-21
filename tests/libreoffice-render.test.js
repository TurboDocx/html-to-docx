/**
 * LibreOffice Render Check
 *
 * The unit tests assert the XML the converter writes; this one asserts that a
 * real word processor agrees, by converting a document that uses all four
 * features to PDF and looking at the pixels of page one. It needs soffice on
 * the PATH and takes tens of seconds, so it only runs when RENDER_TESTS=1 is
 * set — the normal suite skips it.
 *
 *   RENDER_TESTS=1 npx jest tests/libreoffice-render.test.js
 */

import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

import HTMLtoDOCX from '../index.js';

const RENDER_TIMEOUT_MS = 180000;

function isAvailable(command, args) {
  try {
    execFileSync(command, args, { stdio: 'ignore', timeout: 60000 });
    return true;
  } catch (error) {
    return false;
  }
}

const renderRequested = process.env.RENDER_TESTS === '1';
const hasSoffice = renderRequested && isAvailable('soffice', ['--version']);
// Ghostscript turns the PDF into a headerless RGB bitmap, which needs no image
// library to read. None of pngjs / sharp / jimp / PIL is installed here, so
// this is what makes the pixel assertion possible at all.
const hasGhostscript = hasSoffice && isAvailable('gs', ['--version']);

const describeRender = hasSoffice ? describe : describe.skip;

/**
 * Parse a binary PPM (P6) into { width, height, pixelAt(x, y) }.
 */
function parsePPM(buffer) {
  let offset = 0;
  const readToken = () => {
    while (offset < buffer.length) {
      const char = String.fromCharCode(buffer[offset]);
      if (char === '#') {
        while (offset < buffer.length && buffer[offset] !== 0x0a) offset += 1;
      } else if (/\s/.test(char)) {
        offset += 1;
      } else {
        break;
      }
    }
    const start = offset;
    while (offset < buffer.length && !/\s/.test(String.fromCharCode(buffer[offset]))) {
      offset += 1;
    }
    return buffer.toString('ascii', start, offset);
  };

  const magic = readToken();
  if (magic !== 'P6') throw new Error(`expected a P6 bitmap, got ${magic}`);
  const width = Number(readToken());
  const height = Number(readToken());
  const maxValue = Number(readToken());
  if (maxValue !== 255) throw new Error(`expected 8-bit samples, got max ${maxValue}`);
  const pixels = buffer.slice(offset + 1);

  return {
    width,
    height,
    pixelAt(x, y) {
      const index = (y * width + x) * 3;
      return { red: pixels[index], green: pixels[index + 1], blue: pixels[index + 2] };
    },
  };
}

describeRender('LibreOffice render', () => {
  let workDir;

  beforeAll(() => {
    // A throwaway directory and a private profile, so this cannot disturb (or
    // be disturbed by) another LibreOffice running on the machine.
    workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'htd-render-'));
  });

  afterAll(() => {
    if (workDir) fs.rmSync(workDir, { recursive: true, force: true });
  });

  it(
    'should convert a document using all four features to a PDF with a red header band',
    async () => {
      const header =
        '<p>' +
        '<span data-shape="rect" data-left="0" data-top="0" data-width="816" data-height="96"' +
        ' data-fill="#FF0000"></span>' +
        '<span data-shape="line" data-left="96" data-top="120" data-width="624"' +
        ' data-stroke="#0000FF" data-stroke-width="2" data-stroke-style="dashed"></span>' +
        'Page <span data-field="page">1</span> of <span data-field="numpages">1</span>' +
        '</p>';
      const body =
        '<p>Body text under the band.</p>' +
        '<table style="margin-left: 36px" data-no-spacing-after="true">' +
        '<tr><td style="padding: 12px; background-color: #00FF00">padded and shaded</td></tr>' +
        '</table>';

      const buffer = await HTMLtoDOCX(body, header, { header: true }, null);
      const docxPath = path.join(workDir, 'render-check.docx');
      fs.writeFileSync(docxPath, buffer);

      const profileArgument = `-env:UserInstallation=file://${path.join(workDir, 'profile')}`;
      execFileSync(
        'soffice',
        ['--headless', profileArgument, '--convert-to', 'pdf', '--outdir', workDir, docxPath],
        { stdio: 'pipe', timeout: RENDER_TIMEOUT_MS }
      );

      const pdfPath = path.join(workDir, 'render-check.pdf');
      expect(fs.existsSync(pdfPath)).toBe(true);
      // A PDF that failed to lay anything out still weighs a few hundred bytes.
      expect(fs.statSync(pdfPath).size).toBeGreaterThan(3000);

      if (!hasGhostscript) {
        // No pixel reader is installed, so the conversion succeeding is as far
        // as this check goes.
        return;
      }

      const bitmapPath = path.join(workDir, 'page1.ppm');
      execFileSync(
        'gs',
        [
          '-q',
          '-dNOPAUSE',
          '-dBATCH',
          '-dSAFER',
          '-sDEVICE=ppmraw',
          '-r96',
          '-dFirstPage=1',
          '-dLastPage=1',
          `-sOutputFile=${bitmapPath}`,
          pdfPath,
        ],
        { stdio: 'pipe', timeout: RENDER_TIMEOUT_MS }
      );

      const bitmap = parsePPM(fs.readFileSync(bitmapPath));
      // Letter at 96 dpi.
      expect(bitmap.width).toBeGreaterThan(700);
      expect(bitmap.height).toBeGreaterThan(900);

      // The band is drawn from the page corner, 816px wide and 96px tall, so
      // (10, 10) is inside it.
      const bandPixel = bitmap.pixelAt(10, 10);
      expect(bandPixel.red).toBeGreaterThan(200);
      expect(bandPixel.green).toBeLessThan(80);
      expect(bandPixel.blue).toBeLessThan(80);
    },
    RENDER_TIMEOUT_MS
  );
});
