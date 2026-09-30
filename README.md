# venn-diagram-skill

A portable agent skill for creating conceptual two-set and three-set Venn diagrams from natural-language requests. The finished skill will produce matching SVG and PNG files with content-aware sizing, direct region labels, customizable circle colors and opacity, and no post-install dependencies.

This README is for humans evaluating or installing the skill. The agent-facing instructions will live in `SKILL.md` when implementation begins.

## 🚧 IN DEVELOPMENT — NOT READY TO INSTALL

This repository currently contains the approved design specification, not a working skill. `SKILL.md`, the renderer, runtime assets, and verification suite have not been implemented yet. Do not run the installation command until this notice is removed.

## Disclaimer

Generated diagrams may include AI-inferred wording or relationships. Review the content before use. Circle and overlap areas are conceptual and do not represent quantities. Automatic contrast is a best effort, particularly when a transparent image is placed on a different background. The software is provided without warranty under the terms of the [Apache License 2.0](LICENSE).

## Planned install

After the implementation and verification work is complete, the installation command will be:

```bash
npx skills add dcgrigsby/venn-diagram-skill -g
```

No additional package, browser, Python environment, or system image utility will be required after installation.

## Planned usage

Users will ask their skill-aware agent naturally, for example:

> Create a three-circle Venn for Product, Engineering, and Operations. Use navy, gold, and teal at 55% opacity. Put “viable roadmap” in the center.

The finished skill will create:

- A content-fitted SVG with embedded typography and accessibility metadata.
- A visually matching transparent PNG whose longest side is 1600 pixels by default.

Version one is intentionally limited to conceptual diagrams with two or three equal-radius circles. It will not create count-based or area-proportional diagrams.

## Design

The approved design is documented in [docs/superpowers/specs/2026-09-29-venn-diagram-skill-design.md](docs/superpowers/specs/2026-09-29-venn-diagram-skill-design.md).

## License

Apache 2.0 — see [LICENSE](LICENSE).
