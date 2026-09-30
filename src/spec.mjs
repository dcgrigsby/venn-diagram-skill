import { resolve } from 'node:path';
import { parseColor } from './color.mjs';

export const DEFAULTS = Object.freeze({
  colors: Object.freeze({ a: '#2563EB', b: '#F59E0B', c: '#14B8A6' }),
  opacity: 0.55,
  background: '#FFFFFF',
  pngLongestSide: 1600,
  overwrite: false,
});

export class SpecError extends Error {
  constructor(code, path, message) {
    super(message);
    this.name = 'SpecError';
    this.code = code;
    this.path = path;
  }
}

function fail(code, path, message) {
  throw new SpecError(code, path, message);
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeText(value, code, path) {
  if (typeof value !== 'string') fail(code, path, `${path} must be a string`);
  const lines = value.replace(/\r\n?/g, '\n').split('\n');
  if (lines.length > 3) fail(code, path, `${path} may contain at most three lines`);
  const normalized = lines
    .map((line) => line.replace(/[^\S\n]+/gu, ' ').trim())
    .join('\n');
  if (!normalized.trim()) fail(code, path, `${path} must not be empty`);
  return normalized;
}

function normalizeBold(value, code, path) {
  if (value === undefined) return false;
  if (typeof value !== 'boolean') fail(code, path, `${path} must be a boolean`);
  return value;
}

function normalizeSets(value) {
  if (!Array.isArray(value) || value.length < 2 || value.length > 3) {
    fail('INVALID_SETS', 'sets', 'sets must contain exactly two or three entries');
  }
  return value.map((set, index) => {
    const path = `sets[${index}]`;
    if (!isRecord(set)) fail('INVALID_SET', path, `${path} must be an object`);
    const expectedId = ['a', 'b', 'c'][index];
    if (set.id !== expectedId) {
      fail('INVALID_SET', `${path}.id`, `${path}.id must be ${expectedId}`);
    }
    return {
      id: expectedId,
      label: normalizeText(set.label, 'INVALID_LABEL', `${path}.label`),
      bold: normalizeBold(set.bold, 'INVALID_SET', `${path}.bold`),
    };
  });
}

function normalizeOverlaps(value, setCount) {
  if (value === undefined) value = {};
  if (!isRecord(value)) fail('INVALID_OVERLAP', 'overlaps', 'overlaps must be an object');
  const allowed = setCount === 2 ? ['ab'] : ['ab', 'ac', 'bc', 'abc'];
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) {
      fail('INVALID_OVERLAP', `overlaps.${key}`, `overlap ${key} is not valid for ${setCount} sets`);
    }
  }
  const overlaps = new Map();
  for (const key of allowed) {
    if (!Object.hasOwn(value, key)) continue;
    const item = value[key];
    const path = `overlaps.${key}`;
    if (!isRecord(item)) fail('INVALID_OVERLAP', path, `${path} must be an object`);
    overlaps.set(key, {
      text: normalizeText(item.text, 'INVALID_OVERLAP', `${path}.text`),
      bold: normalizeBold(item.bold, 'INVALID_OVERLAP', `${path}.bold`),
    });
  }
  return overlaps;
}

function toHex(value, code, path) {
  try {
    const color = parseColor(value);
    if (color.a !== 1) fail(code, path, `${path} must be a solid color`);
    return `#${[color.r, color.g, color.b]
      .map((channel) => channel.toString(16).padStart(2, '0'))
      .join('')}`.toUpperCase();
  } catch (error) {
    if (error instanceof SpecError) throw error;
    fail(code, path, `${path} must be a supported solid CSS color`);
  }
}

function normalizeStyle(value) {
  if (value === undefined) value = {};
  if (!isRecord(value)) fail('INVALID_STYLE', 'style', 'style must be an object');
  const providedColors = value.colors === undefined ? {} : value.colors;
  if (!isRecord(providedColors)) {
    fail('INVALID_COLOR', 'style.colors', 'style.colors must be an object');
  }
  for (const key of Object.keys(providedColors)) {
    if (!['a', 'b', 'c'].includes(key)) {
      fail('INVALID_COLOR', `style.colors.${key}`, `unsupported set color ${key}`);
    }
  }
  const colors = { ...DEFAULTS.colors };
  for (const key of ['a', 'b', 'c']) {
    if (Object.hasOwn(providedColors, key)) {
      colors[key] = toHex(providedColors[key], 'INVALID_COLOR', `style.colors.${key}`);
    }
  }
  const opacity = value.opacity === undefined ? DEFAULTS.opacity : value.opacity;
  if (typeof opacity !== 'number' || !Number.isFinite(opacity) || opacity <= 0 || opacity > 1) {
    fail('INVALID_OPACITY', 'style.opacity', 'style.opacity must be in (0, 1]');
  }
  const background = value.background === undefined
    ? DEFAULTS.background
    : toHex(value.background, 'INVALID_BACKGROUND', 'style.background');
  return { colors, opacity, background };
}

function inferredBasename(sets) {
  const slug = sets.map((set) => set.label)
    .join('-')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (!slug) return 'venn-diagram';
  return `${slug.slice(0, 76).replace(/-+$/g, '')}-venn`;
}

function normalizeBasename(value, sets) {
  if (value === undefined) return inferredBasename(sets);
  if (typeof value !== 'string'
    || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,80}$/.test(value)
    || value.includes('..')
    || /^(?:CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\.|$)/i.test(value)) {
    fail('INVALID_BASENAME', 'output.basename', 'output.basename must be a safe file basename');
  }
  return value;
}

function normalizeOutput(value, cwd, sets) {
  if (value === undefined) value = {};
  if (!isRecord(value)) fail('INVALID_OUTPUT', 'output', 'output must be an object');
  const directory = value.directory === undefined ? '.' : value.directory;
  if (typeof directory !== 'string' || !directory.trim()) {
    fail('INVALID_OUTPUT', 'output.directory', 'output.directory must be a nonempty string');
  }
  const pngLongestSide = value.pngLongestSide === undefined
    ? DEFAULTS.pngLongestSide : value.pngLongestSide;
  if (!Number.isInteger(pngLongestSide) || pngLongestSide < 256 || pngLongestSide > 8192) {
    fail('INVALID_PNG_SIZE', 'output.pngLongestSide', 'output.pngLongestSide must be an integer from 256 to 8192');
  }
  const overwrite = value.overwrite === undefined ? DEFAULTS.overwrite : value.overwrite;
  if (typeof overwrite !== 'boolean') {
    fail('INVALID_OUTPUT', 'output.overwrite', 'output.overwrite must be a boolean');
  }
  return {
    directory: resolve(cwd, directory),
    basename: normalizeBasename(value.basename, sets),
    pngLongestSide,
    overwrite,
  };
}

function normalizeAccessibility(value, sets, overlaps) {
  if (value === undefined) value = {};
  if (!isRecord(value)) {
    fail('INVALID_ACCESSIBILITY', 'accessibility', 'accessibility must be an object');
  }
  for (const key of ['title', 'description']) {
    if (value[key] !== undefined && typeof value[key] !== 'string') {
      fail('INVALID_ACCESSIBILITY', `accessibility.${key}`, `accessibility.${key} must be a string`);
    }
  }
  const title = value.title ?? `Venn diagram: ${sets.map((set) => set.label).join(', ')}`;
  const namedOverlaps = [...overlaps].map(([key, item]) => {
    const names = sets.filter((set) => key.includes(set.id)).map((set) => set.label);
    return `${names.join(' and ')}: ${item.text}`;
  });
  const description = value.description ?? `Sets: ${sets.map((set) => set.label).join('; ')}.${
    namedOverlaps.length ? ` Overlaps: ${namedOverlaps.join('; ')}.` : ''
  }`;
  return { title, description };
}

export function normalizeSpec(raw, cwd) {
  if (!isRecord(raw)) fail('INVALID_SPEC', '$', 'specification must be a JSON object');
  if (raw.version !== 1) fail('INVALID_VERSION', 'version', 'version must be 1');
  const sets = normalizeSets(raw.sets);
  const overlaps = normalizeOverlaps(raw.overlaps, sets.length);
  const style = normalizeStyle(raw.style);
  const accessibility = normalizeAccessibility(raw.accessibility, sets, overlaps);
  const output = normalizeOutput(raw.output, cwd, sets);
  return { version: 1, sets, overlaps, style, accessibility, output };
}
