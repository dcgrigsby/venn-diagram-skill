import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { access, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { decodePng, pixelAt, pngPixelHash } from './helpers.mjs';

const renderer = fileURLToPath(new URL('../scripts/render-venn.mjs', import.meta.url));
const sourceCli = new URL('../src/cli.mjs', import.meta.url).href;
const fixture = async (name) => JSON.parse(await readFile(new URL(`fixtures/${name}`, import.meta.url)));

async function inTemp(run) {
  const directory = await mkdtemp(join(tmpdir(), 'venn-built-e2e-'));
  try { await run(directory); } finally { await rm(directory, { recursive: true, force: true }); }
}

async function runBuiltRenderer(name, directory, change = () => {}) {
  const raw = await fixture(name);
  raw.output ??= {};
  raw.output.directory = join(directory, 'output');
  change(raw);
  const input = join(directory, 'input.json');
  await writeFile(input, JSON.stringify(raw));
  const run = spawnSync(process.execPath, [renderer, input], { cwd: directory, encoding: 'utf8' });
  return { run, raw, input, report: JSON.parse(run.stdout) };
}

function bounds(image, background) {
  let minX = image.width;
  let minY = image.height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      if (pixelAt(image, x, y).some((value, index) => value !== background[index])) {
        minX = Math.min(minX, x); maxX = Math.max(maxX, x);
        minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      }
    }
  }
  return { minX, minY, maxX, maxY };
}

test('built renderer creates matching SVG and 1600px PNG from an unrelated cwd', async () => inTemp(async (directory) => {
  const { run, report } = await runBuiltRenderer('two-basic.json', directory);
  assert.equal(run.status, 0, run.stderr);
  assert.equal(report.status, 'ok');
  assert.equal(report.svgPath, join(directory, 'output', 'product-engineering-venn.svg'));
  assert.equal(report.pngPath, join(directory, 'output', 'product-engineering-venn.png'));
  const svg = await readFile(report.svgPath, 'utf8');
  const image = decodePng(await readFile(report.pngPath));
  assert.match(svg, /<svg\b/);
  const svgDimensions = /<svg\b[^>]*\bwidth="([\d.]+)"\s+height="([\d.]+)"/.exec(svg);
  assert.ok(svgDimensions);
  assert.deepEqual(report.dimensions.svg,
    { width: Number(svgDimensions[1]), height: Number(svgDimensions[2]) });
  assert.deepEqual(report.dimensions.png, { width: image.width, height: image.height });
  assert.equal(Math.max(image.width, image.height), 1600);
  assert.ok(Math.abs(image.width / image.height
    - report.dimensions.svg.width / report.dimensions.svg.height) <= 1 / Math.min(image.width, image.height));
  for (const [x, y] of [[0, 0], [image.width - 1, 0], [0, image.height - 1], [image.width - 1, image.height - 1]]) {
    assert.deepEqual(pixelAt(image, x, y), [255, 255, 255, 255]);
  }
  const occupied = bounds(image, [255, 255, 255, 255]);
  assert.ok(occupied.minX > 25 && occupied.minY > 25, JSON.stringify(occupied));
  assert.ok(occupied.maxX < image.width - 25 && occupied.maxY < image.height - 25);
  assert.ok(report.geometry.radius > 0 && report.geometry.centerDistanceRatio > 0);
  assert.equal(report.labels.length, 3);
  for (const label of report.labels) {
    assert.ok(Array.isArray(label.lines) && label.lines.length > 0);
    assert.equal(typeof label.bold, 'boolean');
    const scaleX = image.width / report.dimensions.svg.width;
    const scaleY = image.height / report.dimensions.svg.height;
    const x0 = Math.floor((label.box.x + 2) * scaleX);
    const x1 = Math.ceil((label.box.x + label.box.width - 2) * scaleX);
    const y0 = Math.floor((label.box.y + 2) * scaleY);
    const y1 = Math.ceil((label.box.y + label.box.height - 2) * scaleY);
    const text = report.textColor === '#000000' ? [0, 0, 0, 255] : [255, 255, 255, 255];
    let exactTextPixels = 0;
    for (let y = y0; y < y1; y += 1) for (let x = x0; x < x1; x += 1) {
      if (pixelAt(image, x, y).every((value, index) => value === text[index])) exactTextPixels += 1;
    }
    assert.ok(exactTextPixels > 3, `${label.key}: ${exactTextPixels} text pixels`);
  }
}));

test('PNG corners use the selected background color and a taller SVG fits its height', async () => inTemp(async (directory) => {
  const { run, report } = await runBuiltRenderer('three-full.json', directory, (raw) => {
    raw.style = { background: '#123456' };
  });
  assert.equal(run.status, 0, run.stderr);
  const image = decodePng(await readFile(report.pngPath));
  const svg = await readFile(report.svgPath, 'utf8');
  const svgDimensions = /<svg\b[^>]*\bwidth="([\d.]+)"\s+height="([\d.]+)"/.exec(svg);
  assert.deepEqual(report.dimensions.svg,
    { width: Number(svgDimensions[1]), height: Number(svgDimensions[2]) });
  assert.equal(Math.max(image.width, image.height), 1600);
  assert.deepEqual(pixelAt(image, 0, 0), [18, 52, 86, 255]);
  assert.deepEqual(pixelAt(image, image.width - 1, image.height - 1), [18, 52, 86, 255]);
  assert.ok(Math.abs(image.width / image.height
    - report.dimensions.svg.width / report.dimensions.svg.height) <= 1 / Math.min(image.width, image.height));
}));

test('warning is exit zero and uses one text color for labeled regions', async () => inTemp(async (directory) => {
  const { run, report } = await runBuiltRenderer('two-basic.json', directory, (raw) => {
    raw.style = { colors: { a: '#707070', b: '#909090' }, opacity: 1 };
  });
  assert.equal(run.status, 0, run.stderr);
  assert.equal(report.status, 'warning');
  assert.ok(report.minimumContrast < 4.5);
  assert.ok(report.warnings.length > 0);
  const fills = [...(await readFile(report.svgPath, 'utf8')).matchAll(/<text\b[^>]*\bfill="([^"]+)"/g)]
    .map((match) => match[1]);
  assert.equal(new Set(fills).size, 1);
  assert.equal(fills[0], report.textColor);
  await access(report.pngPath);
}));

test('unplaceable label exits two with diagnostics and no final pair', async () => inTemp(async (directory) => {
  const { run, report } = await runBuiltRenderer('two-basic.json', directory, (raw) => {
    raw.overlaps.ab.text = 'Extraordinarilyunbreakableunplaceableword'.repeat(8);
  });
  assert.equal(run.status, 2, run.stderr);
  assert.equal(report.status, 'needs_revision');
  assert.ok(report.regions.some((region) => region.key === 'ab' && region.maxFitWidth > 0));
  assert.deepEqual(await readdir(join(directory, 'output')).catch(() => []), []);
}));

test('invalid spec and unsupported glyph exit one without final images', async () => inTemp(async (directory) => {
  for (const change of [(raw) => { raw.version = 2; },
    (raw) => { raw.sets[0].label = 'Product 😀'; }]) {
    const { run, report } = await runBuiltRenderer('two-basic.json', directory, change);
    assert.equal(run.status, 1);
    assert.equal(report.status, 'error');
    assert.deepEqual(await readdir(join(directory, 'output')).catch(() => []), []);
  }
}));

test('built CLI reports an unsupported overlap glyph with its label path', async () => inTemp(async (directory) => {
  const { run, report } = await runBuiltRenderer('two-basic.json', directory, (raw) => {
    raw.overlaps.ab.text = 'Viable 😀';
  });
  assert.equal(run.status, 1, run.stderr);
  assert.equal(report.status, 'error');
  assert.equal(report.error.code, 'UNSUPPORTED_GLYPH');
  assert.equal(report.error.path, 'overlaps.ab.text');
  assert.match(report.error.message, /😀/u);
  assert.doesNotMatch(report.error.message, /unable to read specification/i);
  assert.deepEqual(await readdir(join(directory, 'output')).catch(() => []), []);
}));

test('corrupt injected WASM keeps valid SVG, cleans PNG reservation, and rerun chooses -2', async () => inTemp(async (directory) => {
  const raw = await fixture('two-basic.json');
  raw.output.directory = join(directory, 'output');
  const input = join(directory, 'input.json');
  const corrupt = join(directory, 'bad.wasm');
  await writeFile(input, JSON.stringify(raw));
  await writeFile(corrupt, 'bad wasm');
  const code = `import { main } from ${JSON.stringify(sourceCli)}; process.exitCode = await main([process.argv[1]], { wasmUrl: process.argv[2] });`;
  const failed = spawnSync(process.execPath, ['--input-type=module', '-e', code, input, corrupt], {
    cwd: directory, encoding: 'utf8',
  });
  assert.equal(failed.status, 1, failed.stderr);
  const failure = JSON.parse(failed.stdout);
  assert.equal(failure.status, 'error');
  assert.equal(failure.complete, false);
  assert.match(await readFile(failure.svgPath, 'utf8'), /<svg\b/);
  await assert.rejects(access(failure.pngPath), { code: 'ENOENT' });
  assert.deepEqual((await readdir(join(directory, 'output'))).sort(), ['product-engineering-venn.svg']);
  const recovered = spawnSync(process.execPath, [renderer, input], { cwd: directory, encoding: 'utf8' });
  assert.equal(recovered.status, 0, recovered.stderr);
  const report = JSON.parse(recovered.stdout);
  assert.match(report.svgPath, /-2\.svg$/);
  assert.match(report.pngPath, /-2\.png$/);
  await access(report.svgPath);
  await access(report.pngPath);
}));

test('explicit overwrite replaces both images only after successful PNG rendering', async () => inTemp(async (directory) => {
  const first = await runBuiltRenderer('two-basic.json', directory, (raw) => { raw.output.overwrite = true; });
  assert.equal(first.run.status, 0, first.run.stderr);
  const originalSvg = await readFile(first.report.svgPath);
  const originalPng = await readFile(first.report.pngPath);
  const raw = first.raw;
  raw.sets[0].label = 'Strategy';
  await writeFile(first.input, JSON.stringify(raw));
  const corrupt = join(directory, 'bad.wasm');
  await writeFile(corrupt, 'bad wasm');
  const code = `import { main } from ${JSON.stringify(sourceCli)}; process.exitCode = await main([process.argv[1]], { wasmUrl: process.argv[2] });`;
  const failed = spawnSync(process.execPath, ['--input-type=module', '-e', code, first.input, corrupt], {
    cwd: directory, encoding: 'utf8',
  });
  assert.equal(failed.status, 1, failed.stderr);
  assert.deepEqual(await readFile(first.report.svgPath), originalSvg);
  assert.deepEqual(await readFile(first.report.pngPath), originalPng);
  const succeeded = spawnSync(process.execPath, [renderer, first.input], { cwd: directory, encoding: 'utf8' });
  assert.equal(succeeded.status, 0, succeeded.stderr);
  const report = JSON.parse(succeeded.stdout);
  assert.equal(report.svgPath, first.report.svgPath);
  assert.equal(report.pngPath, first.report.pngPath);
  assert.notDeepEqual(await readFile(report.svgPath), originalSvg);
  assert.notDeepEqual(await readFile(report.pngPath), originalPng);
}));

for (const [fixtureName, goldenName] of [
  ['two-basic.json', 'two-basic.sha256'], ['three-full.json', 'three-full.sha256'],
]) {
  test(`${fixtureName} decoded pixels match reviewed golden`, async () => inTemp(async (directory) => {
    const { run, report } = await runBuiltRenderer(fixtureName, directory);
    assert.equal(run.status, 0, run.stderr);
    const actual = pngPixelHash(decodePng(await readFile(report.pngPath)));
    const expected = (await readFile(new URL(`expected/${goldenName}`, import.meta.url), 'utf8')).trim();
    assert.equal(actual, expected);
  }));
}
