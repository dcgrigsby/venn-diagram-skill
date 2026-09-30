# Venn Diagram Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and publish a zero-post-install-dependency agent skill that turns natural-language requests into deterministic two-set or three-set conceptual Venn diagrams in matching SVG and PNG formats.

**Architecture:** `SKILL.md` converts the user's request into a versioned JSON specification. Focused source modules validate that specification, choose one diagram-wide text color, measure bundled Noto Sans fonts, fit equal-radius circles around direct region labels, serialize an accessible SVG, and rasterize that same SVG through a vendored resvg WebAssembly binary. Development dependencies are bundled at build time into `scripts/render-venn.mjs`; installed users run only committed files.

**Tech Stack:** Node.js 20+, ECMAScript modules, Node's built-in test runner, esbuild 0.28.2, opentype.js 2.0.0, color-name 2.1.1, @resvg/resvg-wasm 2.6.2, Noto Sans 2.015 Regular and Bold, Agent Skills `SKILL.md` format.

**Spec:** `docs/superpowers/specs/2026-09-29-venn-diagram-skill-design.md`

## Global Constraints

- The repository, skill folder, and frontmatter name are `venn-diagram-skill`.
- Runtime support is Node.js 20 or newer.
- Runtime performs no network requests and installs no packages.
- Version one supports exactly two or three conceptual sets; circle area never encodes quantity.
- All circles in a diagram have the same radius.
- Set labels and named overlap labels sit directly inside their regions; unnamed overlaps remain empty.
- Every label uses Noto Sans at one diagram-wide font size and one diagram-wide black-or-white text color.
- Geometry and typography share constants from `src/constants.mjs`: `DIAGRAM_FONT_SIZE = 28`, `LINE_HEIGHT_RATIO = 1.2`, `LABEL_PADDING = 8`, `TEXT_WIDTH_SAFETY = 1.02`, `TEXT_WIDTH_SAFETY_PX = 1`, `STROKE_WIDTH = 3`, `CANVAS_PADDING = 24`, and `MAX_LINE_EM = 14`.
- Labels are regular by default; an explicitly selected whole label may be bold. Partial-label formatting is unsupported.
- Automatic wrapping uses at most three lines and never truncates or independently shrinks a label.
- The default canvas is white; alternate solid backgrounds are allowed when requested.
- The default PNG longest side is exactly 1600 pixels and matches the SVG geometry.
- Existing output files are never silently overwritten.
- Output directories are created recursively. A requested PNG longest side must be an integer from 256 through 8192.
- The renderer emits structured `ok`, `warning`, `needs_revision`, or `error` results and never claims complete success if either requested artifact is missing.
- Stage and commit only explicit paths. Confirm before dependency installation, lockfile regeneration, or whole-repository formatting.

---

## Planned File Map

- `SKILL.md` — agent-neutral request interpretation and renderer workflow.
- `agents/openai.yaml` — optional Codex UI metadata; no runtime dependency declaration.
- `src/cli.mjs` — CLI parsing, orchestration, exit codes, and JSON reporting.
- `src/main.mjs` — unconditional executable entry point that invokes the exported CLI.
- `src/constants.mjs` — shared geometry and typography constants.
- `src/spec.mjs` — versioned input normalization and validation.
- `src/color.mjs` — CSS color parsing, alpha composition, luminance, and global text-color selection.
- `src/typography.mjs` — font loading, glyph validation, text measurement, and one-to-three-line wrapping.
- `src/geometry.mjs` — circle membership, region membership, label-box fit, and candidate scoring primitives.
- `src/layout.mjs` — deterministic two-set and three-set equal-radius layout search.
- `src/svg.mjs` — accessible SVG generation with embedded Regular and Bold font faces.
- `src/png.mjs` — one-time resvg WebAssembly initialization and PNG conversion.
- `src/output.mjs` — collision-safe output allocation and atomic writes.
- `scripts/build.mjs` — development build that bundles source and JavaScript dependencies into the checked-in runtime.
- `scripts/render-venn.mjs` — generated, executable, zero-post-install renderer shipped to skill users.
- `scripts/update-goldens.mjs` — explicit visual-fixture updater; never runs during ordinary tests.
- `vendor/resvg/index_bg.wasm` — pinned @resvg/resvg-wasm 2.6.2 runtime.
- `vendor/fonts/NotoSans-Regular.ttf` — pinned Noto Sans 2.015 Regular.
- `vendor/fonts/NotoSans-Bold.ttf` — pinned Noto Sans 2.015 Bold.
- `vendor/fonts/OFL.txt` — Noto Sans license.
- `licenses/THIRD_PARTY_NOTICES.md` — versions, source URLs, hashes, and license texts/links for vendored and bundled dependencies.
- `tests/helpers.mjs` — fixture creation, SVG parsing helpers, PNG header/pixel decoding, and temporary-directory helpers.
- `tests/build.test.mjs` — runtime-bundle and vendored-asset checks.
- `tests/color.test.mjs` — color parsing, composition, and contrast tests.
- `tests/spec.test.mjs` — schema defaults and validation tests.
- `tests/typography.test.mjs` — glyph, measurement, wrapping, and bold tests.
- `tests/layout-two.test.mjs` — two-set region-fit behavior.
- `tests/layout-three.test.mjs` — three-set sparse/full region-fit behavior.
- `tests/svg-output.test.mjs` — SVG, accessibility, XML escaping, filenames, and atomic-write tests.
- `tests/e2e.test.mjs` — built CLI, PNG, exit-code, unrelated-working-directory, and visual-regression tests.
- `tests/fixtures/*.json` — versioned valid and invalid renderer inputs.
- `tests/expected/*.sha256` — decoded-pixel golden hashes for representative diagrams.
- `evals/evals.json` — realistic agent-level skill evaluation prompts and assertions.
- `package.json` / `package-lock.json` — development-only dependency graph and local verification commands.
- `.gitignore` — development dependencies, evaluation results, and temporary artifacts.
- `Makefile` — memorable local `build`, `test`, `verify`, and `install-smoke` entry points.
- `README.md` — installation status, examples, disclaimer, supported scope, and development commands.

---

### Task 1: Establish the Reproducible Build and Vendored Runtime

**Files:**
- Create: `package.json`
- Create: `package-lock.json`
- Create: `Makefile`
- Create: `.gitignore`
- Create: `src/cli.mjs`
- Create: `src/main.mjs`
- Create: `src/constants.mjs`
- Create: `scripts/build.mjs`
- Create: `scripts/render-venn.mjs`
- Create: `vendor/resvg/index_bg.wasm`
- Create: `vendor/fonts/NotoSans-Regular.ttf`
- Create: `vendor/fonts/NotoSans-Bold.ttf`
- Create: `vendor/fonts/OFL.txt`
- Create: `licenses/THIRD_PARTY_NOTICES.md`
- Create: `tests/build.test.mjs`

**Interfaces:**
- Produces: executable `scripts/render-venn.mjs`; `node scripts/render-venn.mjs --version` prints one JSON object and exits 0.
- Produces: pinned runtime assets at paths later modules resolve relative to `import.meta.url`.
- Produces: `npm run build`, `npm test`, and `npm run verify` development commands.

- [ ] **Step 1: Record the pre-install state and request the required dependency-install confirmation**

Run:

```bash
git status --porcelain=v1
node --version
npm --version
```

Expected: the working tree contains only changes made for the current task, and Node reports version 20 or newer. Before `npm install`, explicitly ask for confirmation because it creates `node_modules` and regenerates `package-lock.json`.

- [ ] **Step 2: Write the build-contract test first**

Create `tests/build.test.mjs` with these initial assertions:

```js
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
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
```

- [ ] **Step 3: Run the test and verify the expected failure**

Run: `node --test tests/build.test.mjs`

Expected: FAIL because `package.json`, the renderer, and vendored assets do not exist.

- [ ] **Step 4: Add the development-only dependency graph**

Create `package.json`:

```json
{
  "name": "venn-diagram-skill-dev",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "engines": { "node": ">=20" },
  "scripts": {
    "build": "node scripts/build.mjs",
    "test": "node --test tests/",
    "verify": "npm run build && npm test"
  },
  "dependencies": {},
  "devDependencies": {
    "@resvg/resvg-wasm": "2.6.2",
    "color-name": "2.1.1",
    "esbuild": "0.28.2",
    "opentype.js": "2.0.0"
  }
}
```

After confirmation, run `npm install` and commit the generated `package-lock.json`. Verify `npm ls --depth=0` shows the four exact versions above.

- [ ] **Step 5: Vendor the pinned binary and fonts**

Copy the resvg binary from the exact installed package:

```bash
mkdir -p vendor/resvg vendor/fonts licenses
cp node_modules/@resvg/resvg-wasm/index_bg.wasm vendor/resvg/index_bg.wasm
```

Download the official Noto Sans 2.015 release into a temporary directory, list the archive first to verify the expected paths, then extract only the hinted Regular and Bold fonts plus the license. Prefer `gh`; if it is unavailable, use the exact GitHub release asset URL with `curl --fail --location`:

```bash
asset_tmp=$(mktemp -d /tmp/venn-assets.XXXXXX)
gh release download NotoSans-v2.015 \
  --repo notofonts/latin-greek-cyrillic \
  --pattern 'NotoSans-v2.015.zip' \
  --dir "$asset_tmp"
unzip -l "$asset_tmp/NotoSans-v2.015.zip" | rg 'NotoSans/(hinted/ttf/NotoSans-(Regular|Bold)\.ttf)|OFL\.txt'
unzip -j "$asset_tmp/NotoSans-v2.015.zip" \
  'NotoSans/hinted/ttf/NotoSans-Regular.ttf' \
  'NotoSans/hinted/ttf/NotoSans-Bold.ttf' \
  'OFL.txt' \
  -d "$asset_tmp/extracted"
cp "$asset_tmp/extracted/NotoSans-Regular.ttf" vendor/fonts/NotoSans-Regular.ttf
cp "$asset_tmp/extracted/NotoSans-Bold.ttf" vendor/fonts/NotoSans-Bold.ttf
cp "$asset_tmp/extracted/OFL.txt" vendor/fonts/OFL.txt
```

Record SHA-256 hashes and the upstream URLs/versions in `licenses/THIRD_PARTY_NOTICES.md`. Include @resvg/resvg-wasm's MPL-2.0 notice and bundled Rust-crate notices from its `v2.6.2` source tag, opentype.js's MIT notice, color-name's MIT notice, esbuild's MIT development-only notice, and Noto Sans's OFL-1.1 notice. The resvg npm tarball does not carry every required notice, so retrieve license material from the pinned upstream tag and record that URL. Do not copy licenses from memory.

- [ ] **Step 6: Add the minimal source entry point and build**

Create `src/constants.mjs` with the shared constants named in Global Constraints. Create `src/cli.mjs` as an importable module:

```js
export const RENDERER_INFO = Object.freeze({
  name: 'venn-diagram-skill',
  rendererVersion: '0.1.0',
  schemaVersion: 1,
});

export async function main(argv = process.argv.slice(2)) {
  if (argv.length === 1 && argv[0] === '--version') {
    process.stdout.write(`${JSON.stringify(RENDERER_INFO)}\n`);
    return 0;
  }
  process.stderr.write('Usage: render-venn.mjs --version | <spec.json>\n');
  return 1;
}
```

Create `src/main.mjs` as the executable-only entry, which remains correct through relative paths and symlinks:

```js
import { main } from './cli.mjs';

process.exitCode = await main();
```

Create `scripts/build.mjs`:

```js
import { chmod, copyFile, mkdir } from 'node:fs/promises';
import { build } from 'esbuild';

await mkdir('scripts', { recursive: true });
await mkdir('vendor/resvg', { recursive: true });
await copyFile(
  'node_modules/@resvg/resvg-wasm/index_bg.wasm',
  'vendor/resvg/index_bg.wasm',
);
await build({
  entryPoints: ['src/main.mjs'],
  outfile: 'scripts/render-venn.mjs',
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  banner: { js: '#!/usr/bin/env node' },
  legalComments: 'eof',
  sourcemap: false,
});
await chmod('scripts/render-venn.mjs', 0o755);
```

Create a `Makefile` whose `build`, `test`, and `verify` targets call the matching npm scripts without adding clean or destructive targets.

Create `.gitignore` with `node_modules/`, `eval-results/`, and local temporary-output patterns. Extend `tests/build.test.mjs` to execute a symlink to the built CLI, rebuild into a temporary path and byte-compare it with the committed bundle, and compare the committed WASM SHA-256 with the installed pinned package. These checks make the checked-in runtime reproducible and complete.

- [ ] **Step 7: Build and run the focused test**

Run:

```bash
npm run build
node --test tests/build.test.mjs
```

Expected: PASS. Then temporarily rename `node_modules`, rerun `node scripts/render-venn.mjs --version`, and restore `node_modules`; the runtime command must still pass.

- [ ] **Step 8: Commit the build foundation**

```bash
git add .gitignore package.json package-lock.json Makefile src/constants.mjs src/cli.mjs src/main.mjs scripts/build.mjs scripts/render-venn.mjs vendor/resvg/index_bg.wasm vendor/fonts/NotoSans-Regular.ttf vendor/fonts/NotoSans-Bold.ttf vendor/fonts/OFL.txt licenses/THIRD_PARTY_NOTICES.md tests/build.test.mjs
git diff --cached --name-only
git diff --cached --check
git commit -m "build: add self-contained renderer foundation" -- .gitignore package.json package-lock.json Makefile src/constants.mjs src/cli.mjs src/main.mjs scripts/build.mjs scripts/render-venn.mjs vendor/resvg/index_bg.wasm vendor/fonts/NotoSans-Regular.ttf vendor/fonts/NotoSans-Bold.ttf vendor/fonts/OFL.txt licenses/THIRD_PARTY_NOTICES.md tests/build.test.mjs
```

---

### Task 2: Implement Color Parsing, Composition, and One Global Text Color

**Files:**
- Create: `src/color.mjs`
- Create: `tests/color.test.mjs`
- Modify: `src/cli.mjs`
- Regenerate: `scripts/render-venn.mjs`

**Interfaces:**
- Produces: `parseColor(value: string): { r: number, g: number, b: number, a: number }`.
- Produces: `composite(foreground: Rgba, background: Rgba): Rgba`.
- Produces: `regionBackground(regionKey: string, circleColors: Map<string, Rgba>, opacity: number, background: Rgba): Rgba` using draw order A, B, then C.
- Produces: `chooseGlobalTextColor(regionBackgrounds: Rgba[]): { color: '#000000' | '#FFFFFF', minimumContrast: number, warning: boolean }`.
- Produces: `outlineColor(fill: Rgba): string`, a 35% linear mix of the opaque fill with black, serialized with opacity `0.9` and shared width `STROKE_WIDTH`.

- [ ] **Step 1: Write failing color tests**

Create `tests/color.test.mjs` with exact cases:

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  chooseGlobalTextColor,
  composite,
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
  const ab = regionBackground('ab', colors, 0.55, white);
  assert.deepEqual(ab, { r: 196, g: 163, b: 116, a: 1 });
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
  const result = chooseGlobalTextColor([parseColor('#777777'), parseColor('#888888')]);
  assert.equal(new Set([result.color]).size, 1);
  assert.equal(result.warning, true);
});
```

Document the alpha-composition arithmetic in a test comment: retain floating-point channels through every A/B/C layer and round only the final returned channel, so a future color change cannot silently rewrite the expected tuple. Add an exact outline-color test for a default fill.

- [ ] **Step 2: Verify failure**

Run: `node --test tests/color.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `src/color.mjs`.

- [ ] **Step 3: Implement the minimal color module**

Import the complete CSS name table from `color-name` so esbuild includes it in the checked-in runtime. Implement sRGB alpha composition and WCAG relative luminance. Region keys identify which fills contribute: `a`, `b`, `c`, `ab`, `ac`, `bc`, or `abc`. Composite the selected circle fills over the solid background in A/B/C drawing order.

The contrast selection algorithm must be:

```js
const candidates = ['#000000', '#FFFFFF'];
const scored = candidates.map((color) => ({
  color,
  minimumContrast: Math.min(
    ...regionBackgrounds.map((background) => contrastRatio(parseColor(color), background)),
  ),
}));
scored.sort((left, right) =>
  right.minimumContrast - left.minimumContrast || left.color.localeCompare(right.color),
);
return { ...scored[0], warning: scored[0].minimumContrast < 4.5 };
```

Reject transparent and functional CSS forms (`rgb()`, `hsl()`) in version one; accepted values are `#RGB`, `#RRGGBB`, and standard CSS names. This keeps the runtime deterministic while satisfying the natural-language workflow because the agent can normalize richer descriptions to hex. The CLI must pass only backgrounds for regions that actually have labels into `chooseGlobalTextColor`; empty regions do not constrain the diagram-wide choice.

- [ ] **Step 4: Run color tests and the full suite**

Run:

```bash
node --test tests/color.test.mjs
npm run build
npm test
```

Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/color.mjs tests/color.test.mjs scripts/render-venn.mjs
git diff --cached --name-only
git diff --cached --check
git commit -m "feat: add deterministic color and contrast rules" -- src/color.mjs tests/color.test.mjs scripts/render-venn.mjs
```

---

### Task 3: Define and Validate the Versioned Renderer Specification

**Files:**
- Create: `src/spec.mjs`
- Create: `tests/spec.test.mjs`
- Create: `tests/fixtures/two-basic.json`
- Create: `tests/fixtures/three-full.json`
- Create: `tests/fixtures/invalid-four-sets.json`
- Modify: `src/cli.mjs`
- Regenerate: `scripts/render-venn.mjs`

**Interfaces:**
- Produces: `normalizeSpec(raw: unknown, cwd: string): NormalizedSpec`.
- `NormalizedSpec.sets`: two or three `{ id: 'a'|'b'|'c', label: string, bold: boolean }` objects.
- `NormalizedSpec.overlaps`: `Map<'ab'|'ac'|'bc'|'abc', { text: string, bold: boolean }>`.
- `NormalizedSpec.style`: normalized hex colors, opacity, background.
- `NormalizedSpec.accessibility`: optional user title/description, with deterministic derived defaults.
- `NormalizedSpec.output`: absolute directory, sanitized basename, `pngLongestSide`, and `overwrite`.
- Produces: `SpecError` with stable `code`, `path`, and `message` fields.

- [ ] **Step 1: Add representative fixtures**

`tests/fixtures/two-basic.json`:

```json
{
  "version": 1,
  "sets": [
    { "id": "a", "label": "Product" },
    { "id": "b", "label": "Engineering" }
  ],
  "overlaps": {
    "ab": { "text": "Feasible roadmap", "bold": true }
  },
  "style": {
    "colors": { "a": "#2563eb", "b": "#f59e0b" },
    "opacity": 0.55,
    "background": "#ffffff"
  },
  "output": {
    "directory": ".",
    "basename": "product-engineering-venn",
    "pngLongestSide": 1600,
    "overwrite": false
  }
}
```

`three-full.json` must contain A/B/C set labels plus `ab`, `ac`, `bc`, and `abc`; mark exactly one full label bold. `invalid-four-sets.json` must contain four set entries and no other invalidity.

- [ ] **Step 2: Write failing schema tests**

Cover defaults and every hard boundary:

```js
test('normalizes defaults without inventing overlaps', () => {
  const normalized = normalizeSpec({
    version: 1,
    sets: [{ id: 'a', label: 'Product' }, { id: 'b', label: 'Engineering' }],
    overlaps: {},
  }, '/tmp/output');
  assert.equal(normalized.style.background, '#FFFFFF');
  assert.equal(normalized.style.opacity, 0.55);
  assert.equal(normalized.output.pngLongestSide, 1600);
  assert.equal(normalized.overlaps.size, 0);
});

test('rejects partial rich text', () => {
  assert.throws(() => normalizeSpec({
    version: 1,
    sets: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }],
    overlaps: { ab: { text: ['partial', 'bold'] } },
  }, process.cwd()), { code: 'INVALID_OVERLAP' });
});

test('rejects an overlap key that cannot exist for two sets', () => {
  assert.throws(() => normalizeSpec({
    version: 1,
    sets: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }],
    overlaps: { ac: { text: 'Impossible' } },
  }, process.cwd()), { code: 'INVALID_OVERLAP' });
});
```

Also test: unknown schema version, duplicate/misordered IDs, empty labels, whitespace normalization, more than three lines supplied with explicit newlines, opacity outside `(0, 1]`, unsupported color syntax, non-solid backgrounds, unsafe basename characters, Windows reserved device basenames, default/explicit accessibility text, output-directory creation, and PNG size outside the integer range 256–8192.

- [ ] **Step 3: Verify failure**

Run: `node --test tests/spec.test.mjs`

Expected: FAIL because `src/spec.mjs` does not exist.

- [ ] **Step 4: Implement normalization and stable errors**

Use these defaults exactly:

```js
export const DEFAULTS = Object.freeze({
  colors: Object.freeze({ a: '#2563EB', b: '#F59E0B', c: '#14B8A6' }),
  opacity: 0.55,
  background: '#FFFFFF',
  pngLongestSide: 1600,
  overwrite: false,
});
```

Normalize set IDs to the exact sequences `['a','b']` or `['a','b','c']`. Valid overlap keys are `ab` for two sets and `ab`, `ac`, `bc`, `abc` for three. Trim labels, collapse internal horizontal whitespace, preserve explicit newlines, and keep the user's wording unchanged. Convert missing `bold` to `false`; only literal booleans are valid.

Infer a slug from the ordered set labels, falling back to `venn-diagram` if transliteration yields nothing. Explicit basenames must match `^[A-Za-z0-9][A-Za-z0-9._-]{0,80}$`, must not contain `..`, and must not case-insensitively equal a Windows reserved device name (`CON`, `PRN`, `AUX`, `NUL`, `COM1`–`COM9`, or `LPT1`–`LPT9`, with or without an extension). Resolve `output.directory` against `cwd` and create it recursively during output preparation.

Accept optional `accessibility.title` and `accessibility.description` strings. If omitted, derive title `Venn diagram: <A>, <B>[, <C>]` and a concise description enumerating each named set and named overlap; unnamed regions are not described.

- [ ] **Step 5: Wire the CLI to read one JSON file**

Extend `main()` so `node scripts/render-venn.mjs spec.json` reads, parses, and normalizes the file. For this task, print a temporary `validated` report containing the normalized spec but do not create images yet. Return exit code 1 for invalid JSON/specification and print one JSON error object to stdout; send human-readable debugging detail to stderr only.

- [ ] **Step 6: Run focused and full tests**

Run:

```bash
node --test tests/spec.test.mjs
npm run build
npm test
node scripts/render-venn.mjs tests/fixtures/two-basic.json
```

Expected: tests PASS and the manual command prints one parseable JSON object.

- [ ] **Step 7: Commit**

```bash
git add src/spec.mjs src/cli.mjs tests/spec.test.mjs tests/fixtures/two-basic.json tests/fixtures/three-full.json tests/fixtures/invalid-four-sets.json scripts/render-venn.mjs
git diff --cached --name-only
git diff --cached --check
git commit -m "feat: validate versioned Venn specifications" -- src/spec.mjs src/cli.mjs tests/spec.test.mjs tests/fixtures/two-basic.json tests/fixtures/three-full.json tests/fixtures/invalid-four-sets.json scripts/render-venn.mjs
```

---

### Task 4: Add Deterministic Typography, Wrapping, and Whole-Label Bold

**Files:**
- Create: `src/typography.mjs`
- Create: `tests/helpers.mjs`
- Create: `tests/typography.test.mjs`
- Modify: `scripts/build.mjs`
- Regenerate: `scripts/render-venn.mjs`

**Interfaces:**
- Produces: `loadFonts({ regular: URL, bold: URL }): Promise<{ regular: Font, bold: Font, buffers: Uint8Array[] }>`.
- Produces: `validateGlyphs(text: string, font: Font): string[]` returning unsupported Unicode characters.
- Produces: `measureLine(text: string, bold: boolean, fontSize: number, fonts): number`.
- Produces: `wrapCandidates(text: string, bold: boolean, fontSize: number, fonts): Array<{ lines: string[], width: number, height: number, fontSize: number, lineHeight: number }>` in deterministic best-first order, or `TypographyError('LABEL_TOO_LONG')`.

- [ ] **Step 1: Write failing typography tests**

Tests must assert:

```js
test('uses one to three balanced lines without changing font size', async () => {
  const fonts = await loadTestFonts();
  const wrapped = wrapCandidates('A sustainable operating roadmap', false, 28, fonts)[0];
  assert.deepEqual(wrapped.lines, ['A sustainable', 'operating roadmap']);
  assert.equal(wrapped.fontSize, 28);
});

test('bold changes width but not font size or line height policy', async () => {
  const fonts = await loadTestFonts();
  const regular = wrapCandidates('Shared roadmap', false, 28, fonts)[0];
  const bold = wrapCandidates('Shared roadmap', true, 28, fonts)[0];
  assert.ok(bold.width > regular.width);
  assert.equal(bold.fontSize, regular.fontSize);
  assert.equal(bold.lineHeight, regular.lineHeight);
});
```

Also test: explicit one-to-three newlines are preserved; four explicit lines fail; long unbroken tokens fail; Greek and Cyrillic samples pass glyph validation; emoji produces a stable `UNSUPPORTED_GLYPH` diagnostic; XML metacharacters measure as their visible characters.

- [ ] **Step 2: Verify failure**

Run: `node --test tests/typography.test.mjs`

Expected: FAIL because `src/typography.mjs` does not exist.

- [ ] **Step 3: Implement font loading and measurement**

Convert each Node buffer to an exact ArrayBuffer slice with `buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)`, then pass it to `opentype.parse()`. Use Noto Sans Regular for `bold:false` and Bold for `bold:true`. Measure with `font.getAdvanceWidth(line, fontSize, { kerning: true })`.

Use `lineHeight = fontSize * LINE_HEIGHT_RATIO`. Apply a measurement safety allowance of `measuredWidth * TEXT_WIDTH_SAFETY + TEXT_WIDTH_SAFETY_PX` because opentype and resvg shaping can differ slightly. Automatic wrapping enumerates every contiguous partition of words into one, two, or three non-empty lines. Reject candidates wider than `fontSize * MAX_LINE_EM`.

Rank candidates by this exact tuple, ascending: `(maximum line width, sum of squared deviations from mean line width, line count, negative phrase-boundary score, lines joined with "\n")`. A boundary earns one phrase point when the preceding token ends in `,`, `;`, `:`, `/`, `&`, or `-`; this is only a deterministic tie-breaker after fit and balance. Return all valid candidates in that order so layout may try a slightly less-preferred wrap when the best text-only wrap does not fit a curved region. Honor explicit newlines as one fixed candidate instead of repartitioning them.

Return stable diagnostics rather than substituting a system font.

- [ ] **Step 4: Run tests and rebuild**

Run:

```bash
node --test tests/typography.test.mjs
npm run build
npm test
```

Expected: all PASS and the built renderer contains opentype.js code but has no runtime import from `node_modules`.

- [ ] **Step 5: Commit**

```bash
git add src/typography.mjs tests/helpers.mjs tests/typography.test.mjs scripts/build.mjs scripts/render-venn.mjs
git diff --cached --name-only
git diff --cached --check
git commit -m "feat: add deterministic label typography" -- src/typography.mjs tests/helpers.mjs tests/typography.test.mjs scripts/build.mjs scripts/render-venn.mjs
```

---

### Task 5: Implement Equal-Radius Two-Set Layout

**Files:**
- Create: `src/geometry.mjs`
- Create: `src/layout.mjs`
- Create: `tests/layout-two.test.mjs`
- Regenerate: `scripts/render-venn.mjs`

**Interfaces:**
- Produces: `pointInRegion(point, regionKey, circles, margin): boolean`.
- Produces: `boxFitsRegion(box, regionKey, circles, padding): boolean` using exact rectangle-versus-circle distance tests.
- Produces: `layoutDiagram(normalizedSpec, typography): LayoutResult`.
- `LayoutResult`: `{ width, height, circles, labels, background, warnings }`; text color and contrast are computed after geometry from labeled regions only.

- [ ] **Step 1: Write failing two-set layout tests**

Assert these invariants rather than brittle absolute coordinates:

```js
test('fits all two-set label boxes in the correct boolean regions', async () => {
  const layout = await layoutFixture('two-basic.json');
  assert.equal(layout.circles.length, 2);
  assert.equal(layout.circles[0].r, layout.circles[1].r);
  assert.deepEqual(layout.labels.map(({ key }) => key).sort(), ['a', 'ab', 'b']);
  for (const label of layout.labels) {
    assert.equal(boxFitsRegion(label.box, label.key, layout.circles, 8), true, label.key);
  }
});

test('omits an unnamed overlap and does not invent text', async () => {
  const layout = await layoutInline({
    sets: [{ id: 'a', label: 'Strategy' }, { id: 'b', label: 'Delivery' }],
    overlaps: {},
  });
  assert.deepEqual(layout.labels.map(({ key }) => key).sort(), ['a', 'b']);
});
```

Also assert: long but valid labels increase both radii equally; bold `ab` keeps the same font size as regular A/B; no label box touches a stroke; output bounds include all circle strokes and safety padding; impossible content returns `needs_revision` with the limiting region key.

- [ ] **Step 2: Verify failure**

Run: `node --test tests/layout-two.test.mjs`

Expected: FAIL because geometry/layout modules do not exist.

- [ ] **Step 3: Implement boolean-region geometry**

Represent a circle as `{ id, cx, cy, r, fill, stroke }`. A region key's letters are required circles; other diagram circles are excluded circles. A point fits when it is at least `margin` inside every required circle and at least `margin` outside every excluded circle.

For an axis-aligned label box, `boxFitsRegion` requires all four corners to be inside every required circle at radius `r - margin`. For every excluded circle, clamp its center to the nearest point on the rectangle and require that closest-point distance to be at least `r + margin`. These are exact containment/disjointness tests for a rectangle and circle; edge-midpoint sampling is not sufficient.

- [ ] **Step 4: Implement bounded two-set search**

Search radii from 180 through 640 in 8-pixel increments. For each radius, search center-distance-to-radius ratios from 0.80 through 1.45 by integer index (`ratio = 0.80 + index * 0.025`) to avoid floating-point accumulation. For each region, scan candidate label centers only inside that boolean region's analytical bounding box on a deterministic grid of `max(4, r / 40)` pixels and choose the fitting point nearest the region's preferred anchor:

- `a`: leftmost exclusive-lobe center.
- `b`: rightmost exclusive-lobe center.
- `ab`: lens center.

Try each wrap candidate in its typography order. Score feasible layouts for one radius by canvas area first, deviation from a `1.05 * r` center distance second, wrap-rank vector third, and lexical coordinate order fourth. Stop after the first radius that has any feasible layout, then return that radius's unique lowest score. Add `CANVAS_PADDING` plus half `STROKE_WIDTH` around the final circle bounds.

If no candidate fits, return `needs_revision` with `{ regions: [{ key, measuredWidth, maxFitWidth, targetChars: [min, max] }], attemptedLimits }`; include every limiting label region, not merely the widest label. Derive the target character range from the measured average glyph width and maximum fit width. Map typography `LABEL_TOO_LONG` into the same exit-2 result; `UNSUPPORTED_GLYPH` remains an exit-1 input error. Do not shrink the shared font size.

Add a focused performance assertion that the largest valid two-set fixture completes layout within 500 ms on the supported Node 20 test environment; keep the bound loose enough for CI variance but strict enough to catch an accidental full-canvas cubic scan.

- [ ] **Step 5: Run tests and inspect one computed layout report**

Run:

```bash
node --test tests/layout-two.test.mjs
npm run build
npm test
```

Expected: all PASS. Log one layout only under an explicit test debug flag and confirm circle radii are equal and the `ab` label center lies in both circles.

- [ ] **Step 6: Commit**

```bash
git add src/geometry.mjs src/layout.mjs tests/layout-two.test.mjs scripts/render-venn.mjs
git diff --cached --name-only
git diff --cached --check
git commit -m "feat: lay out two-set Venn diagrams" -- src/geometry.mjs src/layout.mjs tests/layout-two.test.mjs scripts/render-venn.mjs
```

---

### Task 6: Extend the Layout Search to Three Sets and Seven Regions

**Files:**
- Modify: `src/geometry.mjs`
- Modify: `src/layout.mjs`
- Create: `tests/layout-three.test.mjs`
- Regenerate: `scripts/render-venn.mjs`

**Interfaces:**
- Extends `layoutDiagram()` for set IDs A/B/C and optional overlaps AB/AC/BC/ABC without changing `LayoutResult`.

- [ ] **Step 1: Write failing three-set tests**

Use `tests/fixtures/three-full.json` and assert:

```js
test('fits all seven labels into the correct three-set regions', async () => {
  const layout = await layoutFixture('three-full.json');
  assert.equal(new Set(layout.circles.map(({ r }) => r)).size, 1);
  assert.deepEqual(
    layout.labels.map(({ key }) => key).sort(),
    ['a', 'ab', 'abc', 'ac', 'b', 'bc', 'c'],
  );
  for (const label of layout.labels) {
    assert.equal(boxFitsRegion(label.box, label.key, layout.circles, 8), true, label.key);
  }
});
```

Add sparse-overlap tests that omit AB and BC while retaining ABC, proving absent overlaps do not produce labels or leader lines. Add a test that a bold center label affects geometry but not the diagram-wide font size. Add determinism: two identical runs deep-equal exactly.

- [ ] **Step 2: Verify failure**

Run: `node --test tests/layout-three.test.mjs`

Expected: FAIL with a supported-set-count or missing-layout error.

- [ ] **Step 3: Implement triangular geometry and preferred anchors**

Place equal-radius centers at the vertices of an equilateral triangle centered at the origin:

```js
const centers = [
  { id: 'a', cx: -distance / 2, cy: -distance / (2 * Math.sqrt(3)) },
  { id: 'b', cx:  distance / 2, cy: -distance / (2 * Math.sqrt(3)) },
  { id: 'c', cx: 0,             cy:  distance / Math.sqrt(3) },
];
```

Preferred anchors point away from the diagram centroid for A/B/C, away from the excluded third circle for AB/AC/BC, and to the triangle centroid for ABC. Reuse the grid-based label-box fitting rather than hard-coding final coordinates.

Search radii 200 through 720 in 8-pixel increments and center-distance-to-radius ratios by integer index from 0.72 through the final value not exceeding 1.25 in 0.025 increments. For each radius, search only each region's analytical bounding box; stop at the first radius with any feasible layout. Within it, score by canvas area, deviation from the default ratio `0.92`, wrap-rank vector, then lexical coordinates. Keep the iteration count bounded, add a 1-second largest-fixture performance assertion on supported Node 20, and include attempted radius/ratio/grid limits in `needs_revision` diagnostics.

- [ ] **Step 4: Run focused, full, and determinism tests**

Run:

```bash
node --test tests/layout-three.test.mjs
npm run build
npm test
```

Expected: all PASS in two consecutive runs with identical serialized layout JSON.

- [ ] **Step 5: Commit**

```bash
git add src/geometry.mjs src/layout.mjs tests/layout-three.test.mjs scripts/render-venn.mjs
git diff --cached --name-only
git diff --cached --check
git commit -m "feat: lay out three-set Venn diagrams" -- src/geometry.mjs src/layout.mjs tests/layout-three.test.mjs scripts/render-venn.mjs
```

---

### Task 7: Serialize Accessible SVG and Write Outputs Safely

**Files:**
- Create: `src/svg.mjs`
- Create: `src/output.mjs`
- Create: `tests/svg-output.test.mjs`
- Modify: `src/cli.mjs`
- Regenerate: `scripts/render-venn.mjs`

**Interfaces:**
- Produces: `serializeSvg(layout, fonts, accessibility): string`.
- Produces: `reserveOutputPair(output): Promise<{ svgPath, pngPath, svgReservation, pngReservation }>` using exclusive creation.
- Produces: `atomicWrite(path, bytes): Promise<void>`.

- [ ] **Step 1: Write failing SVG and output tests**

Tests must verify:

```js
test('writes a white background and direct labels with one text color', async () => {
  const svg = await svgForFixture('three-full.json');
  assert.match(svg, /<rect[^>]+fill="#FFFFFF"/);
  assert.doesNotMatch(svg, /<line|<polyline|marker-end/);
  const colors = [...svg.matchAll(/<text[^>]+fill="(#[0-9A-F]{6})"/g)].map((m) => m[1]);
  assert.equal(new Set(colors).size, 1);
});

test('bold applies to the full requested label only', async () => {
  const svg = await svgForFixture('two-basic.json');
  assert.match(svg, /data-region="ab"[^>]+font-weight="700"/);
  assert.match(svg, /data-region="a"[^>]+font-weight="400"/);
  assert.doesNotMatch(svg, /<tspan[^>]+font-weight=/);
});
```

Also verify: embedded Regular and Bold `@font-face` data URLs; `font-family="Noto Sans"` on every text element; one shared font size; explicit or derived `<title>` and `<desc>` include all named labels; XML-sensitive text is escaped; explicit line breaks become `<tspan>` rows; omitted overlaps are absent; alternate solid backgrounds render exactly; configured opacity is exact; outlines follow the specified mix/opacity/width formula; viewBox tightly includes circles and padding; collision suffixes reserve both `.svg` and `.png`; overwrite happens only with `overwrite:true`; failed temp writes do not damage existing outputs. Parse tags and attributes in tests instead of depending on regex attribute order.

- [ ] **Step 2: Verify failure**

Run: `node --test tests/svg-output.test.mjs`

Expected: FAIL because SVG/output modules do not exist.

- [ ] **Step 3: Implement SVG serialization**

Generate elements in this order: white/selected background rect, A/B/C circles, then labels. Embed both TTF files once in `<style>` as base64 `@font-face` rules for family `Noto Sans`, weights 400 and 700. Put `font-family="Noto Sans"` on every `<text>`. Add `role="img"`, `aria-labelledby`, `<title>`, and `<desc>` using normalized accessibility fields.

Each label is one `<text data-region="...">` with `font-weight="400"` or `700`, `text-anchor="middle"`, and baselines derived from the selected font's ascender/descender metrics; its line rows are `<tspan x="..." dy="...">` without independent styling. Escape `&`, `<`, `>`, `"`, and `'` in metadata and visible text. Serialize coordinates to at most three decimal places to keep diffs stable.

- [ ] **Step 4: Implement collision-safe atomic output**

Create the output directory recursively. When `overwrite:false`, choose `basename`, `basename-2`, `basename-3`, and so on and reserve both final names with `open(path, 'wx')`. If the second reservation collides—including a case-insensitive filesystem collision—close and remove only the first placeholder and try the next suffix. Render into uniquely named temporary files in the target directory, `fsync`, close, then replace only placeholders owned by this process. If PNG generation fails, remove its reserved placeholder but retain the valid SVG. When `overwrite:true`, write both temps first and replace only the exact requested pair. Tests must race two reservation attempts and prove neither clobbers the other.

For this task, the CLI writes SVG, reports PNG as pending, and returns a non-success incomplete status. Do not claim an `ok` result until Task 8 adds PNG.

- [ ] **Step 5: Run tests and manually inspect the SVG**

Run:

```bash
node --test tests/svg-output.test.mjs
npm run build
npm test
```

Generate the full three-set fixture into a temporary directory and open the SVG. Confirm white background, equal circles, correct region membership, direct labels, uniform font size/color, and only the requested label bold.

- [ ] **Step 6: Commit**

```bash
git add src/svg.mjs src/output.mjs src/cli.mjs tests/svg-output.test.mjs scripts/render-venn.mjs
git diff --cached --name-only
git diff --cached --check
git commit -m "feat: generate accessible Venn SVG files" -- src/svg.mjs src/output.mjs src/cli.mjs tests/svg-output.test.mjs scripts/render-venn.mjs
```

---

### Task 8: Render Matching PNG and Complete the End-to-End CLI

**Files:**
- Create: `src/png.mjs`
- Modify: `tests/helpers.mjs`
- Create: `tests/e2e.test.mjs`
- Create: `tests/expected/two-basic.sha256`
- Create: `tests/expected/three-full.sha256`
- Create: `scripts/update-goldens.mjs`
- Modify: `src/cli.mjs`
- Modify: `scripts/build.mjs`
- Regenerate: `scripts/render-venn.mjs`

**Interfaces:**
- Produces: `renderPng(svg: string, fonts: Uint8Array[], longestSide: number): Promise<Uint8Array>`.
- CLI success report: `{ status, svgPath, pngPath, dimensions: { svg: { width, height }, png: { width, height } }, geometry: { radius, centerDistanceRatio }, textColor, minimumContrast, warnings, labels }`.
- Exit codes: 0 for `ok`/`warning`, 2 for `needs_revision`, 1 for `error` or incomplete output.

- [ ] **Step 1: Write failing PNG and CLI tests**

Tests must invoke the built renderer from a temporary working directory unrelated to the repository:

```js
test('built renderer creates matching SVG and 1600px PNG from another cwd', async () => {
  const run = await runBuiltRenderer('two-basic.json', { cwd: unrelatedTempDir });
  assert.equal(run.status, 0, run.stderr);
  const report = JSON.parse(run.stdout);
  assert.equal(report.status, 'ok');
  assert.equal(Math.max(report.dimensions.png.width, report.dimensions.png.height), 1600);
  await assertWhitePngCorner(report.pngPath);
  await access(report.svgPath);
});
```

Also test: warning remains exit 0 and uses one text color chosen from labeled regions only; impossible label returns exit 2 with limiting-region diagnostics and no final image pair; invalid spec/unsupported glyph returns exit 1; corrupt injected WASM makes PNG failure preserve the valid SVG and remove the PNG reservation; rerunning creates `-2`; explicit overwrite replaces both; SVG and PNG aspect ratios match within one pixel; decoded PNG corners match the selected background; non-background pixels occupy expected bounds; text pixels occur inside every labeled box, proving bundled-font text rendered.

- [ ] **Step 2: Verify failure**

Run: `node --test tests/e2e.test.mjs`

Expected: FAIL because PNG support does not exist.

- [ ] **Step 3: Implement resvg initialization and rendering**

Bundle `Resvg` and `initWasm` from `@resvg/resvg-wasm` into the runtime. Resolve `../vendor/resvg/index_bg.wasm` relative to the built `scripts/render-venn.mjs`, read it once, and memoize initialization:

```js
let initialized;
export async function ensureResvg(wasmUrl) {
  initialized ??= readFile(wasmUrl).then((bytes) => initWasm(bytes));
  return initialized;
}
```

Choose `fitTo.mode` from the longer SVG axis (`'width'` or `'height'`) and set `fitTo.value` to `pngLongestSide`. Construct `Resvg` with exactly:

```js
new Resvg(svg, {
  fitTo: { mode, value: pngLongestSide },
  font: {
    fontBuffers: [regularBuffer, boldBuffer],
    defaultFontFamily: 'Noto Sans',
  },
});
```

Do not load system fonts. Assert returned PNG dimensions before writing. Always call `free()` for the rendered image and renderer in `finally`. Permit dependency injection of the WASM URL into `renderPng` so the failure-path test can provide a corrupt temporary file without a production-only environment switch.

- [ ] **Step 4: Complete orchestration and reports**

The CLI sequence is: read → normalize → load fonts → wrap labels → layout → choose global text color → serialize SVG → reserve paired names → atomically write SVG → render PNG → atomically write PNG → emit one JSON report. If PNG fails, keep SVG, omit/clean any temporary PNG, return `error`, and state `complete:false`.

Reports include applied lines and `bold` for every label. They never include base64 font data, raw WASM errors, or user file contents beyond visible labels.

- [ ] **Step 5: Add explicit golden generation and comparison**

Extend `tests/helpers.mjs` with a dependency-free PNG decoder for non-interlaced, 8-bit RGBA output: parse chunks, inflate IDAT with `node:zlib`, implement PNG filters 0–4, and return width, height, and raw RGBA bytes. `scripts/update-goldens.mjs` renders the two canonical fixtures, hashes IHDR dimensions plus raw RGBA bytes, and writes the two `.sha256` files. Ordinary tests recompute and compare; they never update fixtures automatically. Run the updater once, inspect both images visually, then commit the reviewed hashes.

- [ ] **Step 6: Run closed-loop verification**

Run:

```bash
npm run build
node scripts/update-goldens.mjs
npm test
npm run verify
```

Open both SVG and PNG outputs for each fixture. Confirm the formats match visually, backgrounds are white, no text crosses circle boundaries, all circles are equal within each diagram, the same text color is used throughout, and bold appears only where requested.

- [ ] **Step 7: Commit**

```bash
git add src/png.mjs src/cli.mjs scripts/build.mjs scripts/render-venn.mjs scripts/update-goldens.mjs tests/helpers.mjs tests/e2e.test.mjs tests/expected/two-basic.sha256 tests/expected/three-full.sha256
git diff --cached --name-only
git diff --cached --check
git commit -m "feat: render matching Venn PNG files" -- src/png.mjs src/cli.mjs scripts/build.mjs scripts/render-venn.mjs scripts/update-goldens.mjs tests/helpers.mjs tests/e2e.test.mjs tests/expected/two-basic.sha256 tests/expected/three-full.sha256
```

---

### Task 9: Author the Cross-Agent Skill and Installation Smoke Test

**Files:**
- Create: `SKILL.md`
- Create: `agents/openai.yaml`
- Create: `evals/evals.json`
- Modify: `README.md`
- Modify: `Makefile`
- Create: `tests/install-smoke.mjs`
- Create: `tests/skill.test.mjs`

**Interfaces:**
- Produces: discoverable skill name `venn-diagram-skill` with implicit invocation enabled.
- Produces: agent workflow that writes schema v1 JSON and invokes the renderer by resolving a path relative to `SKILL.md`.
- Produces: `make install-smoke` isolated local installation test.

- [ ] **Step 1: Write the failing installation smoke test**

`tests/install-smoke.mjs` creates a clean temporary source export from an explicit allowlist of tracked and newly created project files (never the working directory itself), runs the pinned Skills CLI from another temporary directory, and asserts the installed copy contains `SKILL.md`, `scripts/render-venn.mjs`, both fonts, and the WASM file but no `node_modules`. It then invokes the installed renderer from a second unrelated temporary directory and verifies both artifacts. The test requires network access for the pinned Skills CLI package and skips with an explicit reason only when the release-gate caller opts out of network tests.

Use project scope and `--copy`; never alter global agent directories:

```js
const install = spawnSync(
  'npx',
  ['--yes', 'skills@1.7.0', 'add', cleanExport, '--copy', '-y', '-a', 'codex'],
  { cwd: installProject, encoding: 'utf8', shell: process.platform === 'win32' },
);
assert.equal(install.status, 0, install.stderr);
```

Locate the installed `SKILL.md` under the temporary project rather than assuming an undocumented agent directory. Fail if more than one `venn-diagram-skill` installation is found.

- [ ] **Step 2: Verify failure**

Run: `node --test tests/install-smoke.mjs`

Expected: FAIL because `SKILL.md` does not exist.

- [ ] **Step 3: Write concise cross-agent instructions**

Use this frontmatter exactly:

```yaml
---
name: venn-diagram-skill
description: Create or revise conceptual two-set and three-set Venn diagrams from natural-language requests, producing matching SVG and PNG files. Use when the user asks for a Venn diagram, overlapping circles, a shared-versus-exclusive set visual, or a comparison organized by overlaps. Do not use for area-proportional charts, Euler or UpSet diagrams, or four or more sets.
---
```

The body must instruct the agent to:

1. Determine two or three set labels and only the overlaps the user actually named or wants developed.
2. Help develop missing content, state material semantic assumptions, and avoid implying quantities.
3. Translate color descriptions to validated CSS names or hex; default to blue/amber/teal, 0.55 opacity, and white background.
4. Apply `bold:true` only to an entire label the user explicitly asked to emphasize.
5. Write schema-v1 JSON to the requested output directory or a secure temporary location.
6. Resolve `scripts/render-venn.mjs` relative to the loaded `SKILL.md`; never assume the current working directory and never freehand SVG.
7. Invoke Node with the resolved absolute renderer path as its first argument and the absolute JSON specification path as its second argument, then parse the single JSON report.
8. On `needs_revision`, propose a shorter label that preserves meaning; do not shrink or truncate.
9. Inspect both outputs, report warnings, and return both paths. Never claim completion if one is missing.

Include the exact schema example from Task 3 and one two-set and one sparse three-set natural-language example. Keep implementation mechanics out of the frontmatter description.

- [ ] **Step 4: Add Codex UI metadata**

Create `agents/openai.yaml`:

```yaml
interface:
  display_name: "Venn Diagrams"
  short_description: "Create labeled two- and three-set Venn diagrams"
  brand_color: "#2563EB"
  default_prompt: "Use $venn-diagram-skill to create a conceptual Venn diagram from my description."
policy:
  allow_implicit_invocation: true
```

- [ ] **Step 5: Add realistic skill evaluations**

Create `evals/evals.json` with six prompts and expected outcomes:

1. Infer one useful overlap for Product and Engineering, then create both files.
2. Render all seven regions for Product/Engineering/Operations with custom colors and opacity.
3. Bold only the three-way overlap label.
4. Omit two unspecified pairwise overlaps without inventing labels.
5. Trigger `needs_revision` for an intentionally unwieldy center phrase and propose a concise alternative.
6. Use a deliberately hostile light/dark palette, proving the renderer chooses one global black-or-white winner, evaluates only labeled regions, and emits the expected contrast warning.

Each eval includes artifact assertions: SVG and PNG exist; requested solid background; exactly two or three equal-radius circles; correct region keys; shared font size and text color; requested whole-label bold only; PNG longest side 1600.

- [ ] **Step 6: Update human documentation and remove the development block only after verification**

Update `README.md` with the live installation command, supported Node floor, two natural-language examples, output contract, disclaimer, and development commands. Retain the “IN DEVELOPMENT — NOT READY TO INSTALL” block until Tasks 9 and 10 pass; its removal belongs to Task 10's release commit.

- [ ] **Step 7: Run skill and install validation**

Add an in-repository frontmatter validator test that parses `SKILL.md`, verifies the exact allowed keys, name, description length, and body presence. This is the portable acceptance gate. Then run:

```bash
npm run build
npm test
node --test tests/install-smoke.mjs
```

Expected: all PASS; the installed copy renders both formats without `node_modules`. As an optional supplemental local check, if the executing environment exposes the system skill-creator validator, resolve its path without hard-coding a user directory and run it too; absence does not fail this public project.

- [ ] **Step 8: Commit**

```bash
git add SKILL.md agents/openai.yaml evals/evals.json README.md Makefile tests/install-smoke.mjs tests/skill.test.mjs
git diff --cached --name-only
git diff --cached --check
git commit -m "feat: add installable Venn diagram skill" -- SKILL.md agents/openai.yaml evals/evals.json README.md Makefile tests/install-smoke.mjs tests/skill.test.mjs
```

---

### Task 10: Run Cross-Agent Evals, Final Review, and Release Gate

**Files:**
- Modify: `SKILL.md` only if observed behavior warrants a narrow correction.
- Modify: `evals/evals.json` only to correct non-discriminating or invalid assertions.
- Modify: `README.md` to remove the development block after all release checks pass.
- Create: `eval-results/iteration-1/` locally, but keep it gitignored unless the user asks to publish benchmark artifacts.

**Interfaces:**
- Produces: verified public `main` suitable for `npx skills add dcgrigsby/venn-diagram-skill -g`.
- Produces: human-reviewed sample SVG/PNG outputs and an evaluation summary.

- [ ] **Step 1: Run isolated with-skill and no-skill evaluations**

Follow the skill-creator evaluation workflow using `evals/evals.json`. Run each prompt with the installed skill and a no-skill baseline in isolated temporary workspaces. Use available local agents without allowing them to modify the repository; outputs belong only in their assigned eval directories.

Grade programmatic assertions with scripts, not visual guessing. Save timing and token information when the harness exposes it. Generate the standard eval viewer rather than custom HTML and ask the user to review the rendered outputs. The six evals include the contrast-warning case.

- [ ] **Step 2: Apply only evidence-backed corrections**

If an agent freehands SVG, tighten the renderer-invocation instruction. If content inference changes meaning, tighten assumption disclosure. If all agents already invoke the renderer and outputs meet the contract, record explicit “no findings” and do not lengthen `SKILL.md`.

Rebuild after any source change and rerun all six evals into `iteration-2`; do not overwrite iteration 1.

- [ ] **Step 3: Run the full local release gate**

Because `npm ci` replaces `node_modules` and can disrupt another session, refresh/list agent locks and obtain the required confirmation immediately before this step. Run the gate under Node 20 specifically (through an already installed Node 20 runtime; do not install a runtime without separate confirmation):

```bash
npm ci
npm run verify
node --test tests/install-smoke.mjs
git diff --check
git status --porcelain=v1
```

Expected: all commands PASS. The in-repo frontmatter validation is part of `npm test`. Also assert the clean skill export has no `node_modules`, the checked-in renderer rebuild is byte-identical, the vendored WASM hash matches the pinned package, and the exported skill size stays below a documented 15 MB budget. `git status` shows only intentional README/SKILL/eval corrections.

- [ ] **Step 4: Commit and push the tested release candidate**

Refresh/list the agent-lock registry. Stage only the files actually changed by the eval corrections and gate, inspect the staged names, commit them with explicit pathspecs, and push `main`. Do not remove the development notice yet.

- [ ] **Step 5: Verify the public install command in a clean temporary project**

Create a new temporary project and install the just-pushed revision through the public route:

```bash
npx --yes skills@1.7.0 add dcgrigsby/venn-diagram-skill --copy -y -a codex
```

Invoke the installed renderer using `tests/fixtures/two-basic.json` copied outside the repository. Confirm no `npm install`, browser, Python package, ImageMagick, or system font is required.

- [ ] **Step 6: Remove the development notice and publish the release-ready state**

Delete only the `IN DEVELOPMENT — NOT READY TO INSTALL` section from `README.md`; keep the proportionate disclaimer. Re-run `git diff --check` and `npm run verify`.

Before committing, list the agent-lock registry again. Stage explicit paths, inspect `git diff --cached --name-only`, and commit only files changed by this task:

```bash
git add README.md SKILL.md evals/evals.json scripts/render-venn.mjs
git diff --cached --name-only
git diff --cached --check
git commit -m "release: publish venn diagram skill v0.1.0" -- README.md SKILL.md evals/evals.json scripts/render-venn.mjs
git push origin main
```

If `SKILL.md`, evals, or the renderer did not change in this task, omit those paths from both `git add` and `git commit` rather than staging them speculatively.

Verify remote state and installation metadata:

Run:

```bash
gh repo view dcgrigsby/venn-diagram-skill --json url,visibility,defaultBranchRef,licenseInfo
gh api repos/dcgrigsby/venn-diagram-skill/commits/main --jq .sha
git rev-parse HEAD
```

Expected: repository remains public, default branch is `main`, GitHub recognizes Apache-2.0, and remote/local commit SHAs match.
