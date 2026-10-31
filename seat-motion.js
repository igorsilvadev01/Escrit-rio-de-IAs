(function (r, f) {
  const a = f();
  if (typeof module === 'object' && module.exports) module.exports = a;
  else r.FirmaSeatMotion = a;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  return {
    advance(value, seated, dt, reduced = false) {
      const target = seated ? 1 : 0;
      if (reduced) return target;
      const step = Math.max(0, Math.min(0.1, Number(dt) || 0)) / 0.55;
      return target > value ? Math.min(target, value + step) : Math.max(target, value - step);
    },
    frame(value, time = 0) {
      if (value < 0.12) return 0;
      if (value < 0.65) return 1;
      return value < 0.98 ? 2 : 2 + (Math.floor(time * 3) % 2);
    },
  };
});
