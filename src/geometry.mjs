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
