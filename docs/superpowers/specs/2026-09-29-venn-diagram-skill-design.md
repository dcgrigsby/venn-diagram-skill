# Venn Diagram Skill Design

## Summary

`venn-diagram-skill` is a public, cross-agent skill that creates conceptual two-set and three-set Venn diagrams from natural-language requests. It produces a content-fitted SVG and a matching transparent PNG without requiring post-install setup.

The repository will be installable through the open Skills CLI using the GitHub shorthand `npx skills add OWNER/venn-diagram-skill -g`, where `OWNER` is the account that publishes the repository. Selecting that account is a publication action, not an unresolved product or implementation decision. The repository, skill folder, and `SKILL.md` frontmatter name will all use `venn-diagram-skill`.

## Goals

- Work with Codex, Claude Code, Cursor, OpenCode, and other file-and-command-capable agents supported by `npx skills`.
- Accept ordinary natural-language requests rather than requiring users to write JSON or invoke a renderer directly.
- Support conceptual Venn diagrams with exactly two or three sets.
- Produce both SVG and PNG from one deterministic scene.
- Keep installation to one `npx skills add` command with no later package, browser, Python, or system image-tool installation.
- Make every named region legible through content-aware wrapping and geometry.
- Produce consistent output across host agents by keeping layout and rendering in bundled code.

## Non-goals for Version One

- Numeric, count-based, or area-proportional diagrams.
- Four or more sets, Euler diagrams, or UpSet plots.
- External region labels, leader lines, titles, captions, sources, or notes.
- Independent font sizes, weights, or colors for individual labels.
- Emoji rendering or unrestricted coverage of every Unicode script.
- A standalone end-user CLI product separate from the installed agent skill.

## User Experience

The user asks naturally, for example:

> Create a three-circle Venn for Product, Engineering, and Operations. Use navy, gold, and teal at 55% opacity. Put “viable roadmap” in the center.

The skill:

1. Identifies the two or three sets and the requested region labels.
2. Helps develop missing content when that is useful, while stating assumptions that materially affect meaning.
3. Uses professional defaults for unspecified visual choices.
4. Writes an internal JSON specification to a temporary or output-adjacent file.
5. Resolves the renderer relative to the installed `SKILL.md` location and invokes it with the JSON file path.
6. Reads the renderer's JSON report and inspects both output files.
7. If a label cannot fit within the permitted layout, proposes a concise rewrite and reruns after resolving the wording.
8. Returns links or paths to the SVG and PNG.

The user never needs to see or author the internal JSON unless they ask for it.

## Region Model

Two-set diagrams support these regions:

- `a`: only set A
- `b`: only set B
- `ab`: the A and B overlap

Three-set diagrams support these regions:

- `a`, `b`, `c`: each exclusive set region
- `ab`, `ac`, `bc`: the three pairwise-only overlap regions
- `abc`: the three-way overlap

Only named regions receive labels. Unnamed regions remain empty. Labels always sit directly inside their regions.

## Internal Renderer Contract

The agent passes a JSON file rather than shell arguments so quotes, punctuation, spaces, and shell metacharacters in labels cannot alter command behavior.

The specification contains:

- `sets`: two or three stable set identifiers with display labels.
- `regions`: a mapping from valid region identifiers to visible text.
- `style.colors`: one color per set, expressed as a validated CSS color name or hexadecimal value.
- `style.opacity`: a numeric fill opacity greater than 0 and no greater than 1.
- `style.background`: `transparent` by default or an explicitly requested solid color.
- `output.directory`: the user-requested or current output directory.
- `output.basename`: a descriptive slug derived from the set labels unless explicitly supplied.
- `output.pngLongestSide`: `1600` by default.
- `accessibility.title` and `accessibility.description`: derived from the content, with optional agent-provided refinements.

The renderer returns a JSON report containing:

- Status: `ok`, `warning`, `needs_revision`, or `error`.
- Paths and dimensions for created files.
- The chosen global text color.
- Applied line breaks and geometry scale.
- Contrast and fit diagnostics.
- Any affected region identifiers and actionable messages.

## Architecture

### Skill layer

`SKILL.md` is agent-neutral. It owns natural-language interpretation, content development, assumption disclosure, JSON preparation, renderer invocation, output inspection, and user communication. It instructs agents not to freehand SVG or substitute host-specific image tools.

### Deterministic renderer

A bundled Node program owns validation, typography, layout, SVG serialization, accessibility metadata, PNG conversion, filename collision handling, and report generation. Node is the runtime boundary because installing through `npx` already requires Node on the host.

The runtime performs no package installation and makes no network requests.

### Vendored rasterization

The repository vendors a pinned resvg-wasm WebAssembly binary, its JavaScript loader, and its required license notices. It receives the generated SVG plus the bundled font and emits the PNG at the requested scale. Implementation verification must confirm that the pinned files run under the minimum supported Node version and remain within the Skills CLI distribution limits.

Vendoring is essential: `npx skills add` copies skill files but does not install runtime npm dependencies or provision browsers and operating-system image converters.

### Bundled typography

The repository includes a pinned Noto Sans SemiBold build covering common Latin, Greek, and Cyrillic text, its Open Font License, and deterministic font measurement support. It does not rely on system fonts.

The font is embedded in the SVG and supplied directly to the PNG renderer so measurements and rendered glyphs agree. Unsupported characters are detected before rendering.

## Layout Rules

### Shared rules

- All circles in one diagram use the same radius. Unequal radii could imply quantities, which version one does not encode.
- Every region label uses one font family, one font size, one weight, and one global text color.
- The renderer never shrinks one label independently.
- Line wrapping prefers phrase and word boundaries and permits at most three balanced lines.
- The renderer reserves consistent padding between label bounds and region boundaries.
- The content-fitted artboard includes required stroke and safety padding but no decorative whitespace.

### Two sets

The two circles are arranged horizontally. Exclusive labels sit at the visual centers of their exclusive lobes. The overlap label sits at the visual center of the lens. The renderer grows both circles together and adjusts center distance to fit the exclusive and overlap labels.

### Three sets

The circles use the conventional triangular arrangement. Labels occupy the visual centers of three exclusive regions, three pairwise-only regions, and the three-way center. The renderer grows all circles together and adjusts their shared center distance to satisfy the most constrained named region.

### Fit limits

The renderer searches within bounded, documented geometry limits. If a label still cannot fit in three lines at the shared font size, it returns `needs_revision` without emitting a knowingly broken final pair. The report identifies the limiting region and a target length range so the agent can suggest a shorter phrase.

## Visual System

- Default two-set palette: blue and amber.
- Default three-set palette: blue, amber, and teal.
- Default fill opacity: `0.55`.
- User-specified colors and opacity override those defaults.
- Circle outlines use a darker derivative of each fill color at an opacity that keeps boundaries clear.
- The default artboard background is transparent. A solid background is available when requested.

### Global text contrast

The diagram uses either black text everywhere or white text everywhere. It never mixes the two.

For both candidates, the renderer computes contrast at every labeled region using the actual layered circle colors. For a solid canvas, it evaluates the specified background. For the default transparent canvas, it evaluates both white (`#ffffff`) and near-black (`#111827`) destination backgrounds.

For each candidate and destination background, the renderer calculates the minimum contrast across all labeled regions. A candidate's score is the better of its light-background and dark-background minimums; the higher-scoring candidate wins. This selects one text color that keeps the whole diagram most legible on at least one common destination theme. The report records the recommended light or dark destination theme.

If the winning candidate does not reach a 4.5:1 minimum contrast across every labeled region on either simulated theme, the output is marked `warning`. The skill recommends a higher opacity or different circle colors rather than changing individual labels or hiding the problem.

## Output Contract

- Always request one SVG and one PNG.
- SVG uses a tight, content-fitted `viewBox` and embedded font data.
- PNG preserves transparency and has a longest side of exactly 1600 pixels by default.
- PNG aspect ratio matches the SVG viewBox.
- SVG includes `<title>` and `<desc>` content describing the sets and every named region.
- Default basenames are descriptive slugs such as `product-engineering-venn`.
- Existing files are never silently overwritten. The renderer appends a numeric suffix unless the user explicitly requested replacement.
- If PNG rendering fails after SVG creation, the valid SVG remains available, but the report returns an incomplete/error state and the skill does not claim successful two-file delivery.

## Validation and Safety

- Accept exactly two or three sets.
- Reject unknown region identifiers and region identifiers inconsistent with the set count.
- Validate color syntax, opacity, dimensions, input structure, and output paths before rendering.
- Escape all XML content and never evaluate user-provided strings as code.
- Do not execute content embedded in labels.
- Resolve bundled resources relative to the renderer, not the agent's working directory.
- Do not perform network requests at render time.
- Detect unsupported glyphs and identify them clearly rather than emitting missing-glyph boxes.
- Do not truncate labels, silently omit regions, or change wording inside the renderer.
- Limit internal layout iterations and return a diagnostic instead of retrying indefinitely.

## Repository Shape

The intended repository structure is:

```text
venn-diagram-skill/
|-- SKILL.md
|-- README.md
|-- agents/
|   `-- openai.yaml
|-- scripts/
|   |-- render-venn.mjs
|   `-- test-renderer.mjs
|-- vendor/
|   |-- resvg/
|   `-- fonts/
|-- tests/
|   |-- fixtures/
|   `-- expected/
|-- evals/
|   `-- evals.json
`-- licenses/
```

The public `README.md` is justified by the distribution requirement: it provides a copy-paste installation command, supported-agent boundary, examples, output contract, and license notices. Runtime files remain inside the skill directory so all supported agents receive them when the skill is installed.

## Verification Strategy

### Renderer tests

- Two-set diagram with all three regions named.
- Three-set diagrams with sparse labels and all seven regions named.
- Phrase-aware wrapping at one, two, and three lines.
- Equal font size and weight across all labels.
- Equal radii within a diagram and uniform geometry growth.
- `needs_revision` for content that exceeds bounded geometry.
- Default and custom colors and opacity.
- One global black-or-white text choice.
- Contrast warnings for hostile palettes or very low opacity.
- Transparent and requested solid backgrounds.
- Tight SVG bounds and exact 1600-pixel PNG longest side.
- Equivalent geometry, font, colors, transparency, and dimensions between SVG and decoded PNG.
- Accessibility metadata and XML escaping.
- Supported and unsupported character handling.
- Collision-safe filenames and explicit overwrite behavior.
- Resource lookup from a working directory unrelated to the installed skill.

### Installation smoke test

Install from the local repository through `npx skills add` into an isolated test location, then verify that the installed copy contains every runtime asset and can create both files without network access or dependency installation.

### Skill evaluations

Run realistic prompts through multiple available agents and compare them against a no-skill baseline. Initial cases will cover:

1. A two-set prompt that asks the agent to infer a useful overlap.
2. A dense three-set prompt naming all seven regions with custom colors and opacity.
3. A prompt with an overlong center label that should trigger concise rewriting rather than font shrinking.
4. Light and dark palette prompts that exercise the single global text-color rule.

Successful skill runs must invoke the same bundled renderer, create both file types, honor the semantic content, and pass programmatic artifact checks. Human review will judge visual balance and the quality of inferred wording.

## Delivery Sequence

1. Create the cross-agent skill metadata and public installation documentation.
2. Define and validate the JSON contract and diagnostic report.
3. Implement deterministic two-set layout and SVG output.
4. Add three-set layout and all seven direct-label regions.
5. Add font embedding, measurement, wrapping, and unsupported-glyph detection.
6. Add global contrast selection and style validation.
7. Vendor and integrate WebAssembly PNG rendering.
8. Add artifact, visual-regression, installation, and cross-agent evaluation coverage.
9. Package, test through `npx skills add`, and publish from the public GitHub repository.

## Acceptance Criteria

- A fresh user can install the skill for a supported local agent with one `npx skills add` command.
- A natural-language two-set or three-set request produces a valid SVG and visually matching transparent PNG without additional installation.
- Every named region is labeled directly inside its correct region.
- All labels in one diagram share font family, size, weight, and one black-or-white color.
- Labels wrap to at most three lines; the renderer grows equal-radius geometry or requests shorter wording rather than shrinking individual text.
- User-selected colors and opacity are honored, and unreadable combinations produce actionable warnings.
- Default output is tightly fitted and transparent; PNG longest side is 1600 pixels.
- The renderer never silently truncates, omits, overwrites, or fabricates output success.
- The installed skill behaves consistently across the tested agents because geometry and file generation are handled by the bundled renderer.
