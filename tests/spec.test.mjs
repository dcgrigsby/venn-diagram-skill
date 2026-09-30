import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { DEFAULTS, normalizeSpec, SpecError } from '../src/spec.mjs';

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const basic = () => ({
  version: 1,
  sets: [{ id: 'a', label: 'Product' }, { id: 'b', label: 'Engineering' }],
  overlaps: {},
});
const fixture = (name) => JSON.parse(readFileSync(new URL(`fixtures/${name}`, import.meta.url)));
const rejects = (raw, code, path) => {
  assert.throws(() => normalizeSpec(raw, '/tmp/output'), (error) => {
    assert.ok(error instanceof SpecError);
    assert.equal(error.code, code);
    assert.equal(error.path, path);
    assert.equal(typeof error.message, 'string');
    assert.ok(error.message.length > 0);
    return true;
  });
};

test('normalizes defaults without inventing overlaps', () => {
  const normalized = normalizeSpec(basic(), '/tmp/output');
  assert.deepEqual(normalized.sets, [
    { id: 'a', label: 'Product', bold: false },
    { id: 'b', label: 'Engineering', bold: false },
  ]);
  assert.deepEqual(normalized.style.colors, DEFAULTS.colors);
  assert.equal(normalized.style.background, '#FFFFFF');
  assert.equal(normalized.style.opacity, 0.55);
  assert.equal(normalized.output.pngLongestSide, 1600);
  assert.equal(normalized.output.overwrite, false);
  assert.equal(normalized.output.directory, '/tmp/output');
  assert.equal(normalized.output.basename, 'product-engineering-venn');
  assert.equal(normalized.overlaps.size, 0);
});

test('loads two-set fixture and normalizes hex case', () => {
  const normalized = normalizeSpec(fixture('two-basic.json'), projectRoot);
  assert.equal(normalized.overlaps.get('ab').text, 'Feasible roadmap');
  assert.equal(normalized.overlaps.get('ab').bold, true);
  assert.equal(normalized.style.colors.a, '#2563EB');
  assert.equal(normalized.style.colors.b, '#F59E0B');
  assert.equal(normalized.output.directory, projectRoot);
});

test('loads all four three-set overlaps without inventing any', () => {
  const normalized = normalizeSpec(fixture('three-full.json'), projectRoot);
  assert.deepEqual([...normalized.overlaps.keys()], ['ab', 'ac', 'bc', 'abc']);
  assert.equal([...normalized.overlaps.values()].filter((part) => part.bold).length, 1);
  assert.deepEqual(normalized.sets.map((set) => set.id), ['a', 'b', 'c']);
});

test('rejects an unknown schema version', () => {
  const raw = basic(); raw.version = 2;
  rejects(raw, 'INVALID_VERSION', 'version');
});

test('rejects four otherwise valid sets', () => {
  rejects(fixture('invalid-four-sets.json'), 'INVALID_SETS', 'sets');
});

test('rejects duplicate set IDs', () => {
  const raw = basic(); raw.sets[1].id = 'a';
  rejects(raw, 'INVALID_SET', 'sets[1].id');
});

test('rejects misordered set IDs', () => {
  const raw = basic(); raw.sets = [raw.sets[1], raw.sets[0]];
  rejects(raw, 'INVALID_SET', 'sets[0].id');
});

test('rejects empty set labels', () => {
  const raw = basic(); raw.sets[0].label = ' \t ';
  rejects(raw, 'INVALID_LABEL', 'sets[0].label');
});

test('normalizes horizontal whitespace while preserving explicit newlines', () => {
  const raw = basic(); raw.sets[0].label = '  Product\t team  \n  Strategy   group ';
  raw.overlaps.ab = { text: '  Roadmap\t work  \n  Priorities  ' };
  const normalized = normalizeSpec(raw, projectRoot);
  assert.equal(normalized.sets[0].label, 'Product team\nStrategy group');
  assert.equal(normalized.overlaps.get('ab').text, 'Roadmap work\nPriorities');
});

test('rejects a fourth explicit line in a set label', () => {
  const raw = basic(); raw.sets[0].label = 'one\ntwo\nthree\nfour';
  rejects(raw, 'INVALID_LABEL', 'sets[0].label');
});

test('rejects a fourth explicit line in overlap text', () => {
  const raw = basic(); raw.overlaps.ab = { text: 'one\ntwo\nthree\nfour' };
  rejects(raw, 'INVALID_OVERLAP', 'overlaps.ab.text');
});

test('rejects partial rich text', () => {
  const raw = basic(); raw.overlaps.ab = { text: ['partial', 'bold'] };
  rejects(raw, 'INVALID_OVERLAP', 'overlaps.ab.text');
});

test('rejects an overlap key that cannot exist for two sets', () => {
  const raw = basic(); raw.overlaps.ac = { text: 'Impossible' };
  rejects(raw, 'INVALID_OVERLAP', 'overlaps.ac');
});

test('rejects nonboolean bold', () => {
  const raw = basic(); raw.sets[0].bold = 'true';
  rejects(raw, 'INVALID_SET', 'sets[0].bold');
});

test('rejects zero opacity', () => {
  const raw = basic(); raw.style = { opacity: 0 };
  rejects(raw, 'INVALID_OPACITY', 'style.opacity');
});

test('rejects opacity above one', () => {
  const raw = basic(); raw.style = { opacity: 1.01 };
  rejects(raw, 'INVALID_OPACITY', 'style.opacity');
});

test('normalizes a standard CSS color name to hex', () => {
  const raw = basic(); raw.style = { colors: { a: 'navy' } };
  assert.equal(normalizeSpec(raw, projectRoot).style.colors.a, '#000080');
});

test('rejects unsupported color syntax', () => {
  const raw = basic(); raw.style = { colors: { a: 'rgb(0,0,0)' } };
  rejects(raw, 'INVALID_COLOR', 'style.colors.a');
});

test('rejects a non-solid background', () => {
  const raw = basic(); raw.style = { background: 'linear-gradient(red, blue)' };
  rejects(raw, 'INVALID_BACKGROUND', 'style.background');
});

test('rejects unsafe basename characters', () => {
  const raw = basic(); raw.output = { basename: '../escape' };
  rejects(raw, 'INVALID_BASENAME', 'output.basename');
});

test('rejects Windows reserved device basenames with extensions', () => {
  const raw = basic(); raw.output = { basename: 'con.png' };
  rejects(raw, 'INVALID_BASENAME', 'output.basename');
});

test('derives accessibility text from named regions only', () => {
  const raw = basic(); raw.overlaps.ab = { text: 'Feasible roadmap' };
  const normalized = normalizeSpec(raw, projectRoot);
  assert.equal(normalized.accessibility.title, 'Venn diagram: Product, Engineering');
  assert.equal(normalized.accessibility.description, 'Sets: Product; Engineering. Overlaps: Product and Engineering: Feasible roadmap.');
});

test('preserves explicit accessibility text', () => {
  const raw = basic(); raw.accessibility = { title: 'My title', description: 'My description' };
  const normalized = normalizeSpec(raw, projectRoot);
  assert.deepEqual(normalized.accessibility, { title: 'My title', description: 'My description' });
});

test('resolves a nested output directory without creating it during normalization', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'venn-directory-'));
  try {
    const raw = basic(); raw.output = { directory: 'nested/a/b' };
    const target = resolve(directory, 'nested/a/b');
    assert.equal(normalizeSpec(raw, directory).output.directory, target);
    assert.equal(existsSync(target), false);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('rejects PNG size below 256', () => {
  const raw = basic(); raw.output = { pngLongestSide: 255 };
  rejects(raw, 'INVALID_PNG_SIZE', 'output.pngLongestSide');
});

test('rejects PNG size above 8192', () => {
  const raw = basic(); raw.output = { pngLongestSide: 8193 };
  rejects(raw, 'INVALID_PNG_SIZE', 'output.pngLongestSide');
});

test('rejects fractional PNG size', () => {
  const raw = basic(); raw.output = { pngLongestSide: 1024.5 };
  rejects(raw, 'INVALID_PNG_SIZE', 'output.pngLongestSide');
});

test('falls back to a safe basename when labels cannot be transliterated', () => {
  const raw = basic(); raw.sets[0].label = '東京'; raw.sets[1].label = '大阪';
  assert.equal(normalizeSpec(raw, projectRoot).output.basename, 'venn-diagram');
});

test('CLI reports validated normalized spec and no artifacts', () => {
  const run = spawnSync(process.execPath, ['scripts/render-venn.mjs', 'tests/fixtures/two-basic.json'], {
    cwd: projectRoot, encoding: 'utf8',
  });
  assert.equal(run.status, 0, run.stderr);
  const report = JSON.parse(run.stdout);
  assert.equal(report.status, 'validated');
  assert.equal(report.spec.output.basename, 'product-engineering-venn');
  assert.deepEqual(report.spec.overlaps, { ab: { text: 'Feasible roadmap', bold: true } });
  assert.equal(report.artifacts, undefined);
});

test('CLI emits one structured JSON error for invalid specification', () => {
  const run = spawnSync(process.execPath, ['scripts/render-venn.mjs', 'tests/fixtures/invalid-four-sets.json'], {
    cwd: projectRoot, encoding: 'utf8',
  });
  assert.equal(run.status, 1);
  assert.equal(run.stdout.trim().split('\n').length, 1);
  assert.deepEqual(JSON.parse(run.stdout).error, {
    code: 'INVALID_SETS', path: 'sets', message: 'sets must contain exactly two or three entries',
  });
});

test('CLI emits one structured JSON error for invalid JSON', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'venn-invalid-json-'));
  try {
    const path = join(directory, 'spec.json');
    await writeFile(path, '{invalid');
    const run = spawnSync(process.execPath, ['scripts/render-venn.mjs', path], {
      cwd: projectRoot, encoding: 'utf8',
    });
    assert.equal(run.status, 1);
    assert.equal(run.stdout.trim().split('\n').length, 1);
    const result = JSON.parse(run.stdout);
    assert.equal(result.status, 'error');
    assert.equal(result.error.code, 'INVALID_JSON');
    assert.equal(result.error.path, '$');
    assert.ok(result.error.message.length > 0);
    assert.ok(run.stderr.length > 0);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
