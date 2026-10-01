import {
  CANVAS_PADDING, DIAGRAM_FONT_SIZE, LABEL_PADDING, MAX_LINE_EM, STROKE_WIDTH,
} from './constants.mjs';
import { boxFitsRegion, regionPointBounds } from './geometry.mjs';
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
const THREE_LIMITS = Object.freeze({
  minRadius: 200,
  maxRadius: 720,
  radiusStep: 8,
  minRatio: 0.72,
  maxRatio: 1.25,
  ratioStep: 0.025,
  gridRule: 'max(4, radius / 40)',
});

function ratioCount(limits) {
  return Math.floor((limits.maxRatio - limits.minRatio) / limits.ratioStep + 1e-9);
}

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

function threeCircles(radius, distance, style) {
  const positions = [
    { id: 'a', cx: -distance / 2, cy: -distance / (2 * Math.sqrt(3)) },
    { id: 'b', cx: distance / 2, cy: -distance / (2 * Math.sqrt(3)) },
    { id: 'c', cx: 0, cy: distance / Math.sqrt(3) },
  ];
  return positions.map((position) => {
    const fill = style.colors[position.id];
    return { ...position, r: radius, fill, stroke: outlineColor(parseColor(fill)) };
  });
}

function centerBounds(key, circles, width, height, margin) {
  if (circles.length === 3) {
    const bounds = regionPointBounds(key, circles, margin);
    if (!bounds) return null;
    return {
      minX: bounds.minX + width / 2,
      maxX: bounds.maxX - width / 2,
      minY: bounds.minY + height / 2,
      maxY: bounds.maxY - height / 2,
    };
  }
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
  if (circles.length === 3) {
    if (key.length === 3) return { x: 0, y: 0 };
    if (key.length === 1) {
      const circle = circles.find(({ id }) => id === key);
      const length = Math.hypot(circle.cx, circle.cy);
      return {
        x: circle.cx + circle.r * 0.45 * circle.cx / length,
        y: circle.cy + circle.r * 0.45 * circle.cy / length,
      };
    }
    const included = circles.filter(({ id }) => key.includes(id));
    const excluded = circles.find(({ id }) => !key.includes(id));
    const midpoint = {
      x: (included[0].cx + included[1].cx) / 2,
      y: (included[0].cy + included[1].cy) / 2,
    };
    const dx = midpoint.x - excluded.cx;
    const dy = midpoint.y - excluded.cy;
    const length = Math.hypot(dx, dy);
    const offset = Math.max(0, included[0].r - length + included[0].r * 0.18);
    return { x: midpoint.x + offset * dx / length, y: midpoint.y + offset * dy / length };
  }
  const [a, b] = circles;
  const distance = b.cx - a.cx;
  if (key === 'a') return { x: a.cx - a.r + distance / 2, y: 0 };
  if (key === 'b') return { x: b.cx + b.r - distance / 2, y: 0 };
  return { x: (a.cx + b.cx) / 2, y: 0 };
}

function findBox(key, candidate, circles, grid) {
  const { width, height } = candidate;
  const bounds = centerBounds(key, circles, width, height, LABEL_PADDING);
  if (!bounds || bounds.minX > bounds.maxX || bounds.minY > bounds.maxY) return null;
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
      if (error instanceof TypographyError && error.code === 'UNSUPPORTED_GLYPH') {
        error.path = label.key.length === 1
          ? `sets[${spec.sets.findIndex((set) => set.id === label.key)}].label`
          : `overlaps.${label.key}.text`;
      }
      if (!(error instanceof TypographyError) || error.code !== 'LABEL_TOO_LONG') throw error;
      return { ...label, candidates: [] };
    }
  });
}

function maximumFitWidth(key, setCount) {
  if (setCount === 3) {
    const r = THREE_LIMITS.maxRadius;
    let width = 0;
    for (let ratioIndex = 0; ratioIndex <= ratioCount(THREE_LIMITS); ratioIndex += 1) {
      const distance = (THREE_LIMITS.minRatio + ratioIndex * THREE_LIMITS.ratioStep) * r;
      const circles = threeCircles(r, distance, { colors: { a: '#000000', b: '#000000', c: '#000000' } });
      const bounds = regionPointBounds(key, circles, LABEL_PADDING);
      if (bounds) width = Math.max(width, bounds.maxX - bounds.minX);
    }
    return Math.min(DIAGRAM_FONT_SIZE * MAX_LINE_EM, Math.floor(width));
  }
  const r = TWO_LIMITS.maxRadius;
  const d = TWO_LIMITS.maxRatio * r;
  const geometric = key === 'ab' ? 2 * r - TWO_LIMITS.minRatio * r - 2 * LABEL_PADDING
    : d - 2 * LABEL_PADDING;
  return Math.min(DIAGRAM_FONT_SIZE * MAX_LINE_EM, Math.floor(geometric));
}

function revisionRegion(label, fonts, setCount) {
  const explicitLines = label.text.split('\n');
  const widest = explicitLines.map((line) => ({
    line,
    width: measureLine(line, label.bold, DIAGRAM_FONT_SIZE, fonts),
  })).reduce((first, second) => second.width > first.width ? second : first);
  const measuredWidth = widest.width;
  const maxFitWidth = maximumFitWidth(label.key, setCount);
  const characters = [...widest.line.replace(/\s+/gu, '')].length;
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
  const setCount = spec.sets.length;
  const limits = setCount === 3 ? THREE_LIMITS : TWO_LIMITS;
  const makeCircles = setCount === 3 ? threeCircles : twoCircles;
  const radius = limits.maxRadius;
  const grid = Math.max(4, radius / 40);
  const limiting = labels.filter((label) => {
    if (!label.candidates.length) return true;
    for (let ratioIndex = 0; ratioIndex <= ratioCount(limits); ratioIndex += 1) {
      const ratio = limits.minRatio + ratioIndex * limits.ratioStep;
      const circles = makeCircles(radius, ratio * radius, spec.style);
      if (label.candidates.some((candidate) => findBox(label.key, candidate, circles, grid))) {
        return false;
      }
    }
    return true;
  });
  return {
    status: 'needs_revision',
    regions: (limiting.length ? limiting : labels).map((label) =>
      revisionRegion(label, fonts, setCount)),
    attemptedLimits: limits,
  };
}

function compareScores(first, second) {
  if (first.area !== second.area) return first.area - second.area;
  if (first.ratioDeviation !== second.ratioDeviation) {
    return first.ratioDeviation - second.ratioDeviation;
  }
  for (let i = 0; i < first.wrapRanks.length; i += 1) {
    if (first.wrapRanks[i] !== second.wrapRanks[i]) {
      return first.wrapRanks[i] - second.wrapRanks[i];
    }
  }
  for (let i = 0; i < first.coordinates.length; i += 1) {
    if (first.coordinates[i] !== second.coordinates[i]) {
      return first.coordinates[i] - second.coordinates[i];
    }
  }
  return 0;
}

function layoutThree(spec, labels) {
  for (let radius = THREE_LIMITS.minRadius; radius <= THREE_LIMITS.maxRadius;
    radius += THREE_LIMITS.radiusStep) {
    let best = null;
    for (let ratioIndex = 0; ratioIndex <= ratioCount(THREE_LIMITS); ratioIndex += 1) {
      const ratio = THREE_LIMITS.minRatio + ratioIndex * THREE_LIMITS.ratioStep;
      const circles = threeCircles(radius, ratio * radius, spec.style);
      const inset = CANVAS_PADDING + STROKE_WIDTH / 2;
      const width = 2 * radius + ratio * radius + 2 * inset;
      const height = 2 * radius + Math.sqrt(3) * ratio * radius / 2 + 2 * inset;
      const area = width * height;
      if (best && area > best.score.area) break;
      const grid = Math.max(4, radius / 40);
      const placed = [];
      const wrapRanks = [];
      for (const label of labels) {
        let chosen = null;
        for (let rank = 0; rank < label.candidates.length; rank += 1) {
          const candidate = label.candidates[rank];
          const box = findBox(label.key, candidate, circles, grid);
          if (box) {
            chosen = { key: label.key, text: label.text, bold: label.bold,
              lines: candidate.lines, fontSize: candidate.fontSize,
              lineHeight: candidate.lineHeight, box };
            wrapRanks.push(rank);
            break;
          }
        }
        if (!chosen) break;
        placed.push(chosen);
      }
      if (placed.length !== labels.length) continue;
      const score = {
        area,
        ratioDeviation: Math.abs(ratio - 0.92),
        wrapRanks,
        coordinates: placed.flatMap(({ box }) => [box.x, box.y]),
      };
      if (!best || compareScores(score, best.score) < 0) best = { circles, placed, score };
    }
    if (best) return finalLayout(best.circles, best.placed, spec);
  }
  return null;
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
    opacity: spec.style.opacity,
    warnings: [],
  };
}

export function layoutDiagram(spec, fonts) {
  if (spec.sets.length !== 2 && spec.sets.length !== 3) {
    throw new RangeError('layout supports exactly two or three sets');
  }
  const labels = preparedLabels(spec, fonts);
  if (labels.some((label) => label.candidates.length === 0)) {
    return needsRevision(labels, spec, fonts);
  }

  if (spec.sets.length === 3) return layoutThree(spec, labels) ?? needsRevision(labels, spec, fonts);

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
