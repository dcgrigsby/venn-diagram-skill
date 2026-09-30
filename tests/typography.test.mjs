import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import { loadTestFonts } from './helpers.mjs';
import { measureLine, validateGlyphs, wrapCandidates } from '../src/typography.mjs';

test('uses one to three balanced lines without changing font size', async () => {
  const fonts = await loadTestFonts();
  const candidates = wrapCandidates('A sustainable operating roadmap', false, 28, fonts);
  assert.deepEqual(candidates[0].lines, ['A sustainable', 'operating roadmap']);
  assert.equal(candidates[0].fontSize, 28);
  assert.ok(candidates.some((candidate) => candidate.lines.length === 3));
  assert.ok(candidates.every((candidate) => candidate.lines.length <= 3));
});

test('bold changes width but not font size or line height policy', async () => {
  const fonts = await loadTestFonts();
  const regular = wrapCandidates('Shared roadmap', false, 28, fonts)[0];
  const bold = wrapCandidates('Shared roadmap', true, 28, fonts)[0];
  assert.ok(bold.width > regular.width);
  assert.equal(bold.fontSize, regular.fontSize);
  assert.equal(bold.lineHeight, regular.lineHeight);
});

test('preserves explicit line breaks as one fixed candidate', async () => {
  const fonts = await loadTestFonts();
  for (const lines of [
    ['First line', 'Second line'],
    ['First', 'Second', 'Third'],
  ]) {
    const candidates = wrapCandidates(lines.join('\n'), false, 28, fonts);
    assert.equal(candidates.length, 1);
    assert.deepEqual(candidates[0].lines, lines);
  }
});

test('rejects four explicit lines and an overwide unbroken token', async () => {
  const fonts = await loadTestFonts();
  for (const label of [
    'a\nb\nc\nd',
    'a\nb\nc\n',
    'SupercalifragilisticexpialidociousSupercalifragilisticexpialidocious',
  ]) {
    assert.throws(() => wrapCandidates(label, false, 28, fonts), { code: 'LABEL_TOO_LONG' });
  }
});

test('validates Greek and Cyrillic using bundled Noto Sans glyphs', async () => {
  const fonts = await loadTestFonts();
  for (const font of [fonts.regular, fonts.bold]) {
    assert.deepEqual(validateGlyphs('Ελληνικά Кириллица', font), []);
  }
});

test('reports unsupported emoji with a stable diagnostic', async () => {
  const fonts = await loadTestFonts();
  assert.deepEqual(validateGlyphs('Roadmap 😀', fonts.regular), ['😀']);
  assert.throws(() => wrapCandidates('Roadmap 😀', false, 28, fonts), { code: 'UNSUPPORTED_GLYPH' });
});

test('measures XML metacharacters as visible glyphs', async () => {
  const fonts = await loadTestFonts();
  const visible = '<A&B>';
  const measured = measureLine(visible, false, 28, fonts);
  const expected = fonts.regular.getAdvanceWidth(visible, 28, { kerning: true }) * 1.02 + 1;
  assert.equal(measured, expected);
  assert.notEqual(measured, measureLine('&lt;A&amp;B&gt;', false, 28, fonts));
});

test('built renderer loads both fonts outside the development package tree', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'venn-typography-'));
  try {
    const renderer = join(directory, 'render-venn.mjs');
    await copyFile(new URL('../scripts/render-venn.mjs', import.meta.url), renderer);
    const probe = [
      "process.argv = [process.execPath, 'render-venn.mjs', '--version'];",
      'const { loadFonts, measureLine } = await import(process.env.RENDERER_URL);',
      'const fonts = await loadFonts({ regular: new URL(process.env.REGULAR_URL), bold: new URL(process.env.BOLD_URL) });',
      "process.stdout.write(JSON.stringify({ count: fonts.buffers.length, width: measureLine('Roadmap', true, 28, fonts) }) + '\\n');",
    ].join('\n');
    const run = spawnSync(process.execPath, ['--input-type=module', '-e', probe], {
      encoding: 'utf8',
      env: {
        ...process.env,
        RENDERER_URL: pathToFileURL(renderer).href,
        REGULAR_URL: new URL('../vendor/fonts/NotoSans-Regular.ttf', import.meta.url).href,
        BOLD_URL: new URL('../vendor/fonts/NotoSans-Bold.ttf', import.meta.url).href,
      },
    });
    assert.equal(run.status, 0, run.stderr);
    const result = JSON.parse(run.stdout.trim().split('\n').at(-1));
    assert.equal(result.count, 2);
    assert.ok(result.width > 0);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
