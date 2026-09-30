import {
  CANVAS_PADDING, DIAGRAM_FONT_SIZE, LABEL_PADDING, MAX_LINE_EM, STROKE_WIDTH,
} from './constants.mjs';
import { boxFitsRegion } from './geometry.mjs';
import { outlineColor, parseColor } from './color.mjs';
import { measureLine, TypographyError, wrapCandidates } from './typography.mjs';

const TWO_LIMITS = Object.freeze({
  minRadius: 180,
  maxRadius: 640,
  radiusStep: 8,
  minRatio: 0.8,
  maxRatio: 1.45,
  ratioStep: 0.025,
  gridRule: 'max(4, radius / 40)',
});

function labelsInOrder(spec) {
  return [
    ...spec.sets.map((set) => ({ key: set.id, text: set.label, bold: set.bold })),
    ...[...spec.overlaps].map(([key, overlap]) => ({ key, ...overlap })),
  ];
}

function twoCircles(radius, distance, style) {
  return ['a', 'b'].map((id, index) => {
    const fill = style.colors[id];
    return {
      id,
      cx: (index === 0 ? -1 : 1) * distance / 2,
      cy: 0,
      r: radius,
      fill,
      stroke: outlineColor(parseColor(fill)),
    };
  });
}

function centerBounds(key, circles, width, height, margin) {
  const [a, b] = circles;
  const r = a.r - margin;
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const mid = (a.cx + b.cx) / 2;
  if (key === 'a') {
    return {
      minX: a.cx - r + halfWidth,
      maxX: Math.min(a.cx + r - halfWidth, mid - halfWidth),
      minY: -r + halfHeight,
      maxY: r - halfHeight,
    };
  }
  if (key === 'b') {
    return {
      minX: Math.max(b.cx - r + halfWidth, mid + halfWidth),
      maxX: b.cx + r - halfWidth,
      minY: -r + halfHeight,
      maxY: r - halfHeight,
    };
  }
  const lensHalfHeight = Math.sqrt(Math.max(0, r ** 2 - (b.cx - a.cx) ** 2 / 4));
  return {
    minX: b.cx - r + halfWidth,
    maxX: a.cx + r - halfWidth,
    minY: -lensHalfHeight + halfHeight,
    maxY: lensHalfHeight - halfHeight,
  };
}

function preferredAnchor(key, circles) {
  const [a, b] = circles;
  const distance = b.cx - a.cx;
  if (key === 'a') return { x: a.cx - a.r + distance / 2, y: 0 };
  if (key === 'b') return { x: b.cx + b.r - distance / 2, y: 0 };
  return { x: (a.cx + b.cx) / 2, y: 0 };
}

function findBox(key, candidate, circles, grid) {
  const { width, height } = candidate;
  const bounds = centerBounds(key, circles, width, height, LABEL_PADDING);
  if (bounds.minX > bounds.maxX || bounds.minY > bounds.maxY) return null;
  const anchor = preferredAnchor(key, circles);
  const asBox = (x, y) => ({ x: x - width / 2, y: y - height / 2, width, height });
  if (anchor.x >= bounds.minX && anchor.x <= bounds.maxX
    && anchor.y >= bounds.minY && anchor.y <= bounds.maxY) {
    const box = asBox(anchor.x, anchor.y);
    if (boxFitsRegion(box, key, circles, LABEL_PADDING)) return box;
  }

  const minIx = Math.ceil((bounds.minX - anchor.x) / grid);
  const maxIx = Math.floor((bounds.maxX - anchor.x) / grid);
  const minIy = Math.ceil((bounds.minY - anchor.y) / grid);
  const maxIy = Math.floor((bounds.maxY - anchor.y) / grid);
  let best = null;
  let bestDistance = Infinity;
  for (let ix = minIx; ix <= maxIx; ix += 1) {
    const x = anchor.x + ix * grid;
    for (let iy = minIy; iy <= maxIy; iy += 1) {
      const distance = ix ** 2 + iy ** 2;
      if (distance >= bestDistance) continue;
      const y = anchor.y + iy * grid;
      const box = asBox(x, y);
      if (boxFitsRegion(box, key, circles, LABEL_PADDING)) {
        best = box;
        bestDistance = distance;
      }
    }
  }
  return best;
}

function preparedLabels(spec, fonts) {
  return labelsInOrder(spec).map((label) => {
    try {
      return { ...label, candidates: wrapCandidates(label.text, label.bold, DIAGRAM_FONT_SIZE, fonts) };
    } catch (error) {
      if (!(error instanceof TypographyError) || error.code !== 'LABEL_TOO_LONG') throw error;
      return { ...label, candidates: [] };
    }
  });
}

function maximumFitWidth(key) {
  const r = TWO_LIMITS.maxRadius;
  const d = TWO_LIMITS.maxRatio * r;
  const geometric = key === 'ab' ? 2 * r - TWO_LIMITS.minRatio * r - 2 * LABEL_PADDING
    : d - 2 * LABEL_PADDING;
  return Math.min(DIAGRAM_FONT_SIZE * MAX_LINE_EM, Math.floor(geometric));
}

function revisionRegion(label, fonts) {
  const explicitLines = label.text.split('\n');
  const measuredWidth = Math.max(...explicitLines.map((line) =>
    measureLine(line, label.bold, DIAGRAM_FONT_SIZE, fonts)));
  const maxFitWidth = maximumFitWidth(label.key);
  const characters = [...label.text.replace(/\s+/gu, '')].length;
  const averageGlyphWidth = Math.max(1, measuredWidth / Math.max(1, characters));
  const upper = Math.max(1, Math.floor(maxFitWidth / averageGlyphWidth));
  return {
    key: label.key,
    measuredWidth,
    maxFitWidth,
    targetChars: [Math.max(1, Math.floor(upper * 0.75)), upper],
  };
}

function needsRevision(labels, spec, fonts) {
  const radius = TWO_LIMITS.maxRadius;
  const grid = Math.max(4, radius / 40);
  const limiting = labels.filter((label) => {
    if (!label.candidates.length) return true;
    for (let ratioIndex = 0; ratioIndex <= 26; ratioIndex += 1) {
      const ratio = TWO_LIMITS.minRatio + ratioIndex * TWO_LIMITS.ratioStep;
      const circles = twoCircles(radius, ratio * radius, spec.style);
      if (label.candidates.some((candidate) => findBox(label.key, candidate, circles, grid))) {
        return false;
      }
    }
    return true;
  });
  return {
    status: 'needs_revision',
    regions: (limiting.length ? limiting : labels).map((label) => revisionRegion(label, fonts)),
    attemptedLimits: TWO_LIMITS,
  };
}

function finalLayout(circles, labels, spec) {
  const inset = CANVAS_PADDING + STROKE_WIDTH / 2;
  const minX = Math.min(...circles.map((circle) => circle.cx - circle.r));
  const minY = Math.min(...circles.map((circle) => circle.cy - circle.r));
  const maxX = Math.max(...circles.map((circle) => circle.cx + circle.r));
  const maxY = Math.max(...circles.map((circle) => circle.cy + circle.r));
  const shiftX = inset - minX;
  const shiftY = inset - minY;
  return {
    width: maxX - minX + 2 * inset,
    height: maxY - minY + 2 * inset,
    circles: circles.map((circle) => ({ ...circle, cx: circle.cx + shiftX, cy: circle.cy + shiftY })),
    labels: labels.map((label) => ({
      ...label,
      box: { ...label.box, x: label.box.x + shiftX, y: label.box.y + shiftY },
    })),
    background: spec.style.background,
    warnings: [],
  };
}

export function layoutDiagram(spec, fonts) {
  if (spec.sets.length !== 2) throw new RangeError('layout supports exactly two sets');
  const labels = preparedLabels(spec, fonts);
  if (labels.some((label) => label.candidates.length === 0)) {
    return needsRevision(labels, spec, fonts);
  }

  for (let radius = TWO_LIMITS.minRadius; radius <= TWO_LIMITS.maxRadius;
    radius = Math.min(radius + TWO_LIMITS.radiusStep, TWO_LIMITS.maxRadius)) {
    for (let ratioIndex = 0; ratioIndex <= 26; ratioIndex += 1) {
      const ratio = TWO_LIMITS.minRatio + ratioIndex * TWO_LIMITS.ratioStep;
      const circles = twoCircles(radius, ratio * radius, spec.style);
      const grid = Math.max(4, radius / 40);
      const placed = [];
      for (const label of labels) {
        let chosen = null;
        for (const candidate of label.candidates) {
          const box = findBox(label.key, candidate, circles, grid);
          if (box) {
            chosen = { key: label.key, text: label.text, bold: label.bold,
              lines: candidate.lines, fontSize: candidate.fontSize,
              lineHeight: candidate.lineHeight, box };
            break;
          }
        }
        if (chosen) {
          placed.push(chosen);
        } else break;
      }
      if (placed.length === labels.length) {
        // At fixed radius, area grows strictly with the ascending distance ratio.
        // The first feasible ratio therefore wins before the tie-breakers apply.
        return finalLayout(circles, placed, spec);
      }
    }
    if (radius === TWO_LIMITS.maxRadius) break;
  }
  return needsRevision(labels, spec, fonts);
}
