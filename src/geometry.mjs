function squaredDistance(x1, y1, x2, y2) {
  return (x1 - x2) ** 2 + (y1 - y2) ** 2;
}

function includesCircle(regionKey, circle) {
  return regionKey.includes(circle.id);
}

export function pointInRegion(point, regionKey, circles, margin = 0) {
  for (const circle of circles) {
    const required = includesCircle(regionKey, circle);
    const radius = circle.r + (required ? -margin : margin);
    const distanceSquared = squaredDistance(point.x, point.y, circle.cx, circle.cy);
    if (required ? radius < 0 || distanceSquared > radius ** 2
      : distanceSquared < radius ** 2) return false;
  }
  return true;
}

export function boxFitsRegion(box, regionKey, circles, padding = 0) {
  const left = box.x;
  const right = box.x + box.width;
  const top = box.y;
  const bottom = box.y + box.height;
  for (const circle of circles) {
    const required = includesCircle(regionKey, circle);
    const radius = circle.r + (required ? -padding : padding);
    if (required) {
      if (radius < 0) return false;
      for (const x of [left, right]) {
        for (const y of [top, bottom]) {
          if (squaredDistance(x, y, circle.cx, circle.cy) > radius ** 2) return false;
        }
      }
    } else {
      const nearestX = Math.max(left, Math.min(circle.cx, right));
      const nearestY = Math.max(top, Math.min(circle.cy, bottom));
      if (squaredDistance(nearestX, nearestY, circle.cx, circle.cy) < radius ** 2) {
        return false;
      }
    }
  }
  return true;
}

// The extrema of a disk Boolean region occur at a cardinal point of a
// boundary circle or at an intersection of two boundary circles.
export function regionPointBounds(regionKey, circles, padding = 0) {
  const boundaries = circles.map((circle) => ({
    cx: circle.cx,
    cy: circle.cy,
    r: circle.r + (includesCircle(regionKey, circle) ? -padding : padding),
    required: includesCircle(regionKey, circle),
  }));
  const points = [];
  for (const circle of boundaries) {
    if (circle.r < 0) return null;
    points.push(
      { x: circle.cx - circle.r, y: circle.cy },
      { x: circle.cx + circle.r, y: circle.cy },
      { x: circle.cx, y: circle.cy - circle.r },
      { x: circle.cx, y: circle.cy + circle.r },
    );
  }
  for (let i = 0; i < boundaries.length; i += 1) {
    for (let j = i + 1; j < boundaries.length; j += 1) {
      const first = boundaries[i];
      const second = boundaries[j];
      const dx = second.cx - first.cx;
      const dy = second.cy - first.cy;
      const distance = Math.hypot(dx, dy);
      if (distance === 0 || distance > first.r + second.r
        || distance < Math.abs(first.r - second.r)) continue;
      const along = (first.r ** 2 - second.r ** 2 + distance ** 2) / (2 * distance);
      const perpendicular = Math.sqrt(Math.max(0, first.r ** 2 - along ** 2));
      const x = first.cx + along * dx / distance;
      const y = first.cy + along * dy / distance;
      points.push(
        { x: x - perpendicular * dy / distance, y: y + perpendicular * dx / distance },
        { x: x + perpendicular * dy / distance, y: y - perpendicular * dx / distance },
      );
    }
  }
  const epsilon = 1e-7;
  const valid = points.filter((point) => boundaries.every((circle) => {
    const distance = Math.hypot(point.x - circle.cx, point.y - circle.cy);
    return circle.required ? distance <= circle.r + epsilon : distance >= circle.r - epsilon;
  }));
  if (!valid.length) return null;
  return {
    minX: Math.min(...valid.map(({ x }) => x)),
    maxX: Math.max(...valid.map(({ x }) => x)),
    minY: Math.min(...valid.map(({ y }) => y)),
    maxY: Math.max(...valid.map(({ y }) => y)),
  };
}
