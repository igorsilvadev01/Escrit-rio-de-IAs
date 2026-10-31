/* Small deterministic pose cycles and monitor artwork, without timers or external assets. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.FirmaWorkAnimation = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  function pose(time = 0, seed = 0, reduced = false) {
    const t = reduced
      ? 0
      : (Number.isFinite(time) ? Math.max(0, time) : 0) +
        ((Number.isFinite(seed) ? seed : 0) % 97) * 0.137;
    const cycle = t % 8.8,
      frame = Math.floor(t * 7) % 8,
      action = cycle < 5.8 ? 'typing' : cycle < 7 ? 'mouse' : 'review';
    return {
      action,
      frame,
      left: action === 'typing' ? [0, -1, 0, 1, 0, -1, 0, 0][frame] : 0,
      right: action === 'typing' ? [1, 0, -1, 0, 1, 0, 0, -1][frame] : 0,
      mouse: action === 'mouse' ? 1 : 0,
      head: action === 'review' ? 1 : 0,
      blink: !reduced && t % 5.3 < 0.12,
      cursor: reduced || Math.floor(t * 2) % 2 === 0,
      line: Math.floor(t * 1.2) % 3,
    };
  }
  function screen(ctx, b, role, time, seed, reduced = false) {
    const p = pose(time, seed, reduced),
      box = (x, y, w, h, color) => {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w, h);
      };
    ctx.save();
    ctx.beginPath();
    ctx.rect(b.x, b.y, b.w, b.h);
    ctx.clip();
    box(b.x, b.y, b.w, b.h, '#142541');
    if (role === 'development' || role === 'leadership') {
      for (let i = 0; i < 3; i++) {
        const indent = i % 2 ? 3 : 1;
        box(
          b.x + indent,
          b.y + 1 + i * 3,
          Math.min(b.w - indent - 2, [10, 7, 12][(i + p.line) % 3]),
          1,
          ['#80c8ee', '#b19afb', '#8dc9b0'][i],
        );
      }
      if (p.cursor) box(b.x + Math.min(b.w - 2, 11), b.y + 7, 1, 2, '#f4f7ff');
    } else if (role === 'testing') {
      for (let i = 0; i < 3; i++) {
        box(b.x + 1, b.y + 1 + i * 3, 2, 1, i === p.line ? '#a6e7f5' : '#7596cb');
        box(b.x + 5, b.y + 1 + i * 3, Math.max(2, b.w - 7), 1, '#9bb4db');
      }
    } else if (role === 'planning') {
      for (let i = 0; i < 3; i++)
        box(b.x + 1 + i * 5, b.y + 2, 3, 4, i === p.line ? '#a6e7f5' : '#6387ff');
      box(b.x + 1, b.y + 7, Math.max(2, b.w - 3), 1, '#93aed9');
    } else {
      box(b.x + 1, b.y + 1, 5, 6, '#8e9bed');
      box(b.x + 8, b.y + 2, Math.max(2, b.w - 10), 1, '#c4d4f0');
      box(b.x + 8, b.y + 5, Math.max(2, b.w - 11), 1, '#8dc9b0');
    }
    ctx.restore();
    return p;
  }
  return { pose, screen };
});
