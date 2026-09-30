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

The distributed npm package's registry metadata ties
`@resvg/resvg-wasm` 2.6.2 to git commit
`9ca058462ac529120c8cc84ddcd6fef644cc5406` and records publication at
2024-03-26T13:43:40.968Z. The pinned workflow builds the WebAssembly from that
checkout with `wasm-pack`, then publishes the Node 20 artifact. The root
manifest pins the renderer fork to
`3495d8705b302d6d266748516973606ca9657906`.

The source tag does not commit a root `Cargo.lock`. To recover the complete
notice set without substituting a modern dependency graph, the exact root
manifest and git commits were resolved against only crate releases published
no later than the npm publication timestamp. The vendored binary identifies
the otherwise branch-only `woff2-rs` input as commit
`88cce4cd07da2c3f35839068c6f73672700cfc8b`. The resulting
`wasm32-unknown-unknown` target graph contains 121 package/version entries,
including conservative coverage of five compile-time procedural macros. All
38 versioned crates.io source paths embedded in the exact vendored WASM match
that historical resolution; no embedded crate/version path is absent from the
inventory.

The binary also embeds Rust `core`, `alloc`, and `std` source paths from
toolchain commit `d86d65bbc19b928387f68427fcc3a0da498d8a19`, plus its vendored
`hashbrown` 0.14.3 dependency. These standard-library components are listed
separately below.

In the evidence column, **H** means the package/version is in the complete
historical WASM target resolution described above. **B** means that exact
package/version or source commit is also directly observable in the vendored
binary. Build-time procedural macros are retained for conservative notice
coverage even though the macro executables themselves are not linked into the
WASM.

| Component and exact source | License expression | Scope | Evidence |
| --- | --- | --- | --- |
| [`adler` 1.0.2](https://crates.io/crates/adler/1.0.2) | 0BSD OR MIT OR Apache-2.0 | WASM target graph | H |
| [`adler32` 1.2.0](https://crates.io/crates/adler32/1.2.0) | Zlib | WASM target graph | HB |
| [`aho-corasick` 1.1.3](https://crates.io/crates/aho-corasick/1.1.3) | Unlicense OR MIT | WASM target graph | H |
| [`alloc-no-stdlib` 2.0.4](https://crates.io/crates/alloc-no-stdlib/2.0.4) | BSD-3-Clause | WASM target graph | HB |
| [`alloc-stdlib` 0.2.2](https://crates.io/crates/alloc-stdlib/0.2.2) | BSD-3-Clause | WASM target graph | H |
| [`anstream` 0.6.13](https://crates.io/crates/anstream/0.6.13) | MIT OR Apache-2.0 | WASM target graph | H |
| [`anstyle` 1.0.6](https://crates.io/crates/anstyle/1.0.6) | MIT OR Apache-2.0 | WASM target graph | H |
| [`anstyle-parse` 0.2.3](https://crates.io/crates/anstyle-parse/0.2.3) | MIT OR Apache-2.0 | WASM target graph | H |
| [`anstyle-query` 1.0.2](https://crates.io/crates/anstyle-query/1.0.2) | MIT OR Apache-2.0 | WASM target graph | H |
| [`arrayref` 0.3.7](https://crates.io/crates/arrayref/0.3.7) | BSD-2-Clause | WASM target graph | H |
| [`arrayvec` 0.5.2](https://crates.io/crates/arrayvec/0.5.2) | MIT OR Apache-2.0 | WASM target graph | H |
| [`arrayvec` 0.7.4](https://crates.io/crates/arrayvec/0.7.4) | MIT OR Apache-2.0 | WASM target graph | HB |
| [`base64` 0.21.7](https://crates.io/crates/base64/0.21.7) | MIT OR Apache-2.0 | WASM target graph | HB |
| [`bitflags` 1.3.2](https://crates.io/crates/bitflags/1.3.2) | MIT OR Apache-2.0 | WASM target graph | H |
| [`bitvec` 1.0.1](https://crates.io/crates/bitvec/1.0.1) | MIT | WASM target graph | HB |
| [`brotli` 3.5.0](https://crates.io/crates/brotli/3.5.0) | BSD-3-Clause OR MIT | WASM target graph | H |
| [`brotli-decompressor` 2.5.1](https://crates.io/crates/brotli-decompressor/2.5.1) | BSD-3-Clause OR MIT | WASM target graph | HB |
| [`bumpalo` 3.15.4](https://crates.io/crates/bumpalo/3.15.4) | MIT OR Apache-2.0 | WASM target graph | H |
| [`bytemuck` 1.15.0](https://crates.io/crates/bytemuck/1.15.0) | Zlib OR Apache-2.0 OR MIT | WASM target graph | HB |
| [`bytes` 1.6.0](https://crates.io/crates/bytes/1.6.0) | MIT | WASM target graph | HB |
| [`cfg-if` 1.0.0](https://crates.io/crates/cfg-if/1.0.0) | MIT OR Apache-2.0 | WASM target graph | H |
| [`color_quant` 1.1.0](https://crates.io/crates/color_quant/1.1.0) | MIT | WASM target graph | H |
| [`colorchoice` 1.0.0](https://crates.io/crates/colorchoice/1.0.0) | MIT OR Apache-2.0 | WASM target graph | H |
| [`crc32fast` 1.4.0](https://crates.io/crates/crc32fast/1.4.0) | MIT OR Apache-2.0 | WASM target graph | H |
| [`data-url` 0.2.0](https://crates.io/crates/data-url/0.2.0) | MIT OR Apache-2.0 | WASM target graph | HB |
| [`deflate` 1.0.0](https://crates.io/crates/deflate/1.0.0) | MIT OR Apache-2.0 | WASM target graph | HB |
| [`env_filter` 0.1.0](https://crates.io/crates/env_filter/0.1.0) | MIT OR Apache-2.0 | WASM target graph | H |
| [`env_logger` 0.11.3](https://crates.io/crates/env_logger/0.11.3) | MIT OR Apache-2.0 | WASM target graph | H |
| [`flate2` 1.0.28](https://crates.io/crates/flate2/1.0.28) | MIT OR Apache-2.0 | WASM target graph | HB |
| [`float-cmp` 0.9.0](https://crates.io/crates/float-cmp/0.9.0) | MIT | WASM target graph | H |
| [`fontdb` 0.14.1](https://crates.io/crates/fontdb/0.14.1) | MIT | WASM target graph | HB |
| [`four-cc` 0.3.0](https://crates.io/crates/four-cc/0.3.0) | MIT OR Apache-2.0 | WASM target graph | H |
| [`funty` 2.0.0](https://crates.io/crates/funty/2.0.0) | MIT | WASM target graph | H |
| [`futures` 0.3.30](https://crates.io/crates/futures/0.3.30) | MIT OR Apache-2.0 | WASM target graph | H |
| [`futures-channel` 0.3.30](https://crates.io/crates/futures-channel/0.3.30) | MIT OR Apache-2.0 | WASM target graph | H |
| [`futures-core` 0.3.30](https://crates.io/crates/futures-core/0.3.30) | MIT OR Apache-2.0 | WASM target graph | H |
| [`futures-executor` 0.3.30](https://crates.io/crates/futures-executor/0.3.30) | MIT OR Apache-2.0 | WASM target graph | H |
| [`futures-io` 0.3.30](https://crates.io/crates/futures-io/0.3.30) | MIT OR Apache-2.0 | WASM target graph | H |
| [`futures-macro` 0.3.30](https://crates.io/crates/futures-macro/0.3.30) | MIT OR Apache-2.0 | build-time proc macro | H |
| [`futures-sink` 0.3.30](https://crates.io/crates/futures-sink/0.3.30) | MIT OR Apache-2.0 | WASM target graph | H |
| [`futures-task` 0.3.30](https://crates.io/crates/futures-task/0.3.30) | MIT OR Apache-2.0 | WASM target graph | H |
| [`futures-util` 0.3.30](https://crates.io/crates/futures-util/0.3.30) | MIT OR Apache-2.0 | WASM target graph | H |
| [`gif` 0.12.0](https://crates.io/crates/gif/0.12.0) | MIT OR Apache-2.0 | WASM target graph | HB |
| [`humantime` 2.1.0](https://crates.io/crates/humantime/2.1.0) | MIT OR Apache-2.0 | WASM target graph | H |
| [`imagesize` 0.12.0](https://crates.io/crates/imagesize/0.12.0) | MIT | WASM target graph | HB |
| [`itoa` 1.0.11](https://crates.io/crates/itoa/1.0.11) | MIT OR Apache-2.0 | WASM target graph | H |
| [`jpeg-decoder` 0.3.1](https://crates.io/crates/jpeg-decoder/0.3.1) | MIT OR Apache-2.0 | WASM target graph | HB |
| [`js-sys` 0.3.69](https://crates.io/crates/js-sys/0.3.69) | MIT OR Apache-2.0 | WASM target graph | H |
| [`kurbo` 0.10.4](https://crates.io/crates/kurbo/0.10.4) | MIT OR Apache-2.0 | WASM target graph | H |
| [`kurbo` 0.9.5](https://crates.io/crates/kurbo/0.9.5) | MIT OR Apache-2.0 | WASM target graph | HB |
| [`log` 0.4.21](https://crates.io/crates/log/0.4.21) | MIT OR Apache-2.0 | WASM target graph | H |
| [`memchr` 2.7.1](https://crates.io/crates/memchr/2.7.1) | Unlicense OR MIT | WASM target graph | H |
| [`miniz_oxide` 0.5.4](https://crates.io/crates/miniz_oxide/0.5.4) | MIT OR Zlib OR Apache-2.0 | WASM target graph | HB |
| [`miniz_oxide` 0.7.2](https://crates.io/crates/miniz_oxide/0.7.2) | MIT OR Zlib OR Apache-2.0 | WASM target graph | HB |
| [`once_cell` 1.19.0](https://crates.io/crates/once_cell/1.19.0) | MIT OR Apache-2.0 | WASM target graph | H |
| [`paste` 1.0.14](https://crates.io/crates/paste/1.0.14) | MIT OR Apache-2.0 | build-time proc macro | H |
| [`pathfinder_color` 0.5.0](https://crates.io/crates/pathfinder_color/0.5.0) | MIT OR Apache-2.0 | WASM target graph | H |
| [`pathfinder_content` 0.5.0](https://crates.io/crates/pathfinder_content/0.5.0) | MIT OR Apache-2.0 | WASM target graph | HB |
| [`pathfinder_geometry` 0.5.1](https://crates.io/crates/pathfinder_geometry/0.5.1) | MIT OR Apache-2.0 | WASM target graph | H |
| [`pathfinder_simd` 0.5.2](https://crates.io/crates/pathfinder_simd/0.5.2) | MIT OR Apache-2.0 | WASM target graph | H |
| [`pico-args` 0.5.0](https://crates.io/crates/pico-args/0.5.0) | MIT | WASM target graph | H |
| [`pin-project-lite` 0.2.13](https://crates.io/crates/pin-project-lite/0.2.13) | Apache-2.0 OR MIT | WASM target graph | H |
| [`pin-utils` 0.1.0](https://crates.io/crates/pin-utils/0.1.0) | MIT OR Apache-2.0 | WASM target graph | H |
| [`png` 0.17.5](https://crates.io/crates/png/0.17.5) | MIT OR Apache-2.0 | WASM target graph | HB |
| [`proc-macro2` 1.0.79](https://crates.io/crates/proc-macro2/1.0.79) | MIT OR Apache-2.0 | WASM target graph | H |
| [`quote` 1.0.35](https://crates.io/crates/quote/1.0.35) | MIT OR Apache-2.0 | WASM target graph | H |
| [`radium` 0.7.0](https://crates.io/crates/radium/0.7.0) | MIT | WASM target graph | H |
| [`rctree` 0.5.0](https://crates.io/crates/rctree/0.5.0) | MIT | WASM target graph | HB |
| [`regex` 1.10.4](https://crates.io/crates/regex/1.10.4) | MIT OR Apache-2.0 | WASM target graph | H |
| [`regex-automata` 0.4.6](https://crates.io/crates/regex-automata/0.4.6) | MIT OR Apache-2.0 | WASM target graph | H |
| [`regex-syntax` 0.8.2](https://crates.io/crates/regex-syntax/0.8.2) | MIT OR Apache-2.0 | WASM target graph | H |
| [`resvg` 0.34.1](https://github.com/zimond/resvg/tree/3495d8705b302d6d266748516973606ca9657906) | MPL-2.0 | WASM target graph | HB |
| [`resvg-js` crate 1.0.0 (`@resvg/resvg-wasm` 2.6.2)](https://github.com/yisibl/resvg-js/tree/v2.6.2) | MPL-2.0 | WASM target graph | H |
| [`rgb` 0.8.37](https://crates.io/crates/rgb/0.8.37) | MIT | WASM target graph | H |
| [`roxmltree` 0.18.1](https://crates.io/crates/roxmltree/0.18.1) | MIT OR Apache-2.0 | WASM target graph | HB |
| [`rustybuzz` 0.7.0](https://crates.io/crates/rustybuzz/0.7.0) | MIT | WASM target graph | HB |
| [`ryu` 1.0.17](https://crates.io/crates/ryu/1.0.17) | Apache-2.0 OR BSL-1.0 | WASM target graph | H |
| [`safer-bytes` 0.2.0](https://crates.io/crates/safer-bytes/0.2.0) | MIT | WASM target graph | H |
| [`serde` 1.0.197](https://crates.io/crates/serde/1.0.197) | MIT OR Apache-2.0 | WASM target graph | H |
| [`serde_derive` 1.0.197](https://crates.io/crates/serde_derive/1.0.197) | MIT OR Apache-2.0 | build-time proc macro | H |
| [`serde_json` 1.0.115](https://crates.io/crates/serde_json/1.0.115) | MIT OR Apache-2.0 | WASM target graph | HB |
| [`simplecss` 0.2.1](https://crates.io/crates/simplecss/0.2.1) | MIT OR Apache-2.0 | WASM target graph | HB |
| [`siphasher` 0.3.11](https://crates.io/crates/siphasher/0.3.11) | MIT OR Apache-2.0 | WASM target graph | H |
| [`slab` 0.4.9](https://crates.io/crates/slab/0.4.9) | MIT | WASM target graph | H |
| [`slotmap` 1.0.7](https://crates.io/crates/slotmap/1.0.7) | Zlib | WASM target graph | HB |
| [`smallvec` 1.13.2](https://crates.io/crates/smallvec/1.13.2) | MIT OR Apache-2.0 | WASM target graph | HB |
| [`strict-num` 0.1.1](https://crates.io/crates/strict-num/0.1.1) | MIT | WASM target graph | H |
| [`svgtypes` 0.11.0](https://crates.io/crates/svgtypes/0.11.0) | MIT OR Apache-2.0 | WASM target graph | HB |
| [`svgtypes` 0.14.0](https://crates.io/crates/svgtypes/0.14.0) | MIT OR Apache-2.0 | WASM target graph | HB |
| [`syn` 2.0.55](https://crates.io/crates/syn/2.0.55) | MIT OR Apache-2.0 | WASM target graph | H |
| [`tap` 1.0.1](https://crates.io/crates/tap/1.0.1) | MIT | WASM target graph | H |
| [`thiserror` 1.0.58](https://crates.io/crates/thiserror/1.0.58) | MIT OR Apache-2.0 | WASM target graph | H |
| [`thiserror-impl` 1.0.58](https://crates.io/crates/thiserror-impl/1.0.58) | MIT OR Apache-2.0 | build-time proc macro | H |
| [`tiny-skia` 0.10.0](https://crates.io/crates/tiny-skia/0.10.0) | BSD-3-Clause | WASM target graph | HB |
| [`tiny-skia-path` 0.10.0](https://crates.io/crates/tiny-skia-path/0.10.0) | BSD-3-Clause | WASM target graph | HB |
| [`tinyvec` 1.6.0](https://crates.io/crates/tinyvec/1.6.0) | Zlib OR Apache-2.0 OR MIT | WASM target graph | HB |
| [`tinyvec_macros` 0.1.1](https://crates.io/crates/tinyvec_macros/0.1.1) | MIT OR Apache-2.0 OR Zlib | WASM target graph | H |
| [`ttf-parser` 0.18.1](https://crates.io/crates/ttf-parser/0.18.1) | MIT OR Apache-2.0 | WASM target graph | HB |
| [`ttf-parser` 0.19.2](https://crates.io/crates/ttf-parser/0.19.2) | MIT OR Apache-2.0 | WASM target graph | H |
| [`unicode-bidi` 0.3.15](https://crates.io/crates/unicode-bidi/0.3.15) | MIT OR Apache-2.0 | WASM target graph | HB |
| [`unicode-bidi-mirroring` 0.1.0](https://crates.io/crates/unicode-bidi-mirroring/0.1.0) | MIT OR Apache-2.0 | WASM target graph | H |
| [`unicode-ccc` 0.1.2](https://crates.io/crates/unicode-ccc/0.1.2) | MIT OR Apache-2.0 | WASM target graph | H |
| [`unicode-general-category` 0.6.0](https://crates.io/crates/unicode-general-category/0.6.0) | Apache-2.0 | WASM target graph | HB |
| [`unicode-ident` 1.0.12](https://crates.io/crates/unicode-ident/1.0.12) | (MIT OR Apache-2.0) AND Unicode-DFS-2016 | WASM target graph | H |
| [`unicode-script` 0.5.6](https://crates.io/crates/unicode-script/0.5.6) | MIT OR Apache-2.0 | WASM target graph | H |
| [`unicode-vo` 0.1.0](https://crates.io/crates/unicode-vo/0.1.0) | MIT OR Apache-2.0 | WASM target graph | H |
| [`usvg` 0.34.1](https://github.com/zimond/resvg/tree/3495d8705b302d6d266748516973606ca9657906) | MPL-2.0 | WASM target graph | HB |
| [`usvg-parser` 0.34.0](https://github.com/zimond/resvg/tree/3495d8705b302d6d266748516973606ca9657906) | MPL-2.0 | WASM target graph | HB |
| [`usvg-text-layout` 0.34.0](https://github.com/zimond/resvg/tree/3495d8705b302d6d266748516973606ca9657906) | MPL-2.0 | WASM target graph | HB |
| [`usvg-tree` 0.34.0](https://github.com/zimond/resvg/tree/3495d8705b302d6d266748516973606ca9657906) | MPL-2.0 | WASM target graph | HB |
| [`utf8parse` 0.2.1](https://crates.io/crates/utf8parse/0.2.1) | Apache-2.0 OR MIT | WASM target graph | H |
| [`wasm-bindgen` 0.2.92](https://crates.io/crates/wasm-bindgen/0.2.92) | MIT OR Apache-2.0 | WASM target graph | H |
| [`wasm-bindgen-backend` 0.2.92](https://crates.io/crates/wasm-bindgen-backend/0.2.92) | MIT OR Apache-2.0 | WASM target graph | H |
| [`wasm-bindgen-macro` 0.2.92](https://crates.io/crates/wasm-bindgen-macro/0.2.92) | MIT OR Apache-2.0 | build-time proc macro | H |
| [`wasm-bindgen-macro-support` 0.2.92](https://crates.io/crates/wasm-bindgen-macro-support/0.2.92) | MIT OR Apache-2.0 | WASM target graph | H |
| [`wasm-bindgen-shared` 0.2.92](https://crates.io/crates/wasm-bindgen-shared/0.2.92) | MIT OR Apache-2.0 | WASM target graph | H |
| [`weezl` 0.1.8](https://crates.io/crates/weezl/0.1.8) | MIT OR Apache-2.0 | WASM target graph | HB |
| [`woff2` 0.3.0](https://github.com/yisibl/woff2-rs/tree/88cce4cd07da2c3f35839068c6f73672700cfc8b) | Apache-2.0 | WASM target graph | HB |
| [`wyz` 0.5.1](https://crates.io/crates/wyz/0.5.1) | MIT | WASM target graph | H |
| [`xmlparser` 0.13.6](https://crates.io/crates/xmlparser/0.13.6) | MIT OR Apache-2.0 | WASM target graph | HB |
| [`xmlwriter` 0.1.0](https://crates.io/crates/xmlwriter/0.1.0) | MIT | WASM target graph | HB |
| [Rust `core`, `alloc`, and `std` 1.76.0-nightly](https://github.com/rust-lang/rust/tree/d86d65bbc19b928387f68427fcc3a0da498d8a19/library) | MIT OR Apache-2.0 | linked standard library | B |
| [`hashbrown` 0.14.3](https://github.com/rust-lang/hashbrown/tree/v0.14.3) | MIT OR Apache-2.0 | Rust standard-library dependency | B |

Authoritative inputs: [npm package metadata](https://registry.npmjs.org/@resvg%2fresvg-wasm),
[`resvg-js` v2.6.2 source](https://github.com/yisibl/resvg-js/tree/v2.6.2),
[WASM build and publish workflow](https://github.com/yisibl/resvg-js/blob/v2.6.2/.github/workflows/CI.yaml),
[root Rust manifest](https://github.com/yisibl/resvg-js/blob/v2.6.2/Cargo.toml),
[pinned renderer fork](https://github.com/zimond/resvg/tree/3495d8705b302d6d266748516973606ca9657906),
[exact `woff2-rs` source](https://github.com/yisibl/woff2-rs/tree/88cce4cd07da2c3f35839068c6f73672700cfc8b),
[exact Rust standard-library source](https://github.com/rust-lang/rust/tree/d86d65bbc19b928387f68427fcc3a0da498d8a19/library),
and `vendor/resvg/index_bg.wasm` with the SHA-256 recorded above.

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
