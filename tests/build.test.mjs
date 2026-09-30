import assert from 'node:assert/strict';
import { access, mkdtemp, readFile, rm, symlink } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

test('checked-in runtime is self-contained and reports its version', async () => {
  const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url)));
  assert.deepEqual(pkg.dependencies ?? {}, {});

  await access(new URL('../scripts/render-venn.mjs', import.meta.url));
  await access(new URL('../vendor/resvg/index_bg.wasm', import.meta.url));
  await access(new URL('../vendor/fonts/NotoSans-Regular.ttf', import.meta.url));
  await access(new URL('../vendor/fonts/NotoSans-Bold.ttf', import.meta.url));

  const run = spawnSync(process.execPath, ['scripts/render-venn.mjs', '--version'], {
    cwd: fileURLToPath(new URL('..', import.meta.url)),
    encoding: 'utf8',
  });
  assert.equal(run.status, 0, run.stderr);
  assert.deepEqual(JSON.parse(run.stdout), {
    name: 'venn-diagram-skill',
    rendererVersion: '0.1.0',
    schemaVersion: 1,
  });
});

test('checked-in renderer executes through a symlink', async () => {
  const temp = await mkdtemp(join(tmpdir(), 'venn-symlink-'));
  try {
    const link = join(temp, 'render-venn.mjs');
    await symlink(fileURLToPath(new URL('../scripts/render-venn.mjs', import.meta.url)), link);
    const run = spawnSync(process.execPath, [link, '--version'], {
      cwd: temp,
      encoding: 'utf8',
    });
    assert.equal(run.status, 0, run.stderr);
    assert.deepEqual(JSON.parse(run.stdout), {
      name: 'venn-diagram-skill',
      rendererVersion: '0.1.0',
      schemaVersion: 1,
    });
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});

test('committed renderer matches a fresh build byte for byte', async () => {
  const temp = await mkdtemp(join(tmpdir(), 'venn-build-'));
  try {
    const output = join(temp, 'render-venn.mjs');
    const run = spawnSync(process.execPath, ['scripts/build.mjs', output], {
      cwd: fileURLToPath(new URL('..', import.meta.url)),
      encoding: 'utf8',
    });
    assert.equal(run.status, 0, run.stderr);
    assert.deepEqual(
      await readFile(output),
      await readFile(new URL('../scripts/render-venn.mjs', import.meta.url)),
    );
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});

test('vendored resvg binary matches the pinned installed package', async () => {
  const hash = async (path) => createHash('sha256').update(await readFile(path)).digest('hex');
  assert.equal(
    await hash(new URL('../vendor/resvg/index_bg.wasm', import.meta.url)),
    await hash(new URL('../node_modules/@resvg/resvg-wasm/index_bg.wasm', import.meta.url)),
  );
});
