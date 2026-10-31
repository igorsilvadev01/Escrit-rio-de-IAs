const { test } = require('node:test');
const assert = require('node:assert/strict');
const M = require('../cozy-room-model.js');
test('visitor starts on the open central floor while furniture blocks walking', () => {
  assert.ok(M.walkable(M.spawn.x, M.spawn.y));
  for (const p of [
    { x: 150, y: 400 },
    { x: 800, y: 430 },
    { x: 760, y: 270 },
    { x: 500, y: 80 },
  ])
    assert.equal(M.walkable(p.x, p.y), false);
});
test('routes reach both sides of the room without cutting through furniture', () => {
  for (const goal of [
    { x: 110, y: 240 },
    { x: 420, y: 215 },
    { x: 400, y: 530 },
    { x: 975, y: 530 },
  ]) {
    const path = M.path(M.spawn, goal);
    assert.ok(path.length, JSON.stringify(goal));
    let prior = M.spawn;
    for (const point of path) {
      assert.ok(M.walkable(point.x, point.y));
      assert.ok(M.clear(prior, point));
      prior = point;
    }
    assert.ok(Math.hypot(prior.x - goal.x, prior.y - goal.y) < 1);
  }
});
test('movement cannot tunnel through a desk and invalid destinations are snapped to safe floor', () => {
  const p = M.move(M.spawn, 800, 0);
  assert.ok(p.x <= 632);
  assert.ok(M.walkable(p.x, p.y));
  const goal = M.nearest({ x: 800, y: 430 });
  assert.ok(goal && M.walkable(goal.x, goal.y));
  assert.deepEqual(M.path({ x: 150, y: 400 }, { x: 500, y: 430 }), []);
});
