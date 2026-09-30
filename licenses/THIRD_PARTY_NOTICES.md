# Third-party notices

This skill ships a vendored WebAssembly renderer and Noto Sans fonts. Its
checked-in JavaScript renderer is built from the development packages listed
below. The corresponding source and license material can be obtained from the
pinned upstream releases linked here.

## Vendored assets

| File | Version and source | SHA-256 |
| --- | --- | --- |
| `vendor/resvg/index_bg.wasm` | [`@resvg/resvg-wasm` 2.6.2](https://www.npmjs.com/package/@resvg/resvg-wasm/v/2.6.2); [source tag](https://github.com/yisibl/resvg-js/tree/v2.6.2) | `22bf6e9f9a100d972da0411a69c5ba504367fc1fa87b3b64e3f35e53926d2d70` |
| `vendor/fonts/NotoSans-Regular.ttf` | [Noto Sans 2.015](https://github.com/notofonts/latin-greek-cyrillic/releases/tag/NotoSans-v2.015), `NotoSans/hinted/ttf/NotoSans-Regular.ttf` in the release archive | `478c558ea716033cd60c03438f628dfa75694dcf6b5f6d505a2f05fd2b4f3823` |
| `vendor/fonts/NotoSans-Bold.ttf` | [Noto Sans 2.015](https://github.com/notofonts/latin-greek-cyrillic/releases/tag/NotoSans-v2.015), `NotoSans/hinted/ttf/NotoSans-Bold.ttf` in the release archive | `1df075a380fc7cb898acf64c1f7b3b4dd780de3caa860178bf929de35817a913` |
| `vendor/fonts/OFL.txt` | [Noto Sans 2.015](https://github.com/notofonts/latin-greek-cyrillic/releases/tag/NotoSans-v2.015), `OFL.txt` in the release archive | `cee9892f9f0cc8fe882c9e9537ee6a89621d86ee7ceaf70b02e2b2b1c25c061a` |

The downloaded [NotoSans-v2.015.zip release asset](https://github.com/notofonts/latin-greek-cyrillic/releases/download/NotoSans-v2.015/NotoSans-v2.015.zip) had SHA-256
`0c34df072a3fa7efbb7cbf34950e1f971a4447cffe365d3a359e2d4089b958f5`.

## @resvg/resvg-wasm and Rust components

`@resvg/resvg-wasm` 2.6.2 is licensed under the Mozilla Public License 2.0.
Its npm archive omits its license file; the authoritative [MPL-2.0 license
text](https://github.com/yisibl/resvg-js/blob/v2.6.2/LICENSE) and
[corresponding source](https://github.com/yisibl/resvg-js/tree/v2.6.2) are
available in the pinned source tag. The source-form notice is:

> This Source Code Form is subject to the terms of the Mozilla Public
> License, v. 2.0. If a copy of the MPL was not distributed with this
> file, You can obtain one at http://mozilla.org/MPL/2.0/.

The WebAssembly file is built from Rust crates declared by that tag's
[`Cargo.toml`](https://github.com/yisibl/resvg-js/blob/v2.6.2/Cargo.toml).
That manifest pins the `resvg` fork to commit `3495d870` and uses the
`woff2-rs` `fix-total-compressed-size` branch. The following notices cover
the manifest's WebAssembly-side Rust dependencies and renderer components;
license expressions are those supplied in their crate metadata. Their
respective source and full license files are linked from the crate pages.
The source tag has no committed `Cargo.lock`, so this list does not claim
binary-exact transitive crate versions.

| Rust component | License notice | Source / license material |
| --- | --- | --- |
| `resvg`, `usvg`, `usvg-parser`, `usvg-text-layout`, `usvg-tree` | MPL-2.0 | [pinned resvg fork](https://github.com/zimond/resvg/tree/3495d870), [resvg license](https://github.com/zimond/resvg/blob/3495d870/LICENSE.txt) |
| `tiny-skia`, `tiny-skia-path` | BSD-3-Clause | [tiny-skia](https://crates.io/crates/tiny-skia) |
| `woff2` | Apache-2.0 | [woff2-rs fork](https://github.com/yisibl/woff2-rs/tree/fix-total-compressed-size) |
| `svgtypes`, `pathfinder_geometry`, `pathfinder_content`, `pathfinder_simd` | MIT OR Apache-2.0 | [svgtypes](https://crates.io/crates/svgtypes), [pathfinder_geometry](https://crates.io/crates/pathfinder_geometry), [pathfinder_content](https://crates.io/crates/pathfinder_content), [pathfinder_simd](https://crates.io/crates/pathfinder_simd) |
| `env_logger`, `log`, `serde`, `serde_json`, `thiserror`, `png`, `futures`, `wasm-bindgen`, `js-sys` | MIT OR Apache-2.0 | [env_logger](https://crates.io/crates/env_logger), [log](https://crates.io/crates/log), [serde](https://crates.io/crates/serde), [serde_json](https://crates.io/crates/serde_json), [thiserror](https://crates.io/crates/thiserror), [png](https://crates.io/crates/png), [futures](https://crates.io/crates/futures), [wasm-bindgen](https://crates.io/crates/wasm-bindgen), [js-sys](https://crates.io/crates/js-sys) |

The WASM also incorporates dependencies of those crates. Consult the
[pinned renderer source](https://github.com/yisibl/resvg-js/tree/v2.6.2)
and its Rust dependency manifests for the full source chain and the license
files supplied with each crate.

## JavaScript components

| Package | Use | License and notice source |
| --- | --- | --- |
| `opentype.js` 2.0.0 | Bundled renderer dependency | MIT; copyright © 2020 Frederik De Bleser. [Package source and LICENSE](https://github.com/opentypejs/opentype.js/blob/2.0.0/LICENSE). |
| `color-name` 2.1.1 | Bundled renderer dependency | MIT; copyright © 2015 Dmitry Ivanov. [Exact npm package](https://www.npmjs.com/package/color-name/v/2.1.1) and [upstream LICENSE](https://github.com/colorjs/color-name/blob/master/LICENSE). |
| `esbuild` 0.28.2 | Development build tool only; not shipped at runtime | MIT; copyright © 2020 Evan Wallace. [Package source and LICENSE](https://github.com/evanw/esbuild/blob/v0.28.2/LICENSE.md). |

The three MIT license files above contain the following common permission and
disclaimer text, reproduced here with the individual copyright notices in the
table above:

> Permission is hereby granted, free of charge, to any person obtaining a copy
> of this software and associated documentation files (the "Software"), to deal
> in the Software without restriction, including without limitation the rights
> to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
> copies of the Software, and to permit persons to whom the Software is
> furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in
> all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
> IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
> FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
> AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
> LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
> OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
> SOFTWARE.

The checked-in renderer preserves esbuild's generated legal comments where
dependencies provide them.

## Noto Sans

Noto Sans 2.015 Regular and Bold are licensed under the SIL Open Font License
1.1. The full license, copyright statements, reserved font names, and license
conditions from the release archive are shipped verbatim at
[`vendor/fonts/OFL.txt`](../vendor/fonts/OFL.txt).
