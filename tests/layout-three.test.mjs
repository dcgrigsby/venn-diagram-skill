import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { normalizeSpec } from '../src/spec.mjs';
import { loadTestFonts } from './helpers.mjs';
import { boxFitsRegion } from '../src/geometry.mjs';
import { layoutDiagram } from '../src/layout.mjs';
import { DIAGRAM_FONT_SIZE, LABEL_PADDING } from '../src/constants.mjs';

let fontsPromise;
function fonts() {
  fontsPromise ??= loadTestFonts();
  return fontsPromise;
}

async function layoutInline(raw) {
  return layoutDiagram(normalizeSpec({ version: 1, ...raw }, process.cwd()), await fonts());
}

async function layoutFixture(name) {
  const raw = JSON.parse(await readFile(new URL(`./fixtures/${name}`, import.meta.url), 'utf8'));
  return layoutInline(raw);
}

function assertThreeSetLayout(layout) {
  assert.notEqual(layout.status, 'needs_revision', JSON.stringify(layout));
  assert.deepEqual(layout.circles.map(({ id }) => id), ['a', 'b', 'c']);
  assert.equal(new Set(layout.circles.map(({ r }) => r)).size, 1);
  for (const label of layout.labels) {
    assert.equal(boxFitsRegion(label.box, label.key, layout.circles, LABEL_PADDING), true,
      label.key);
    assert.equal(label.fontSize, DIAGRAM_FONT_SIZE);
  }
}

test('fits all seven labels into the exact three-set regions', async () => {
  const layout = await layoutFixture('three-full.json');
  assertThreeSetLayout(layout);
  assert.deepEqual(layout.labels.map(({ key }) => key).sort(),
    ['a', 'ab', 'abc', 'ac', 'b', 'bc', 'c']);
  assert.equal(layout.circles[0].r, 200);
  assert.equal(layout.labels.find(({ key }) => key === 'abc').lines.length, 2);
  const [a, b, c] = layout.circles;
  assert.ok(Math.abs((b.cx - a.cx) - Math.hypot(c.cx - a.cx, c.cy - a.cy)) < 1e-8);
  assert.ok(Math.abs((b.cx - a.cx) - Math.hypot(c.cx - b.cx, c.cy - b.cy)) < 1e-8);
});

test('omits unnamed pair overlaps while retaining a named center', async () => {
  const layout = await layoutInline({
    sets: [
      { id: 'a', label: 'Product' },
      { id: 'b', label: 'Engineering' },
      { id: 'c', label: 'Design' },
    ],
    overlaps: {
      ac: { text: 'Useful' },
      abc: { text: 'Great experience' },
    },
  });
  assertThreeSetLayout(layout);
  assert.deepEqual(layout.labels.map(({ key }) => key).sort(), ['a', 'abc', 'ac', 'b', 'c']);
  assert.equal(Object.hasOwn(layout, 'leaderLines'), false);
});

test('bold center changes measured geometry while retaining the shared font size', async () => {
  const raw = {
    sets: [
      { id: 'a', label: 'Product' },
      { id: 'b', label: 'Engineering' },
      { id: 'c', label: 'Design' },
    ],
    overlaps: { abc: { text: 'Great experience' } },
  };
  const regular = await layoutInline(raw);
  const bold = await layoutInline({
    ...raw,
    overlaps: { abc: { text: 'Great experience', bold: true } },
  });
  assertThreeSetLayout(regular);
  assertThreeSetLayout(bold);
  const center = (layout) => layout.labels.find(({ key }) => key === 'abc');
  assert.ok(center(bold).box.width > center(regular).box.width);
  assert.equal(center(bold).fontSize, center(regular).fontSize);
  assert.equal(center(bold).fontSize, bold.labels[0].fontSize);
});

test('identical three-set inputs produce byte-for-byte identical layouts', async () => {
  const first = await layoutFixture('three-full.json');
  const second = await layoutFixture('three-full.json');
  assertThreeSetLayout(first);
  assert.equal(JSON.stringify(first), JSON.stringify(second));
});

test('three-set revision reports attempted radius, ratio, and grid limits', async () => {
  const layout = await layoutInline({
    sets: [
      { id: 'a', label: 'W'.repeat(80) },
      { id: 'b', label: 'Engineering' },
      { id: 'c', label: 'Design' },
    ],
  });
  assert.equal(layout.status, 'needs_revision');
  assert.deepEqual(layout.regions.map(({ key }) => key), ['a']);
  assert.equal(layout.attemptedLimits.minRadius, 200);
  assert.equal(layout.attemptedLimits.maxRadius, 720);
  assert.equal(layout.attemptedLimits.radiusStep, 8);
  assert.equal(layout.attemptedLimits.minRatio, 0.72);
  assert.equal(layout.attemptedLimits.maxRatio, 1.25);
  assert.equal(layout.attemptedLimits.ratioStep, 0.025);
  assert.equal(typeof layout.attemptedLimits.gridRule, 'string');
});

test('large three-set layout searches within one second', async () => {
  const start = performance.now();
  const layout = await layoutInline({
    sets: [
      { id: 'a', label: 'W'.repeat(14) },
      { id: 'b', label: 'W'.repeat(14) },
      { id: 'c', label: 'W'.repeat(14) },
    ],
    overlaps: {
      ab: { text: 'W'.repeat(14) },
      ac: { text: 'W'.repeat(14) },
      bc: { text: 'W'.repeat(14) },
      abc: { text: 'W'.repeat(14), bold: true },
    },
  });
  assertThreeSetLayout(layout);
  assert.ok(layout.circles[0].r >= 400, 'fixture must exercise a large radius');
  assert.ok(performance.now() - start < 1_000, 'three-set search exceeded one second');
});
