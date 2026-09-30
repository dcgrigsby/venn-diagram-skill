import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { normalizeSpec, SpecError } from './spec.mjs';
import { loadFonts } from './typography.mjs';
import { layoutDiagram } from './layout.mjs';
import { serializeSvg } from './svg.mjs';
import { atomicOverwritePair, atomicWrite, reserveOutputPair } from './output.mjs';
import { chooseGlobalTextColor, parseColor, regionBackground } from './color.mjs';
import { renderPng } from './png.mjs';

export const RENDERER_INFO = Object.freeze({
  name: 'venn-diagram-skill',
  rendererVersion: '0.1.0',
  schemaVersion: 1,
});

function reportError(error, context = {}) {
  const detail = error instanceof SpecError
    ? error
    : new SpecError('INPUT_ERROR', '$', 'unable to read specification file');
  process.stdout.write(`${JSON.stringify({
    status: 'error',
    complete: false,
    ...context,
    error: { code: detail.code, path: detail.path, message: detail.message },
  })}\n`);
  process.stderr.write(`${detail.code}: ${detail.message}\n`);
  return 1;
}

export async function main(argv = process.argv.slice(2), { wasmUrl } = {}) {
  if (argv.length === 1 && argv[0] === '--version') {
    process.stdout.write(`${JSON.stringify(RENDERER_INFO)}\n`);
    return 0;
  }
  if (argv.length === 1 && !argv[0].startsWith('-')) {
    const specPath = resolve(argv[0]);
    let output;
    let pngDimensions;
    try {
      const source = await readFile(specPath, 'utf8');
      let raw;
      try {
        raw = JSON.parse(source);
      } catch {
        throw new SpecError('INVALID_JSON', '$', 'invalid JSON specification');
      }
      const spec = normalizeSpec(raw, process.cwd());
      const fonts = await loadFonts({
        regular: new URL('../vendor/fonts/NotoSans-Regular.ttf', import.meta.url),
        bold: new URL('../vendor/fonts/NotoSans-Bold.ttf', import.meta.url),
      });
      const layout = layoutDiagram(spec, fonts);
      if (layout.status === 'needs_revision') {
        process.stdout.write(`${JSON.stringify(layout)}\n`);
        return 2;
      }
      const backgrounds = layout.labels.map((label) => regionBackground(
        label.key,
        new Map(layout.circles.map((circle) => [circle.id, parseColor(circle.fill)])),
        layout.opacity,
        parseColor(layout.background),
      ));
      const chosenText = chooseGlobalTextColor(backgrounds);
      const svg = serializeSvg(layout, fonts, spec.accessibility);
      try {
        output = await reserveOutputPair(spec.output);
        if (spec.output.overwrite) {
          const png = await renderPng(svg, fonts.buffers, spec.output.pngLongestSide, wasmUrl);
          pngDimensions = { width: Buffer.from(png).readUInt32BE(16),
            height: Buffer.from(png).readUInt32BE(20) };
          await atomicOverwritePair(output, svg, png);
        } else {
          await atomicWrite(output.svgPath, svg);
          const png = await renderPng(svg, fonts.buffers, spec.output.pngLongestSide, wasmUrl);
          pngDimensions = { width: Buffer.from(png).readUInt32BE(16),
            height: Buffer.from(png).readUInt32BE(20) };
          await atomicWrite(output.pngPath, png);
        }
        await access(output.svgPath);
        await access(output.pngPath);
      } catch (error) {
        if (output) {
          await output.svgReservation.release();
          await output.pngReservation.release();
        }
        throw new SpecError('OUTPUT_ERROR', 'output', 'unable to render or write output pair');
      }
      const [first, second] = layout.circles;
      const centerDistance = Math.hypot(second.cx - first.cx, second.cy - first.cy);
      const warnings = chosenText.warning
        ? [{ code: 'LOW_CONTRAST', message: 'minimum label contrast is below 4.5:1' }]
        : [];
      process.stdout.write(`${JSON.stringify({
        status: warnings.length ? 'warning' : 'ok',
        svgPath: output.svgPath,
        pngPath: output.pngPath,
        dimensions: { svg: { width: Number(layout.width.toFixed(3)),
          height: Number(layout.height.toFixed(3)) },
          png: pngDimensions },
        geometry: { radius: first.r, centerDistanceRatio: centerDistance / first.r },
        textColor: chosenText.color,
        minimumContrast: chosenText.minimumContrast,
        warnings,
        labels: layout.labels.map(({ key, text, lines, bold, box }) => ({
          key, text, lines, bold, box,
        })),
      })}\n`);
      return 0;
    } catch (error) {
      return reportError(error, output ? { svgPath: output.svgPath, pngPath: output.pngPath } : {});
    }
  }
  return reportError(
    new SpecError('INVALID_ARGUMENTS', 'argv', 'expected one specification JSON path or --version'),
  );
}
