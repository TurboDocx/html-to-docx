import { measureImage } from '../src/utils/image';

/**
 * Locks the pixel dimensions `measureImage` reports.
 *
 * The underlying prober (`probe-image-size`) returns the raw declared number plus the
 * unit it was written in, so an SVG sized in points comes back as points. Every caller
 * treats the result as pixels and multiplies it by 9525 to get EMUs, so a raw value
 * silently renders the image at the wrong size — a `72pt` SVG shrinks by 25%.
 *
 * The expected values below were measured with `image-size@2.0.2`, the library this
 * replaced, so this suite is a parity check against the previous rendering rather than
 * a restatement of the current implementation.
 */
describe('measureImage', () => {
  // A minimal 1x1 PNG — the same fixture the image pipeline tests use.
  const onePixelPng = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
    'base64'
  );

  const buildSvg = (width, height) =>
    Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
        `viewBox="0 0 72 36"><rect width="72" height="36" fill="red"/></svg>`
    );

  describe('SVG dimensions are normalised to pixels', () => {
    // Expected pixel dimensions for a 72 x 36 SVG declared in each unit, at 96 DPI:
    // 1pt = 4/3px, 1pc = 16px, 1in = 96px, 1cm = 37.795px, em/rem assume a 16px root.
    const unitCases = [
      { unit: 'no unit', suffix: '', width: 72, height: 36 },
      { unit: 'px', suffix: 'px', width: 72, height: 36 },
      { unit: 'pt', suffix: 'pt', width: 96, height: 48 },
      { unit: 'pc', suffix: 'pc', width: 1152, height: 576 },
      { unit: 'cm', suffix: 'cm', width: 2721, height: 1361 },
      { unit: 'mm', suffix: 'mm', width: 272, height: 136 },
      { unit: 'in', suffix: 'in', width: 6912, height: 3456 },
      { unit: 'em', suffix: 'em', width: 1152, height: 576 },
      { unit: 'rem', suffix: 'rem', width: 1152, height: 576 },
    ];

    it.each(unitCases)(
      'converts a 72 x 36 SVG in $unit to $width x $height px',
      ({ suffix, width, height }) => {
        const measured = measureImage(buildSvg(`72${suffix}`, `36${suffix}`));

        expect(measured).not.toBeNull();
        expect(measured.width).toBe(width);
        expect(measured.height).toBe(height);
      }
    );

    it('treats a percentage width as pixels rather than scaling by it', () => {
      // A percentage has no meaning without a parent box, so it passes through
      // unconverted — matching how the SVG attribute parser already handles it.
      const measured = measureImage(buildSvg('72%', '36%'));

      expect(measured.width).toBe(72);
      expect(measured.height).toBe(36);
    });

    it('falls back to the viewBox when no width or height is declared', () => {
      const measured = measureImage(
        Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 150"/>')
      );

      expect(measured.width).toBe(300);
      expect(measured.height).toBe(150);
    });
  });

  describe('raster formats pass through untouched', () => {
    it('reports a 1x1 PNG as 1px x 1px', () => {
      const measured = measureImage(onePixelPng);

      expect(measured.width).toBe(1);
      expect(measured.height).toBe(1);
      expect(measured.wUnits).toBe('px');
    });

    it('preserves the fields callers read alongside the dimensions', () => {
      const measured = measureImage(onePixelPng);

      expect(measured.type).toBe('png');
      expect(measured.mime).toBe('image/png');
    });
  });

  describe('unrecognised input', () => {
    // The previous library threw here; this one returns null. Both are handled by the
    // falsy-dimension guard at every call site, but the null path is the live one now.
    it.each([
      ['an empty buffer', Buffer.alloc(0)],
      ['random bytes', Buffer.from('this is definitely not an image')],
      ['an HTML error page', Buffer.from('<!DOCTYPE html><html><body>404</body></html>')],
      // Cut before the IHDR chunk carries the dimensions — a longer prefix is
      // genuinely measurable, since a PNG declares its size in the first 24 bytes.
      ['a PNG truncated before its IHDR', onePixelPng.slice(0, 20)],
    ])('returns null for %s instead of throwing', (_label, buffer) => {
      expect(() => measureImage(buffer)).not.toThrow();
      expect(measureImage(buffer)).toBeNull();
    });
  });
});
