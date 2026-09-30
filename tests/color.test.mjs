import assert from 'node:assert/strict';
import test from 'node:test';
import {
  chooseGlobalTextColor,
  composite,
  outlineColor,
  parseColor,
  regionBackground,
} from '../src/color.mjs';

test('accepts hex and standard CSS names', () => {
  assert.deepEqual(parseColor('#2563eb'), { r: 37, g: 99, b: 235, a: 1 });
  assert.deepEqual(parseColor('navy'), { r: 0, g: 0, b: 128, a: 1 });
});

test('composites overlapping circles in deterministic draw order', () => {
  const white = parseColor('#ffffff');
  const colors = new Map([
    ['a', parseColor('#2563eb')],
    ['b', parseColor('#f59e0b')],
  ]);
  // Keep channels floating point through A, B, and C composition, then round
  // only the final returned channel; intermediate rounding changes the tuple.
  const ab = regionBackground('ab', colors, 0.55, white);
  assert.deepEqual(ab, { r: 196, g: 163, b: 116, a: 1 });
});

test('composites transparent foreground channels over a background', () => {
  assert.deepEqual(
    composite({ r: 0, g: 20, b: 40, a: 0.5 }, { r: 100, g: 120, b: 140, a: 1 }),
    { r: 50, g: 70, b: 90, a: 1 },
  );
});

test('chooses one color for the worst region and warns below 4.5', () => {
  const result = chooseGlobalTextColor([
    parseColor('#f8fafc'),
    parseColor('#fde68a'),
  ]);
  assert.equal(result.color, '#000000');
  assert.equal(result.warning, false);
  assert.ok(result.minimumContrast >= 4.5);
});

test('uses one winner for a hostile labeled palette and warns', () => {
  const result = chooseGlobalTextColor([parseColor('#707070'), parseColor('#909090')]);
  assert.equal(new Set([result.color]).size, 1);
  assert.equal(result.warning, true);
  assert.ok(Math.abs(result.minimumContrast - 4.24) < 0.01);
});

test('serializes the outline for the default fill exactly', () => {
  assert.equal(
    outlineColor(parseColor('#2563EB')),
    'rgba(24, 64, 153, 0.9)',
  );
});
