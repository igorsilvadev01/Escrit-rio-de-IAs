/* Geometry of the compact reference room; independent of saved office data. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.FirmaCozyModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const width = 1000,
    height = 563,
    radius = 8,
    step = 8,
    spawn = { x: 500, y: 430 };
  const obstacles = [
    { x: 0, y: 0, w: 1000, h: 179 },
    { x: 0, y: 185, w: 87, h: 137 },
    { x: 915, y: 183, w: 85, h: 140 },
    { x: 70, y: 302, w: 216, h: 207 },
    { x: 289, y: 382, w: 92, h: 123 },
    { x: 694, y: 209, w: 187, h: 126 },
    { x: 640, y: 362, w: 286, h: 181 },
  ];
  function walkable(x, y) {
    return (
      Number.isFinite(x) &&
      Number.isFinite(y) &&
      x >= radius &&
      x <= width - radius &&
      y >= 180 + radius &&
      y <= height - radius &&
      !obstacles.some(
        (o) =>
          x > o.x - radius && x < o.x + o.w + radius && y > o.y - radius && y < o.y + o.h + radius,
      )
    );
  }
  function move(p, dx, dy) {
    let x = p.x,
      y = p.y;
    const n = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 4));
    for (let i = 0; i < n; i++) {
      if (walkable(x + dx / n, y)) x += dx / n;
      if (walkable(x, y + dy / n)) y += dy / n;
    }
    return { x, y };
  }
  function nearest(p) {
    if (walkable(p.x, p.y)) return { x: p.x, y: p.y };
    let best = null;
    for (let y = 192; y <= height - radius; y += step)
      for (let x = radius; x <= width - radius; x += step) {
        if (!walkable(x, y)) continue;
        const d = Math.hypot(x - p.x, y - p.y);
        if (!best || d < best.d) best = { x, y, d };
      }
    return best ? { x: best.x, y: best.y } : null;
  }
  function clear(a, b) {
    const n = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 4);
    for (let i = 0; i <= n; i++)
      if (
        !walkable(
          a.x + ((b.x - a.x) * i) / Math.max(1, n),
          a.y + ((b.y - a.y) * i) / Math.max(1, n),
        )
      )
        return false;
    return true;
  }
  function path(start, goal) {
    const end = nearest(goal);
    if (!end || !walkable(start.x, start.y)) return [];
    if (clear(start, end)) return [end];
    const snap = (p) => {
      let best = null;
      for (let dy = -2; dy <= 2; dy++)
        for (let dx = -2; dx <= 2; dx++) {
          const q = {
            x: Math.round(p.x / step) * step + dx * step,
            y: Math.round(p.y / step) * step + dy * step,
          };
          if (!walkable(q.x, q.y) || !clear(p, q)) continue;
          const d = Math.hypot(q.x - p.x, q.y - p.y);
          if (!best || d < best.d) best = { ...q, d };
        }
      return best;
    };
    const a = snap(start),
      b = snap(end);
    if (!a || !b) return [];
    const key = (p) => p.x + ',' + p.y,
      open = [a],
      cost = new Map([[key(a), 0]]),
      came = new Map(),
      closed = new Set();
    while (open.length) {
      open.sort(
        (u, v) =>
          cost.get(key(u)) +
          Math.hypot(u.x - b.x, u.y - b.y) -
          cost.get(key(v)) -
          Math.hypot(v.x - b.x, v.y - b.y),
      );
      const current = open.shift(),
        id = key(current);
      if (closed.has(id)) continue;
      if (id === key(b)) {
        const route = [b];
        let k = id;
        while (came.has(k)) {
          const p = came.get(k);
          route.unshift(p);
          k = key(p);
        }
        route.push(end);
        return route;
      }
      closed.add(id);
      for (const [dx, dy] of [
        [step, 0],
        [-step, 0],
        [0, step],
        [0, -step],
        [step, step],
        [-step, step],
        [step, -step],
        [-step, -step],
      ]) {
        const q = { x: current.x + dx, y: current.y + dy };
        if (!walkable(q.x, q.y) || !clear(current, q)) continue;
        const k = key(q),
          next = cost.get(id) + Math.hypot(dx, dy);
        if (next < (cost.get(k) ?? Infinity)) {
          cost.set(k, next);
          came.set(k, current);
          open.push(q);
        }
      }
    }
    return [];
  }
  return { width, height, radius, spawn, obstacles, walkable, move, nearest, path, clear };
});
