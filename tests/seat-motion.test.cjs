const test = require('node:test'),
  assert = require('node:assert/strict'),
  seat = require('../seat-motion.js');
test('sitting lowers through an intermediate pose and standing reverses before the walk', () => {
  let p = 0,
    frames = [];
  for (let i = 0; i < 12; i++) {
    p = seat.advance(p, true, 0.05);
    frames.push(seat.frame(p));
  }
  assert.equal(p, 1);
  assert.ok(frames.includes(1));
  assert.ok(frames.includes(2));
  let previous = p;
  for (let i = 0; i < 12; i++) {
    p = seat.advance(p, false, 0.05);
    assert.ok(p <= previous);
    previous = p;
  }
  assert.equal(p, 0);
  assert.equal(seat.frame(p), 0);
});
test('rapid interruption reverses from the current posture without teleporting', () => {
  let p = seat.advance(0.3, true, 0.05);
  let q = seat.advance(p, false, 0.05);
  assert.ok(p > 0.3);
  assert.ok(q < p);
  assert.ok(q > 0);
  assert.ok(seat.advance(0, true, 100) < 1);
});
test('reduced motion immediately resolves both postures', () => {
  assert.equal(seat.advance(0.2, true, 0.05, true), 1);
  assert.equal(seat.advance(0.8, false, 0.05, true), 0);
  assert.equal(seat.advance(0.5, true, -1), 0.5);
});
