---
name: venn-diagram-skill
description: Create or revise conceptual two-set and three-set Venn diagrams from natural-language requests, producing matching SVG and PNG files. Use when the user asks for a Venn diagram, overlapping circles, a shared-versus-exclusive set visual, or a comparison organized by overlaps. Do not use for area-proportional charts, Euler or UpSet diagrams, or four or more sets.
---

# Venn diagrams

Turn the request into a conceptual diagram with exactly two or three sets. Identify the set names and only the overlaps the user named or wants you to develop. Help develop missing wording when useful, but disclose material assumptions about relationships or ownership. Circle and overlap areas do not encode quantities.

## Specification

Write a schema version 1 JSON file in the requested output directory or a secure temporary directory. Use set IDs `a`, `b`, and optionally `c` in order. For two sets, `ab` is the only overlap key; for three, use only requested or deliberately developed keys among `ab`, `ac`, `bc`, and `abc`. An absent overlap has no label. Keep each visible label concise. Set `bold: true` only on an **entire** set or overlap label the user explicitly asked to emphasize; partial bold is unsupported.

Translate color descriptions to solid CSS color names or `#RGB`/`#RRGGBB` hex values. The defaults are blue `#2563EB`, amber `#F59E0B`, teal `#14B8A6`, opacity `0.55`, and white `#FFFFFF` background. Do not turn qualitative relationships into measured areas.

This is the complete two-set schema example; replace its labels and output directory for the request:

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

If the user requests a location, make `output.directory` its absolute path. Otherwise choose an appropriate absolute output directory; do not rely on `"."` unless it is intentionally the user's requested location. Keep `pngLongestSide` at 1600 unless the user requests another size. Omit `bold` when false. The renderer can derive an accessible title and description from the named labels, or accept optional `accessibility.title` and `accessibility.description` strings.

Two-set request example: “Show Product and Engineering; use customer priorities on the Product side, reliable implementation on the Engineering side, and a viable roadmap in the overlap.” Set `ab` to “Viable roadmap” and do not invent other regions.

Sparse three-set request example: “Show Strategy, Delivery, and Support. Label only their common center Customer trust, in bold.” Set `abc` to `{ "text": "Customer trust", "bold": true }`; leave `ab`, `ac`, and `bc` absent.

## Render and review

Resolve `scripts/render-venn.mjs` relative to the **loaded `SKILL.md` file**, not the current working directory. Use absolute paths for both the renderer and JSON specification. Run Node with the renderer as its first argument and the specification path as its second:

```sh
node "$SKILL_DIR/scripts/render-venn.mjs" "$SPEC_PATH"
```

Here `SKILL_DIR` is the absolute directory containing this loaded `SKILL.md`, and `SPEC_PATH` is the absolute JSON path. Use the bundled renderer; do not draw SVG by hand or depend on host fonts, browsers, Python, or a system SVG converter. Parse its single JSON stdout report and check the exit code.

- Exit 0 with `status: "ok"` or `"warning"` means a complete pair. Inspect the SVG and PNG, check both reported paths exist, review layout and wording, and convey any report warnings. Return both paths.
- Exit 2 with `status: "needs_revision"` means a label does not fit. Use the reported limiting region and target length to propose a shorter phrase that preserves its meaning. Revise the JSON and rerender once the wording is settled. Do not shrink the shared font size, clip, or truncate the label.
- Exit 1 with `status: "error"` means the pair is incomplete or the input is invalid. Use the report's error code and path to correct the input or explain the failure. Never claim completion when either output is missing.

Before handing off, state material semantic assumptions and remind the user that overlap areas are illustrative rather than quantitative.
