import fs from 'fs';
import path from 'path';

// Cross-platform directory resolution (works on Windows, macOS, Linux)
// process.cwd() returns current working directory and is supported in all Node.js environments
// path.join() handles path separators correctly (/ on Unix, \ on Windows)
const fixturesDir = path.join(process.cwd(), 'tests', 'fixtures');

// Load raw fixture files as buffers (path.join handles separators correctly on Windows/Unix)
export const PNG_FIXTURE = fs.readFileSync(path.join(fixturesDir, 'test-1x1.png'));
export const JPEG_FIXTURE = fs.readFileSync(path.join(fixturesDir, 'test-1x1.jpg'));
export const GIF_FIXTURE = fs.readFileSync(path.join(fixturesDir, 'test-1x1.gif'));
export const SVG_FIXTURE = fs.readFileSync(path.join(fixturesDir, 'test-circle.svg'), 'utf-8');

// Convert to base64 strings for data URLs and magic byte testing
// These maintain full fidelity with the original image data
export const PNG_BASE64 = PNG_FIXTURE.toString('base64');
export const JPEG_BASE64 = JPEG_FIXTURE.toString('base64');
export const GIF_BASE64 = GIF_FIXTURE.toString('base64');
export const SVG_BASE64 = Buffer.from(SVG_FIXTURE, 'utf-8').toString('base64');

// For backward compatibility and convenience
export const PNG_1x1_BASE64 = PNG_BASE64;
export const JPEG_1x1_BASE64 = JPEG_BASE64;
export const GIF_1x1_BASE64 = GIF_BASE64;
