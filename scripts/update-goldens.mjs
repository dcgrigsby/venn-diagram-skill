import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodePng, pngPixelHash } from '../tests/helpers.mjs';

const renderer = fileURLToPath(new URL('render-venn.mjs', import.meta.url));
await mkdir(new URL('../tests/expected/', import.meta.url), { recursive: true });
for (const name of ['two-basic', 'three-full']) {
  const directory = await mkdtemp(join(tmpdir(), `venn-golden-${name}-`));
  try {
    const raw = JSON.parse(await readFile(new URL(`../tests/fixtures/${name}.json`, import.meta.url)));
    raw.output ??= {};
    raw.output.directory = directory;
    const input = join(directory, `${name}.json`);
    await writeFile(input, JSON.stringify(raw));
    const run = spawnSync(process.execPath, [renderer, input], { cwd: directory, encoding: 'utf8' });
    if (run.status !== 0) throw new Error(`renderer failed for ${name}: ${run.stderr || run.stdout}`);
    const { pngPath } = JSON.parse(run.stdout);
    const hash = pngPixelHash(decodePng(await readFile(pngPath)));
    await writeFile(new URL(`../tests/expected/${name}.sha256`, import.meta.url), `${hash}\n`);
    process.stdout.write(`${name}: ${hash}\n`);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}
