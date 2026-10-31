const { test } = require('node:test');
const assert = require('node:assert/strict');
const Work = require('../work-animation.js'),
  Life = require('../office-life.js'),
  E = require('../engine.js'),
  W = require('../world.js');
test('Igor stays next to Codex across routines and motion preferences without changing the visitor', () => {
  const state = E.create(),
    saved = JSON.stringify(state.player),
    director = Life.create(W, E),
    host = director.roster(state).find((a) => a.fixedHost);
  assert.equal(host.name, 'Igor');
  assert.equal(host.id, 'igor-host');
  assert.ok(
    Math.hypot(
      director.home(state, host).x - W.leaderHome.x,
      director.home(state, host).y - W.leaderHome.y,
    ) <= 100,
  );
  for (let i = 0; i < 600; i++) {
    director.advance(0.1, { reduced: i % 2 === 0 });
    const plan = director.plan(state, host);
    assert.equal(plan.mode, 'desk');
    assert.deepEqual(plan.target, { x: W.playerSeats.admin.x, y: W.playerSeats.admin.y });
  }
  assert.equal(JSON.stringify(state.player), saved);
  state.office.status = 'closed';
  assert.equal(director.plan(state, host).target, null);
});
test('work cycles alternate hands, use the mouse and pause to read with per-character timing', () => {
  const actions = new Set(),
    left = new Set(),
    right = new Set();
  for (let t = 0; t < 10; t += 0.05) {
    const p = Work.pose(t, 0);
    actions.add(p.action);
    left.add(p.left);
    right.add(p.right);
    assert.ok(Number.isFinite(p.frame));
  }
  assert.deepEqual([...actions], ['typing', 'mouse', 'review']);
  assert.ok(left.size > 2);
  assert.ok(right.size > 2);
  assert.notDeepEqual(Work.pose(1, 3), Work.pose(1, 21));
});
test('reduced motion freezes every part of the workstation; invalid time cannot create an invalid pose', () => {
  assert.deepEqual(Work.pose(0, 5, true), Work.pose(812, 5, true));
  for (const time of [NaN, Infinity, -1]) assert.ok(Number.isFinite(Work.pose(time).frame));
});
test('monitor animation stays inside its clip region and changes over time for each work area', () => {
  for (const role of ['planning', 'development', 'testing', 'publishing', 'leadership']) {
    let calls = [],
      clips = 0;
    const ctx = {
      fillStyle: '',
      save() {},
      restore() {},
      beginPath() {},
      rect() {},
      clip() {
        clips++;
      },
      fillRect(x, y, w, h) {
        assert.ok([x, y, w, h].every(Number.isFinite));
        assert.ok(w > 0 && h > 0);
        calls.push([x, y, w, h, this.fillStyle]);
      },
    };
    Work.screen(ctx, { x: 0, y: 0, w: 16, h: 9 }, role, 0, 0);
    const first = JSON.stringify(calls);
    calls = [];
    Work.screen(ctx, { x: 0, y: 0, w: 16, h: 9 }, role, 1.1, 0);
    assert.equal(clips, 2);
    if (role !== 'publishing') assert.notEqual(JSON.stringify(calls), first);
  }
});
