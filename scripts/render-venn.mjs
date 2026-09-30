#!/usr/bin/env node

// src/cli.mjs
import { readFile } from "node:fs/promises";
import { resolve as resolve2 } from "node:path";

// src/spec.mjs
import { resolve } from "node:path";

// node_modules/color-name/index.js
var colors = {
  aliceblue: [240, 248, 255],
  antiquewhite: [250, 235, 215],
  aqua: [0, 255, 255],
  aquamarine: [127, 255, 212],
  azure: [240, 255, 255],
  beige: [245, 245, 220],
  bisque: [255, 228, 196],
  black: [0, 0, 0],
  blanchedalmond: [255, 235, 205],
  blue: [0, 0, 255],
  blueviolet: [138, 43, 226],
  brown: [165, 42, 42],
  burlywood: [222, 184, 135],
  cadetblue: [95, 158, 160],
  chartreuse: [127, 255, 0],
  chocolate: [210, 105, 30],
  coral: [255, 127, 80],
  cornflowerblue: [100, 149, 237],
  cornsilk: [255, 248, 220],
  crimson: [220, 20, 60],
  cyan: [0, 255, 255],
  darkblue: [0, 0, 139],
  darkcyan: [0, 139, 139],
  darkgoldenrod: [184, 134, 11],
  darkgray: [169, 169, 169],
  darkgreen: [0, 100, 0],
  darkgrey: [169, 169, 169],
  darkkhaki: [189, 183, 107],
  darkmagenta: [139, 0, 139],
  darkolivegreen: [85, 107, 47],
  darkorange: [255, 140, 0],
  darkorchid: [153, 50, 204],
  darkred: [139, 0, 0],
  darksalmon: [233, 150, 122],
  darkseagreen: [143, 188, 143],
  darkslateblue: [72, 61, 139],
  darkslategray: [47, 79, 79],
  darkslategrey: [47, 79, 79],
  darkturquoise: [0, 206, 209],
  darkviolet: [148, 0, 211],
  deeppink: [255, 20, 147],
  deepskyblue: [0, 191, 255],
  dimgray: [105, 105, 105],
  dimgrey: [105, 105, 105],
  dodgerblue: [30, 144, 255],
  firebrick: [178, 34, 34],
  floralwhite: [255, 250, 240],
  forestgreen: [34, 139, 34],
  fuchsia: [255, 0, 255],
  gainsboro: [220, 220, 220],
  ghostwhite: [248, 248, 255],
  gold: [255, 215, 0],
  goldenrod: [218, 165, 32],
  gray: [128, 128, 128],
  green: [0, 128, 0],
  greenyellow: [173, 255, 47],
  grey: [128, 128, 128],
  honeydew: [240, 255, 240],
  hotpink: [255, 105, 180],
  indianred: [205, 92, 92],
  indigo: [75, 0, 130],
  ivory: [255, 255, 240],
  khaki: [240, 230, 140],
  lavender: [230, 230, 250],
  lavenderblush: [255, 240, 245],
  lawngreen: [124, 252, 0],
  lemonchiffon: [255, 250, 205],
  lightblue: [173, 216, 230],
  lightcoral: [240, 128, 128],
  lightcyan: [224, 255, 255],
  lightgoldenrodyellow: [250, 250, 210],
  lightgray: [211, 211, 211],
  lightgreen: [144, 238, 144],
  lightgrey: [211, 211, 211],
  lightpink: [255, 182, 193],
  lightsalmon: [255, 160, 122],
  lightseagreen: [32, 178, 170],
  lightskyblue: [135, 206, 250],
  lightslategray: [119, 136, 153],
  lightslategrey: [119, 136, 153],
  lightsteelblue: [176, 196, 222],
  lightyellow: [255, 255, 224],
  lime: [0, 255, 0],
  limegreen: [50, 205, 50],
  linen: [250, 240, 230],
  magenta: [255, 0, 255],
  maroon: [128, 0, 0],
  mediumaquamarine: [102, 205, 170],
  mediumblue: [0, 0, 205],
  mediumorchid: [186, 85, 211],
  mediumpurple: [147, 112, 219],
  mediumseagreen: [60, 179, 113],
  mediumslateblue: [123, 104, 238],
  mediumspringgreen: [0, 250, 154],
  mediumturquoise: [72, 209, 204],
  mediumvioletred: [199, 21, 133],
  midnightblue: [25, 25, 112],
  mintcream: [245, 255, 250],
  mistyrose: [255, 228, 225],
  moccasin: [255, 228, 181],
  navajowhite: [255, 222, 173],
  navy: [0, 0, 128],
  oldlace: [253, 245, 230],
  olive: [128, 128, 0],
  olivedrab: [107, 142, 35],
  orange: [255, 165, 0],
  orangered: [255, 69, 0],
  orchid: [218, 112, 214],
  palegoldenrod: [238, 232, 170],
  palegreen: [152, 251, 152],
  paleturquoise: [175, 238, 238],
  palevioletred: [219, 112, 147],
  papayawhip: [255, 239, 213],
  peachpuff: [255, 218, 185],
  peru: [205, 133, 63],
  pink: [255, 192, 203],
  plum: [221, 160, 221],
  powderblue: [176, 224, 230],
  purple: [128, 0, 128],
  rebeccapurple: [102, 51, 153],
  red: [255, 0, 0],
  rosybrown: [188, 143, 143],
  royalblue: [65, 105, 225],
  saddlebrown: [139, 69, 19],
  salmon: [250, 128, 114],
  sandybrown: [244, 164, 96],
  seagreen: [46, 139, 87],
  seashell: [255, 245, 238],
  sienna: [160, 82, 45],
  silver: [192, 192, 192],
  skyblue: [135, 206, 235],
  slateblue: [106, 90, 205],
  slategray: [112, 128, 144],
  slategrey: [112, 128, 144],
  snow: [255, 250, 250],
  springgreen: [0, 255, 127],
  steelblue: [70, 130, 180],
  tan: [210, 180, 140],
  teal: [0, 128, 128],
  thistle: [216, 191, 216],
  tomato: [255, 99, 71],
  turquoise: [64, 224, 208],
  violet: [238, 130, 238],
  wheat: [245, 222, 179],
  white: [255, 255, 255],
  whitesmoke: [245, 245, 245],
  yellow: [255, 255, 0],
  yellowgreen: [154, 205, 50]
};
for (const key in colors) Object.freeze(colors[key]);
var color_name_default = Object.freeze(colors);

// src/color.mjs
function parseColor(value) {
  if (typeof value !== "string") throw new TypeError("Color must be a string");
  const hex = /^#([\da-f]{3}|[\da-f]{6})$/i.exec(value);
  if (hex) {
    const digits = hex[1].length === 3 ? [...hex[1]].map((digit) => digit + digit).join("") : hex[1];
    return {
      r: Number.parseInt(digits.slice(0, 2), 16),
      g: Number.parseInt(digits.slice(2, 4), 16),
      b: Number.parseInt(digits.slice(4, 6), 16),
      a: 1
    };
  }
  const name = value.toLowerCase();
  if (Object.hasOwn(color_name_default, name)) {
    const named = color_name_default[name];
    return { r: named[0], g: named[1], b: named[2], a: 1 };
  }
  throw new TypeError(`Unsupported CSS color: ${value}`);
}

// src/spec.mjs
var DEFAULTS = Object.freeze({
  colors: Object.freeze({ a: "#2563EB", b: "#F59E0B", c: "#14B8A6" }),
  opacity: 0.55,
  background: "#FFFFFF",
  pngLongestSide: 1600,
  overwrite: false
});
var SpecError = class extends Error {
  constructor(code, path, message) {
    super(message);
    this.name = "SpecError";
    this.code = code;
    this.path = path;
  }
};
function fail(code, path, message) {
  throw new SpecError(code, path, message);
}
function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function normalizeText(value, code, path) {
  if (typeof value !== "string") fail(code, path, `${path} must be a string`);
  const lines = value.replace(/\r\n?/g, "\n").split("\n");
  if (lines.length > 3) fail(code, path, `${path} may contain at most three lines`);
  const normalized = lines.map((line) => line.replace(/[^\S\n]+/gu, " ").trim()).join("\n");
  if (!normalized.trim()) fail(code, path, `${path} must not be empty`);
  return normalized;
}
function normalizeBold(value, code, path) {
  if (value === void 0) return false;
  if (typeof value !== "boolean") fail(code, path, `${path} must be a boolean`);
  return value;
}
function normalizeSets(value) {
  if (!Array.isArray(value) || value.length < 2 || value.length > 3) {
    fail("INVALID_SETS", "sets", "sets must contain exactly two or three entries");
  }
  return value.map((set, index) => {
    const path = `sets[${index}]`;
    if (!isRecord(set)) fail("INVALID_SET", path, `${path} must be an object`);
    const expectedId = ["a", "b", "c"][index];
    if (set.id !== expectedId) {
      fail("INVALID_SET", `${path}.id`, `${path}.id must be ${expectedId}`);
    }
    return {
      id: expectedId,
      label: normalizeText(set.label, "INVALID_LABEL", `${path}.label`),
      bold: normalizeBold(set.bold, "INVALID_SET", `${path}.bold`)
    };
  });
}
function normalizeOverlaps(value, setCount) {
  if (value === void 0) value = {};
  if (!isRecord(value)) fail("INVALID_OVERLAP", "overlaps", "overlaps must be an object");
  const allowed = setCount === 2 ? ["ab"] : ["ab", "ac", "bc", "abc"];
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) {
      fail("INVALID_OVERLAP", `overlaps.${key}`, `overlap ${key} is not valid for ${setCount} sets`);
    }
  }
  const overlaps = /* @__PURE__ */ new Map();
  for (const key of allowed) {
    if (!Object.hasOwn(value, key)) continue;
    const item = value[key];
    const path = `overlaps.${key}`;
    if (!isRecord(item)) fail("INVALID_OVERLAP", path, `${path} must be an object`);
    overlaps.set(key, {
      text: normalizeText(item.text, "INVALID_OVERLAP", `${path}.text`),
      bold: normalizeBold(item.bold, "INVALID_OVERLAP", `${path}.bold`)
    });
  }
  return overlaps;
}
function toHex(value, code, path) {
  try {
    const color = parseColor(value);
    if (color.a !== 1) fail(code, path, `${path} must be a solid color`);
    return `#${[color.r, color.g, color.b].map((channel) => channel.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
  } catch (error) {
    if (error instanceof SpecError) throw error;
    fail(code, path, `${path} must be a supported solid CSS color`);
  }
}
function normalizeStyle(value) {
  if (value === void 0) value = {};
  if (!isRecord(value)) fail("INVALID_STYLE", "style", "style must be an object");
  const providedColors = value.colors === void 0 ? {} : value.colors;
  if (!isRecord(providedColors)) {
    fail("INVALID_COLOR", "style.colors", "style.colors must be an object");
  }
  for (const key of Object.keys(providedColors)) {
    if (!["a", "b", "c"].includes(key)) {
      fail("INVALID_COLOR", `style.colors.${key}`, `unsupported set color ${key}`);
    }
  }
  const colors2 = { ...DEFAULTS.colors };
  for (const key of ["a", "b", "c"]) {
    if (Object.hasOwn(providedColors, key)) {
      colors2[key] = toHex(providedColors[key], "INVALID_COLOR", `style.colors.${key}`);
    }
  }
  const opacity = value.opacity === void 0 ? DEFAULTS.opacity : value.opacity;
  if (typeof opacity !== "number" || !Number.isFinite(opacity) || opacity <= 0 || opacity > 1) {
    fail("INVALID_OPACITY", "style.opacity", "style.opacity must be in (0, 1]");
  }
  const background = value.background === void 0 ? DEFAULTS.background : toHex(value.background, "INVALID_BACKGROUND", "style.background");
  return { colors: colors2, opacity, background };
}
function inferredBasename(sets) {
  const slug = sets.map((set) => set.label).join("-").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  if (!slug) return "venn-diagram";
  return `${slug.slice(0, 76).replace(/-+$/g, "")}-venn`;
}
function normalizeBasename(value, sets) {
  if (value === void 0) return inferredBasename(sets);
  if (typeof value !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,80}$/.test(value) || value.includes("..") || /^(?:CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\.|$)/i.test(value)) {
    fail("INVALID_BASENAME", "output.basename", "output.basename must be a safe file basename");
  }
  return value;
}
function normalizeOutput(value, cwd, sets) {
  if (value === void 0) value = {};
  if (!isRecord(value)) fail("INVALID_OUTPUT", "output", "output must be an object");
  const directory = value.directory === void 0 ? "." : value.directory;
  if (typeof directory !== "string" || !directory.trim()) {
    fail("INVALID_OUTPUT", "output.directory", "output.directory must be a nonempty string");
  }
  const pngLongestSide = value.pngLongestSide === void 0 ? DEFAULTS.pngLongestSide : value.pngLongestSide;
  if (!Number.isInteger(pngLongestSide) || pngLongestSide < 256 || pngLongestSide > 8192) {
    fail("INVALID_PNG_SIZE", "output.pngLongestSide", "output.pngLongestSide must be an integer from 256 to 8192");
  }
  const overwrite = value.overwrite === void 0 ? DEFAULTS.overwrite : value.overwrite;
  if (typeof overwrite !== "boolean") {
    fail("INVALID_OUTPUT", "output.overwrite", "output.overwrite must be a boolean");
  }
  return {
    directory: resolve(cwd, directory),
    basename: normalizeBasename(value.basename, sets),
    pngLongestSide,
    overwrite
  };
}
function normalizeAccessibility(value, sets, overlaps) {
  if (value === void 0) value = {};
  if (!isRecord(value)) {
    fail("INVALID_ACCESSIBILITY", "accessibility", "accessibility must be an object");
  }
  for (const key of ["title", "description"]) {
    if (value[key] !== void 0 && typeof value[key] !== "string") {
      fail("INVALID_ACCESSIBILITY", `accessibility.${key}`, `accessibility.${key} must be a string`);
    }
  }
  const title = value.title ?? `Venn diagram: ${sets.map((set) => set.label).join(", ")}`;
  const namedOverlaps = [...overlaps].map(([key, item]) => {
    const names = sets.filter((set) => key.includes(set.id)).map((set) => set.label);
    return `${names.join(" and ")}: ${item.text}`;
  });
  const description = value.description ?? `Sets: ${sets.map((set) => set.label).join("; ")}.${namedOverlaps.length ? ` Overlaps: ${namedOverlaps.join("; ")}.` : ""}`;
  return { title, description };
}
function normalizeSpec(raw, cwd) {
  if (!isRecord(raw)) fail("INVALID_SPEC", "$", "specification must be a JSON object");
  if (raw.version !== 1) fail("INVALID_VERSION", "version", "version must be 1");
  const sets = normalizeSets(raw.sets);
  const overlaps = normalizeOverlaps(raw.overlaps, sets.length);
  const style = normalizeStyle(raw.style);
  const accessibility = normalizeAccessibility(raw.accessibility, sets, overlaps);
  const output = normalizeOutput(raw.output, cwd, sets);
  return { version: 1, sets, overlaps, style, accessibility, output };
}

// src/cli.mjs
var RENDERER_INFO = Object.freeze({
  name: "venn-diagram-skill",
  rendererVersion: "0.1.0",
  schemaVersion: 1
});
async function main(argv = process.argv.slice(2)) {
  if (argv.length === 1 && argv[0] === "--version") {
    process.stdout.write(`${JSON.stringify(RENDERER_INFO)}
`);
    return 0;
  }
  if (argv.length === 1 && !argv[0].startsWith("-")) {
    const specPath = resolve2(argv[0]);
    try {
      const source = await readFile(specPath, "utf8");
      let raw;
      try {
        raw = JSON.parse(source);
      } catch (error) {
        throw new SpecError("INVALID_JSON", "$", `invalid JSON: ${error.message}`);
      }
      const spec = normalizeSpec(raw, process.cwd());
      process.stdout.write(`${JSON.stringify({
        status: "validated",
        spec: { ...spec, overlaps: Object.fromEntries(spec.overlaps) }
      })}
`);
      return 0;
    } catch (error) {
      const detail = error instanceof SpecError ? error : new SpecError("INPUT_ERROR", "$", "unable to read specification file");
      process.stdout.write(`${JSON.stringify({
        status: "error",
        error: { code: detail.code, path: detail.path, message: detail.message }
      })}
`);
      process.stderr.write(`${error.stack ?? error}
`);
      return 1;
    }
  }
  process.stderr.write("Usage: render-venn.mjs --version | <spec.json>\n");
  return 1;
}

// src/main.mjs
process.exitCode = await main();
