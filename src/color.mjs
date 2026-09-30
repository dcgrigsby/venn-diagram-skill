import cssColors from 'color-name';

const CIRCLE_ORDER = ['a', 'b', 'c'];
const TEXT_COLORS = ['#000000', '#FFFFFF'];

export function parseColor(value) {
  if (typeof value !== 'string') throw new TypeError('Color must be a string');

  const hex = /^#([\da-f]{3}|[\da-f]{6})$/i.exec(value);
  if (hex) {
    const digits = hex[1].length === 3
      ? [...hex[1]].map((digit) => digit + digit).join('')
      : hex[1];
    return {
      r: Number.parseInt(digits.slice(0, 2), 16),
      g: Number.parseInt(digits.slice(2, 4), 16),
      b: Number.parseInt(digits.slice(4, 6), 16),
      a: 1,
    };
  }

  const name = value.toLowerCase();
  if (Object.hasOwn(cssColors, name)) {
    const named = cssColors[name];
    return { r: named[0], g: named[1], b: named[2], a: 1 };
  }

  throw new TypeError(`Unsupported CSS color: ${value}`);
}

export function composite(foreground, background) {
  const alpha = foreground.a + background.a * (1 - foreground.a);
  if (alpha === 0) return { r: 0, g: 0, b: 0, a: 0 };

  const channel = (key) => (
    foreground[key] * foreground.a
    + background[key] * background.a * (1 - foreground.a)
  ) / alpha;

  return { r: channel('r'), g: channel('g'), b: channel('b'), a: alpha };
}

export function regionBackground(regionKey, circleColors, opacity, background) {
  let result = background;
  for (const key of CIRCLE_ORDER) {
    if (regionKey.includes(key) && circleColors.has(key)) {
      const fill = circleColors.get(key);
      result = composite({ ...fill, a: fill.a * opacity }, result);
    }
  }
  return {
    r: Math.round(result.r),
    g: Math.round(result.g),
    b: Math.round(result.b),
    a: result.a,
  };
}

function relativeLuminance({ r, g, b }) {
  const linearize = (value) => {
    const channel = value / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

function contrastRatio(foreground, background) {
  const first = relativeLuminance(foreground);
  const second = relativeLuminance(background);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

export function chooseGlobalTextColor(regionBackgrounds) {
  const candidates = TEXT_COLORS;
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
}

export function outlineColor(fill) {
  const darken = (channel) => Math.round(channel * 0.65);
  return `rgba(${darken(fill.r)}, ${darken(fill.g)}, ${darken(fill.b)}, 0.9)`;
}
