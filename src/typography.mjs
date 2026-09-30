import { readFile } from 'node:fs/promises';
import opentype from 'opentype.js';
import {
  LINE_HEIGHT_RATIO,
  MAX_LINE_EM,
  TEXT_WIDTH_SAFETY,
  TEXT_WIDTH_SAFETY_PX,
} from './constants.mjs';

export class TypographyError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'TypographyError';
    this.code = code;
  }
}

export async function loadFonts({ regular, bold }) {
  let buffers;
  let fonts;
  try {
    buffers = await Promise.all([readFile(regular), readFile(bold)]);
    fonts = buffers.map((buffer) => opentype.parse(
      buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
    ));
  } catch (error) {
    throw new TypographyError('FONT_LOAD_FAILED', `unable to load bundled fonts: ${error.message}`);
  }
  return { regular: fonts[0], bold: fonts[1], buffers };
}

export function validateGlyphs(text, font) {
  return [...new Set([...text].filter((character) =>
    character !== '\n' && character !== '\r' && font.charToGlyphIndex(character) === 0,
  ))];
}

export function measureLine(text, bold, fontSize, fonts) {
  const font = bold ? fonts.bold : fonts.regular;
  const measuredWidth = font.getAdvanceWidth(text, fontSize, { kerning: true });
  return measuredWidth * TEXT_WIDTH_SAFETY + TEXT_WIDTH_SAFETY_PX;
}

function phraseBoundaryScore(lines) {
  return lines.slice(0, -1).reduce((score, line) =>
    score + (/[,;:/&-]$/u.test(line) ? 1 : 0), 0);
}

function partitions(words, lineCount, maxWidth, bold, fontSize, fonts) {
  const result = [];
  function visit(start, lines) {
    if (lines.length === lineCount) {
      if (start === words.length) result.push(lines);
      return;
    }
    const remaining = lineCount - lines.length - 1;
    let line = '';
    for (let end = start + 1; end <= words.length - remaining; end += 1) {
      line = line ? `${line} ${words[end - 1]}` : words[end - 1];
      if (measureLine(line, bold, fontSize, fonts) > maxWidth) break;
      visit(end, [...lines, line]);
    }
  }
  visit(0, []);
  return result;
}

export function wrapCandidates(text, bold, fontSize, fonts) {
  const font = bold ? fonts.bold : fonts.regular;
  const unsupported = validateGlyphs(text, font);
  if (unsupported.length) {
    throw new TypographyError('UNSUPPORTED_GLYPH',
      `label contains unsupported glyphs: ${unsupported.join(' ')}`);
  }

  const normalized = text.replace(/\r\n?/g, '\n');
  const explicitLines = normalized.split('\n');
  if (!normalized || explicitLines.length > 3 || explicitLines.some((line) => !line.trim())) {
    throw new TypographyError('LABEL_TOO_LONG', 'label must have one to three nonempty lines');
  }

  const maxWidth = fontSize * MAX_LINE_EM;
  const lineSets = normalized.includes('\n')
    ? [explicitLines]
    : [1, 2, 3].flatMap((lineCount) =>
      partitions(normalized.trim().split(/\s+/u), lineCount, maxWidth, bold, fontSize, fonts));
  const candidates = lineSets.map((lines) => {
    const widths = lines.map((line) => measureLine(line, bold, fontSize, fonts));
    const width = Math.max(...widths);
    const mean = widths.reduce((sum, value) => sum + value, 0) / widths.length;
    const imbalance = widths.reduce((sum, value) => sum + (value - mean) ** 2, 0);
    return {
      lines,
      width,
      height: lines.length * fontSize * LINE_HEIGHT_RATIO,
      fontSize,
      lineHeight: fontSize * LINE_HEIGHT_RATIO,
      imbalance,
      phraseScore: phraseBoundaryScore(lines),
    };
  }).filter((candidate) => candidate.width <= maxWidth);

  if (!candidates.length) {
    throw new TypographyError('LABEL_TOO_LONG', 'label cannot fit within three lines');
  }
  candidates.sort((a, b) => {
    const firstFour = a.lines.length - b.lines.length
      || a.width - b.width
      || a.imbalance - b.imbalance
      || b.phraseScore - a.phraseScore;
    if (firstFour) return firstFour;
    const aText = a.lines.join('\n');
    const bText = b.lines.join('\n');
    return aText < bText ? -1 : aText > bText ? 1 : 0;
  });
  return candidates.map(({ imbalance, phraseScore, ...candidate }) => candidate);
}
