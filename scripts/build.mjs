import { chmod, copyFile, mkdir } from 'node:fs/promises';
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
  entryPoints: ['src/main.mjs'],
  outfile,
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  banner: { js: '#!/usr/bin/env node' },
  legalComments: 'eof',
  sourcemap: false,
});
await chmod(outfile, 0o755);
