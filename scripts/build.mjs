import { chmod, copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { build } from 'esbuild';

const outfile = process.argv[2] ?? 'scripts/render-venn.mjs';
await mkdir('scripts', { recursive: true });
await mkdir(dirname(outfile), { recursive: true });
await mkdir('vendor/resvg', { recursive: true });
await copyFile(
  'node_modules/@resvg/resvg-wasm/index_bg.wasm',
  'vendor/resvg/index_bg.wasm',
);
await build({
  stdin: {
    contents: "import './src/main.mjs'; export { loadFonts, validateGlyphs, measureLine, wrapCandidates } from './src/typography.mjs'; export { renderPng, ensureResvg } from './src/png.mjs';",
    resolveDir: process.cwd(),
    sourcefile: 'src/runtime-entry.mjs',
  },
  outfile,
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  banner: { js: '#!/usr/bin/env node' },
  legalComments: 'eof',
  sourcemap: false,
});
await writeFile(outfile, (await readFile(outfile, 'utf8')).replace(/[\t ]+$/gm, ''));
await chmod(outfile, 0o755);
