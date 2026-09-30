import assert from 'node:assert/strict';
import { readFile, mkdtemp, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { normalizeSpec } from '../src/spec.mjs';
import { layoutDiagram } from '../src/layout.mjs';
import { loadTestFonts } from './helpers.mjs';
import { serializeSvg } from '../src/svg.mjs';
import { reserveOutputPair, atomicWrite } from '../src/output.mjs';
import { CANVAS_PADDING, DIAGRAM_FONT_SIZE, STROKE_WIDTH } from '../src/constants.mjs';

let fontsPromise;
const fonts = () => fontsPromise ??= loadTestFonts();
const fixture = async (name) => JSON.parse(await readFile(new URL(`fixtures/${name}`, import.meta.url), 'utf8'));
async function render(raw) {
  const normalized = normalizeSpec(raw, process.cwd());
  const layout = layoutDiagram(normalized, await fonts());
  assert.notEqual(layout.status, 'needs_revision', JSON.stringify(layout));
  return { svg: serializeSvg(layout, await fonts(), normalized.accessibility), layout };
}
function tags(xml, name) {
  const out = [];
  for (const match of xml.matchAll(/<([A-Za-z][\w:-]*)([^<>]*)>/g)) {
    if (match[1] !== name) continue;
    const attrs = Object.fromEntries([...match[2].matchAll(/([\w:-]+)="([^"]*)"/g)]
      .map((attribute) => [attribute[1], attribute[2]]));
    out.push(attrs);
  }
  return out;
}
const only = (xml, name) => {
  const found = tags(xml, name);
  assert.equal(found.length, 1, name);
  return found[0];
};
async function temporary(run) {
  const directory = await mkdtemp(join(tmpdir(), 'venn-output-'));
  try { await run(directory); } finally { await rm(directory, { recursive: true, force: true }); }
}

test('SVG has ordered white background, equal circles, direct uniform labels, and embedded fonts', async () => {
  const { svg, layout } = await render(await fixture('three-full.json'));
  const root = only(svg, 'svg');
  assert.equal(root.role, 'img');
  assert.equal(root['aria-labelledby'], 'venn-title venn-desc');
  assert.equal(only(svg, 'rect').fill, '#FFFFFF');
  assert.deepEqual(tags(svg, 'circle').map((circle) => circle['data-set']), ['a', 'b', 'c']);
  assert.deepEqual(new Set(tags(svg, 'circle').map((circle) => circle.r)), new Set([String(layout.circles[0].r)]));
  const labels = tags(svg, 'text');
  assert.deepEqual(labels.map((label) => label['data-region']), ['a', 'b', 'c', 'ab', 'ac', 'bc', 'abc']);
  assert.deepEqual(new Set(labels.map((label) => label.fill)).size, 1);
  assert.deepEqual(new Set(labels.map((label) => label['font-size'])), new Set([String(DIAGRAM_FONT_SIZE)]));
  assert.ok(labels.every((label) => label['font-family'] === 'Noto Sans' && label['text-anchor'] === 'middle'));
  assert.equal(labels.find((label) => label['data-region'] === 'abc')['font-weight'], '700');
  assert.ok(labels.filter((label) => label['data-region'] !== 'abc').every((label) => label['font-weight'] === '400'));
  assert.ok(tags(svg, 'tspan').every((part) => !Object.hasOwn(part, 'font-weight')));
  assert.equal(tags(svg, 'line').length + tags(svg, 'polyline').length, 0);
  assert.ok(!svg.includes('marker-end'));
  assert.match(svg, /@font-face\s*\{[^}]*font-weight:\s*400;[^}]*data:font\/ttf;base64,/s);
  assert.match(svg, /@font-face\s*\{[^}]*font-weight:\s*700;[^}]*data:font\/ttf;base64,/s);
  assert.ok(svg.indexOf('<rect') < svg.indexOf('<circle') && svg.lastIndexOf('<circle') < svg.indexOf('<text'));
  for (const name of ['Product', 'Engineering', 'Design', 'Feasible', 'Useful', 'Elegant', 'Great experience']) {
    assert.ok(svg.includes(name), name);
  }
});

test('SVG escapes metadata and visible XML text, preserves explicit line breaks, and omits unnamed overlaps', async () => {
  const raw = { version: 1,
    sets: [{ id: 'a', label: 'R&D <team>\n"Build"' }, { id: 'b', label: "O'Brien > plan" }],
    accessibility: { title: 'R&D <overview>', description: 'Use "A" & \'B\' > C' },
  };
  const { svg } = await render(raw);
  assert.match(svg, /<title id="venn-title">R&amp;D &lt;overview&gt;<\/title>/);
  assert.match(svg, /<desc id="venn-desc">Use &quot;A&quot; &amp; &apos;B&apos; &gt; C<\/desc>/);
  assert.ok(svg.includes('R&amp;D &lt;team&gt;'));
  assert.ok(svg.includes('&quot;Build&quot;'));
  assert.ok(svg.includes('O&apos;Brien'));
  assert.ok(svg.includes('&gt; plan'));
  assert.equal(tags(svg, 'text').length, 2);
  const setAText = [...svg.matchAll(/<text\b([^>]*)>([\s\S]*?)<\/text>/g)]
    .find((match) => match[1].includes('data-region="a"'));
  assert.ok(setAText);
  assert.equal(tags(setAText[2], 'tspan').length, 2);
  assert.deepEqual(tags(svg, 'text').map((part) => part['data-region']), ['a', 'b']);
});

test('SVG honors background, opacity, outline formula, and padded viewBox', async () => {
  const raw = await fixture('two-basic.json');
  raw.style.background = '#123456';
  raw.style.opacity = 0.37;
  const { svg, layout } = await render(raw);
  assert.equal(layout.opacity, 0.37);
  assert.equal(only(svg, 'rect').fill, '#123456');
  assert.equal(only(svg, 'svg').viewBox, `0 0 ${layout.width} ${layout.height}`);
  for (const circle of tags(svg, 'circle')) {
    assert.equal(circle['fill-opacity'], '0.37');
    assert.equal(circle['stroke-width'], String(STROKE_WIDTH));
    assert.equal(circle.stroke, circle['data-set'] === 'a' ? 'rgba(24, 64, 153, 0.9)' : 'rgba(159, 103, 7, 0.9)');
  }
  for (const circle of layout.circles) {
    assert.ok(circle.cx - circle.r - STROKE_WIDTH / 2 >= CANVAS_PADDING);
    assert.ok(circle.cy - circle.r - STROKE_WIDTH / 2 >= CANVAS_PADDING);
    assert.ok(layout.width - circle.cx - circle.r - STROKE_WIDTH / 2 >= CANVAS_PADDING);
    assert.ok(layout.height - circle.cy - circle.r - STROKE_WIDTH / 2 >= CANVAS_PADDING);
  }
});

test('pair reservation skips either existing extension and races safely', async () => temporary(async (directory) => {
  await writeFile(join(directory, 'pair.png'), 'keep');
  const output = { directory, basename: 'pair', overwrite: false };
  const [first, second] = await Promise.all([reserveOutputPair(output), reserveOutputPair(output)]);
  assert.deepEqual(new Set([first.svgPath, second.svgPath]).size, 2);
  assert.deepEqual(new Set([first.pngPath, second.pngPath]).size, 2);
  assert.ok([first.svgPath, second.svgPath].some((path) => path.endsWith('pair-2.svg')));
  assert.equal(await readFile(join(directory, 'pair.png'), 'utf8'), 'keep');
  await atomicWrite(first.svgPath, 'first');
  await atomicWrite(second.svgPath, 'second');
  assert.equal(await readFile(first.svgPath, 'utf8'), 'first');
  assert.equal(await readFile(second.svgPath, 'utf8'), 'second');
  await first.pngReservation.release();
  await second.pngReservation.release();
  await assert.rejects(stat(join(directory, 'pair.svg')), { code: 'ENOENT' });
}));

test('no-overwrite reservation leaves final paths absent until a completed write', async () => temporary(async (directory) => {
  const pair = await reserveOutputPair({ directory, basename: 'open', overwrite: false });
  await assert.rejects(stat(pair.svgPath), { code: 'ENOENT' });
  await assert.rejects(stat(pair.pngPath), { code: 'ENOENT' });
  await atomicWrite(pair.svgPath, 'complete');
  assert.equal(await readFile(pair.svgPath, 'utf8'), 'complete');
  await pair.pngReservation.release();
}));

test('no-overwrite write never replaces or deletes a final file created after reservation', async () => temporary(async (directory) => {
  const pair = await reserveOutputPair({ directory, basename: 'contended', overwrite: false });
  await writeFile(pair.svgPath, 'other writer');
  await assert.rejects(atomicWrite(pair.svgPath, 'our diagram'), { code: 'EEXIST' });
  await pair.svgReservation.release();
  await pair.pngReservation.release();
  assert.equal(await readFile(pair.svgPath, 'utf8'), 'other writer');
  assert.deepEqual((await readdir(directory)).sort(), ['contended.svg']);
}));

test('atomic write preserves existing output on failed temporary write and overwrites only when requested', async () => temporary(async (directory) => {
  const path = join(directory, 'exact.svg');
  await writeFile(path, 'original');
  const ordinary = await reserveOutputPair({ directory, basename: 'exact', overwrite: false });
  assert.ok(ordinary.svgPath.endsWith('exact-2.svg'));
  await ordinary.svgReservation.release();
  await ordinary.pngReservation.release();
  const overwrite = await reserveOutputPair({ directory, basename: 'exact', overwrite: true });
  assert.equal(overwrite.svgPath, path);
  await assert.rejects(atomicWrite(path, undefined));
  assert.equal(await readFile(path, 'utf8'), 'original');
  await atomicWrite(path, 'replacement');
  assert.equal(await readFile(path, 'utf8'), 'replacement');
  assert.deepEqual((await readdir(directory)).sort(), ['exact.svg']);
}));

test('failed reserved write releases its pair lock without touching a neighbor', async () => temporary(async (directory) => {
  const output = await reserveOutputPair({ directory, basename: 'failure', overwrite: false });
  await writeFile(join(directory, 'neighbor.txt'), 'keep');
  await assert.rejects(atomicWrite(output.svgPath, undefined));
  await assert.rejects(stat(output.svgPath), { code: 'ENOENT' });
  assert.equal(await readFile(join(directory, 'neighbor.txt'), 'utf8'), 'keep');
  await output.pngReservation.release();
  assert.deepEqual((await readdir(directory)).sort(), ['neighbor.txt']);
}));

test('releasing an overwrite slot revokes later writes to that path', async () => temporary(async (directory) => {
  const path = join(directory, 'fixed.png');
  await writeFile(path, 'old');
  const pair = await reserveOutputPair({ directory, basename: 'fixed', overwrite: true });
  await pair.pngReservation.release();
  await assert.rejects(atomicWrite(path, 'new'), /not been reserved/);
  assert.equal(await readFile(path, 'utf8'), 'old');
  await pair.svgReservation.release();
}));

test('CLI overwrites a complete SVG and PNG pair', async () => temporary(async (directory) => {
  const raw = await fixture('two-basic.json');
  raw.output.directory = directory;
  raw.output.overwrite = true;
  await writeFile(join(directory, 'product-engineering-venn.png'), 'old PNG');
  const input = join(directory, 'input.json');
  await writeFile(input, JSON.stringify(raw));
  const result = spawnSync(process.execPath, [new URL('../src/main.mjs', import.meta.url).pathname, input], {
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.equal(report.status, 'ok');
  assert.ok(report.svgPath.endsWith('.svg'));
  assert.ok(report.pngPath.endsWith('.png'));
  assert.equal(only(await readFile(report.svgPath, 'utf8'), 'svg').role, 'img');
  assert.deepEqual([...((await readFile(report.pngPath)).subarray(0, 8))],
    [137, 80, 78, 71, 13, 10, 26, 10]);
}));

test('CLI reports an output error when its destination cannot be created', async () => temporary(async (directory) => {
  const blocker = join(directory, 'file');
  await writeFile(blocker, 'not a directory');
  const raw = await fixture('two-basic.json');
  raw.output.directory = join(blocker, 'nested');
  const input = join(directory, 'input.json');
  await writeFile(input, JSON.stringify(raw));
  const result = spawnSync(process.execPath, [new URL('../src/main.mjs', import.meta.url).pathname, input], {
    encoding: 'utf8',
  });
  assert.equal(result.status, 1);
  assert.deepEqual(JSON.parse(result.stdout).error.code, 'OUTPUT_ERROR');
}));
