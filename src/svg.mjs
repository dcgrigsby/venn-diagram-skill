import { STROKE_WIDTH } from './constants.mjs';
import { chooseGlobalTextColor, parseColor, regionBackground } from './color.mjs';

const escapeXml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;',
})[character]);
const number = (value) => String(Number(value.toFixed(3)));

function labelBaseline(label, font) {
  const scale = label.fontSize / font.unitsPerEm;
  const ascent = font.ascender * scale;
  const descent = font.descender * scale;
  const blockHeight = ascent - descent + (label.lines.length - 1) * label.lineHeight;
  return label.box.y + label.box.height / 2 - blockHeight / 2 + ascent;
}

export function serializeSvg(layout, fonts, accessibility) {
  const { width, height, circles, labels, background, opacity } = layout;
  const circleColors = new Map(circles.map((circle) => [circle.id, parseColor(circle.fill)]));
  const backgrounds = labels.map((label) => regionBackground(
    label.key, circleColors, opacity, parseColor(background),
  ));
  const textColor = chooseGlobalTextColor(backgrounds).color;
  const fontData = fonts.buffers.map((buffer, index) =>
    `@font-face { font-family: 'Noto Sans'; font-weight: ${index ? 700 : 400}; src: url(data:font/ttf;base64,${buffer.toString('base64')}) format('truetype'); }`);
  const parts = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<svg xmlns="http://www.w3.org/2000/svg" width="${number(width)}" height="${number(height)}" viewBox="0 0 ${number(width)} ${number(height)}" role="img" aria-labelledby="venn-title venn-desc">`,
    `<title id="venn-title">${escapeXml(accessibility.title)}</title>`,
    `<desc id="venn-desc">${escapeXml(accessibility.description)}</desc>`,
    `<style>${fontData.join('\n')}</style>`,
    `<rect x="0" y="0" width="${number(width)}" height="${number(height)}" fill="${escapeXml(background)}"/>`,
  ];
  for (const circle of circles) {
    parts.push(`<circle data-set="${escapeXml(circle.id)}" cx="${number(circle.cx)}" cy="${number(circle.cy)}" r="${number(circle.r)}" fill="${escapeXml(circle.fill)}" fill-opacity="${opacity}" stroke="${escapeXml(circle.stroke)}" stroke-width="${STROKE_WIDTH}"/>`);
  }
  for (const label of labels) {
    const x = number(label.box.x + label.box.width / 2);
    const font = label.bold ? fonts.bold : fonts.regular;
    const y = number(labelBaseline(label, font));
    const rows = label.lines.map((line, index) =>
      `<tspan x="${x}" dy="${index ? number(label.lineHeight) : 0}">${escapeXml(line)}</tspan>`).join('');
    parts.push(`<text data-region="${escapeXml(label.key)}" x="${x}" y="${y}" font-family="Noto Sans" font-size="${number(label.fontSize)}" font-weight="${label.bold ? 700 : 400}" text-anchor="middle" fill="${textColor}">${rows}</text>`);
  }
  parts.push('</svg>');
  return `${parts.join('\n')}\n`;
}
