import fs from 'fs';
import path from 'path';

// Use process.cwd() to get the project root, then navigate to fixtures
// This works in both Jest and regular Node.js environments
const fixturesDir = path.join(process.cwd(), 'tests', 'fixtures');

// Load raw fixture files as buffers
export const PNG_FIXTURE = fs.readFileSync(path.join(fixturesDir, 'test-1x1.png'));
export const JPEG_FIXTURE = fs.readFileSync(path.join(fixturesDir, 'test-1x1.jpg'));
export const GIF_FIXTURE = fs.readFileSync(path.join(fixturesDir, 'test-1x1.gif'));

// Convert to base64 strings for data URLs and magic byte testing
// These maintain full fidelity with the original image data
export const PNG_BASE64 = PNG_FIXTURE.toString('base64');
export const JPEG_BASE64 = JPEG_FIXTURE.toString('base64');
export const GIF_BASE64 = GIF_FIXTURE.toString('base64');

// For backward compatibility and convenience
export const PNG_1x1_BASE64 = PNG_BASE64;
export const JPEG_1x1_BASE64 = JPEG_BASE64;
export const GIF_1x1_BASE64 = GIF_BASE64;
