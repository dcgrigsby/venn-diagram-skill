# venn-diagram-skill

A portable agent skill for creating conceptual two-set and three-set Venn diagrams from natural-language requests. It produces matching SVG and PNG files with content-aware sizing, direct region labels, customizable circle colors and opacity, and no post-install dependencies.

This README is for humans evaluating or installing the skill. Agent instructions are in [SKILL.md](SKILL.md).

## Disclaimer

Generated diagrams may include AI-inferred wording or relationships. Review the content before use. Circle and overlap areas are conceptual and do not represent quantities. Automatic text contrast is a best effort. The software is provided without warranty under the terms of the [Apache License 2.0](LICENSE).

## Install

The skill requires Node.js 20 or newer at render time and an agent with local shell and filesystem access. The renderer, fonts, and WASM runtime are bundled; no separate package install, browser, Python environment, or system image utility is required.

### Project-scoped install (recommended)

From the project where you want to use the skill, run:

```bash
npx skills add dcgrigsby/venn-diagram-skill
```

Choose your agent and project scope when prompted. A project-scoped install stays with that project instead of changing your user-level agent configuration.

For a non-interactive project install targeting Claude Code, Gemini CLI, Codex, Zed, and Cursor, use:

```bash
npx --yes skills@1.7.0 add dcgrigsby/venn-diagram-skill --copy -y \
  -a claude-code -a gemini-cli -a codex -a zed -a cursor
```

This multi-agent command was exercised in a clean project. The automated release smoke test additionally installs for Codex and renders both output formats from the installed copy.

The skill has been tested with `skills` 1.7.0. Agent names and supported clients may change in later versions; run `npx skills add --help` for the current list.

### Optional global install

If you want the skill available across projects, add `-g` and select the agents you use:

```bash
npx skills add dcgrigsby/venn-diagram-skill -g
```

## Usage

Start your selected agent from the project directory and ask naturally. For example:

> Create a three-set Venn diagram for Desirable, Feasible, and Viable. Label the center “Product-market fit” in bold. Use a white background and save both SVG and PNG files under ./output with the basename product-market-fit.

Other examples:

> Create a Venn diagram for Product and Engineering. Product brings customer priorities, Engineering brings reliable implementation, and the overlap is a viable roadmap.

> Create a sparse three-circle Venn for Strategy, Delivery, and Support. Put “Customer trust” in the center, bold only that label, and leave the pairwise overlaps unlabeled.

The agent creates schema-v1 JSON and calls the bundled Node renderer. On success it returns two paths: a content-fitted SVG with embedded Noto Sans and accessibility metadata, and a visually matching PNG whose longest side is 1600 pixels by default. Both share one text size and one black-or-white text color. Requested emphasis applies to a whole label. An omitted overlap stays unlabeled. If a label will not fit, the renderer returns `needs_revision` with the limiting region; the agent proposes shorter wording and rerenders once the wording is settled. Low contrast is reported as a warning alongside a completed pair.

Version one is limited to conceptual diagrams with two or three equal-radius circles. It does not create count-based or area-proportional diagrams.

## Development

```bash
npm ci
npm run build
npm test
make install-smoke
```

`make install-smoke` creates an allowlisted clean export, installs it with `npx --yes skills@1.7.0` into a temporary project, then renders from another temporary directory. It needs network access to fetch that pinned CLI. A release-gate caller can explicitly skip the network smoke with `VENN_SKIP_INSTALL_SMOKE=1`; normal test runs execute it.

## Design

The approved design is documented in [docs/superpowers/specs/2026-09-29-venn-diagram-skill-design.md](docs/superpowers/specs/2026-09-29-venn-diagram-skill-design.md).

## License

Apache 2.0 — see [LICENSE](LICENSE). The bundled fonts and WASM renderer retain their own licenses; see [third-party notices](licenses/THIRD_PARTY_NOTICES.md).
