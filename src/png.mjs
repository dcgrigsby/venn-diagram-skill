import { readFile } from 'node:fs/promises';
import { Resvg, initWasm } from '@resvg/resvg-wasm';

let initialized;

export async function ensureResvg(wasmUrl = new URL('../vendor/resvg/index_bg.wasm', import.meta.url)) {
  initialized ??= readFile(wasmUrl).then((bytes) => initWasm(bytes));
  try {
    await initialized;
  } catch (error) {
    initialized = undefined;
    throw error;
  }
}

export async function renderPng(svg, fonts, longestSide, wasmUrl) {
  const width = Number(/<svg\b[^>]*\bwidth="([\d.]+)"/.exec(svg)?.[1]);
  const height = Number(/<svg\b[^>]*\bheight="([\d.]+)"/.exec(svg)?.[1]);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error('SVG dimensions are invalid');
  }
  await ensureResvg(wasmUrl);
  const mode = width >= height ? 'width' : 'height';
  let renderer;
  let image;
  try {
    renderer = new Resvg(svg, {
      fitTo: { mode, value: longestSide },
      font: {
        fontBuffers: [fonts[0], fonts[1]],
        defaultFontFamily: 'Noto Sans',
      },
    });
    image = renderer.render();
    if (Math.max(image.width, image.height) !== longestSide
      || Math.abs(image.width / image.height - width / height)
        > 1 / Math.min(image.width, image.height)) {
      throw new Error('PNG dimensions do not match the SVG aspect ratio');
    }
    return new Uint8Array(image.asPng());
  } finally {
    image?.free();
    renderer?.free();
  }
}
