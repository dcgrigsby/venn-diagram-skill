import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { normalizeSpec } from '../src/spec.mjs';
import { loadTestFonts } from './helpers.mjs';
import { boxFitsRegion, pointInRegion } from '../src/geometry.mjs';
import { layoutDiagram } from '../src/layout.mjs';
import { CANVAS_PADDING, DIAGRAM_FONT_SIZE, LABEL_PADDING, STROKE_WIDTH } from '../src/constants.mjs';

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

function assertSuccessful(layout) {
  assert.notEqual(layout.status, 'needs_revision', JSON.stringify(layout));
  assert.equal(layout.circles.length, 2);
  assert.equal(layout.circles[0].r, layout.circles[1].r);
}

test('exact region tests reject a rectangle that crosses an excluded circle between its corners', () => {
  const circles = [{ id: 'a', cx: 0, cy: 0, r: 30 }, { id: 'b', cx: 25, cy: 0, r: 5 }];
  assert.equal(pointInRegion({ x: 0, y: 0 }, 'a', circles, 0), true);
  assert.equal(pointInRegion({ x: 25, y: 0 }, 'a', circles, 0), false);
  assert.equal(boxFitsRegion({ x: -12, y: -1, width: 24, height: 2 }, 'a', circles, 0), true);
  const crossing = [{ id: 'a', cx: 0, cy: 0, r: 30 }, { id: 'b', cx: 0, cy: 0, r: 5 }];
  assert.equal(boxFitsRegion({ x: -12, y: -1, width: 24, height: 2 }, 'a', crossing, 0), false);
});

test('fits every label box in its exact two-set boolean region', async () => {
  const layout = await layoutFixture('two-basic.json');
  assertSuccessful(layout);
  assert.deepEqual(layout.labels.map(({ key }) => key).sort(), ['a', 'ab', 'b']);
  for (const label of layout.labels) {
    assert.equal(boxFitsRegion(label.box, label.key, layout.circles, LABEL_PADDING), true, label.key);
    assert.equal(label.fontSize, DIAGRAM_FONT_SIZE);
  }
  const overlap = layout.labels.find(({ key }) => key === 'ab');
  assert.equal(overlap.bold, true);
  assert.equal(overlap.fontSize, layout.labels[0].fontSize);
  assert.equal(pointInRegion({ x: overlap.box.x + overlap.box.width / 2,
    y: overlap.box.y + overlap.box.height / 2 }, 'ab', layout.circles, LABEL_PADDING), true);
  if (process.env.VENN_DEBUG_LAYOUT === '1') process.stderr.write(`${JSON.stringify(layout)}\n`);
});

test('omits an unnamed overlap and invents no text', async () => {
  const layout = await layoutInline({
    sets: [{ id: 'a', label: 'Strategy' }, { id: 'b', label: 'Delivery' }],
    overlaps: {},
  });
  assertSuccessful(layout);
  assert.deepEqual(layout.labels.map(({ key }) => key).sort(), ['a', 'b']);
});

test('expands both circles equally for valid wide labels and keeps stroke plus canvas padding', async () => {
  const basic = await layoutFixture('two-basic.json');
  const wide = await layoutInline({
    sets: [
      { id: 'a', label: 'Collaborative strategic planning' },
      { id: 'b', label: 'Operational capability delivery' },
    ],
    overlaps: { ab: { text: 'A sustainable operating roadmap', bold: true } },
  });
  assertSuccessful(wide);
  assert.ok(wide.circles[0].r > basic.circles[0].r);
  for (const circle of wide.circles) {
    assert.ok(circle.cx - circle.r - STROKE_WIDTH / 2 >= CANVAS_PADDING - 1e-9);
    assert.ok(circle.cy - circle.r - STROKE_WIDTH / 2 >= CANVAS_PADDING - 1e-9);
    assert.ok(layoutBoundsRight(circle) <= wide.width - CANVAS_PADDING + 1e-9);
    assert.ok(circle.cy + circle.r + STROKE_WIDTH / 2 <= wide.height - CANVAS_PADDING + 1e-9);
  }
  for (const label of wide.labels) {
    assert.equal(boxFitsRegion(label.box, label.key, wide.circles, LABEL_PADDING), true, label.key);
  }
});

function layoutBoundsRight(circle) {
  return circle.cx + circle.r + STROKE_WIDTH / 2;
}

test('tries lower-ranked valid wraps when the preferred line arrangement cannot fit', async () => {
  const layout = await layoutInline({
    sets: [{ id: 'a', label: 'Coordinated planning' }, { id: 'b', label: 'Delivery' }],
    overlaps: { ab: { text: 'Shared work' } },
  });
  assertSuccessful(layout);
  assert.equal(layout.circles[0].r, 180);
  assert.ok(layout.labels.find(({ key }) => key === 'a').lines.length > 1);
});

test('returns every limiting region with actionable diagnostics for impossible valid text', async () => {
  const layout = await layoutInline({
    sets: [
      { id: 'a', label: 'W'.repeat(25) },
      { id: 'b', label: 'W'.repeat(25) },
    ],
    overlaps: { ab: { text: 'W'.repeat(25) } },
  });
  assert.equal(layout.status, 'needs_revision');
  assert.deepEqual(layout.regions.map(({ key }) => key).sort(), ['a', 'ab', 'b']);
  for (const region of layout.regions) {
    assert.ok(region.measuredWidth > region.maxFitWidth);
    assert.ok(region.targetChars[0] > 0);
    assert.ok(region.targetChars[1] >= region.targetChars[0]);
  }
  assert.equal(layout.attemptedLimits.maxRadius, 640);
});

test('maps overlong typography to revision while unsupported glyphs stay input errors', async () => {
  const tooLong = await layoutInline({
    sets: [{ id: 'a', label: 'W'.repeat(80) }, { id: 'b', label: 'Delivery' }],
  });
  assert.equal(tooLong.status, 'needs_revision');
  assert.deepEqual(tooLong.regions.map(({ key }) => key), ['a']);
  await assert.rejects(layoutInline({
    sets: [{ id: 'a', label: 'Roadmap 😀' }, { id: 'b', label: 'Delivery' }],
  }), { code: 'UNSUPPORTED_GLYPH' });
});

test('largest valid two-set layout avoids a full-canvas cubic scan', async () => {
  const start = performance.now();
  const layout = await layoutInline({
    sets: [
      { id: 'a', label: 'W'.repeat(14) },
      { id: 'b', label: 'W'.repeat(14) },
    ],
    overlaps: { ab: { text: 'W'.repeat(14), bold: true } },
  });
  assertSuccessful(layout);
  assert.ok(layout.circles[0].r >= 400, 'fixture must exercise large-radius search');
  assert.ok(performance.now() - start < 500,
    'layout must stay below 500 ms to catch a full-canvas cubic search regression');
});
