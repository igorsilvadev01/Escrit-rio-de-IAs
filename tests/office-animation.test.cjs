const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('../engine.js'),
  W = require('../world.js'),
  L = require('../office-life.js');
const advance = (life, seconds, options = {}) => {
  for (let i = 0; i < seconds * 20; i++) life.advance(0.05, options);
};
test('ambient roster adds distinct companions without modifying saved agents or tasks', () => {
  const s = E.create(),
    before = JSON.stringify(s),
    life = L.create(W, E),
    roster = life.roster(s);
  assert.equal(roster.length, s.agents.length + 7);
  assert.equal(new Set(roster.map((a) => a.id)).size, roster.length);
  assert.equal(
    new Set(roster.map((a) => JSON.stringify(life.appearance(s, a)))).size,
    roster.length,
  );
  for (const a of roster) {
    assert.ok(W.walkable(life.home(s, a).x, life.home(s, a).y));
  }
  assert.equal(JSON.stringify(s), before);
});
test('all routine destinations are reachable, with multiple activities and motion on arrival', () => {
  const s = E.create(),
    life = L.create(W, E),
    modes = new Set();
  let moving = 0;
  for (let time = 0; time < 180; time += 3) {
    for (const a of life.roster(s)) {
      const plan = life.plan(s, a);
      modes.add(plan.mode);
      if (plan.target) {
        const path = W.path(life.home(s, a), plan.target);
        assert.ok(path.length, `${a.name}: ${plan.mode} at ${time}`);
        if (path.length > 2) moving++;
      }
    }
    advance(life, 3);
  }
  for (const mode of ['desk', 'board', 'coffee', 'plant', 'chat']) assert.ok(modes.has(mode));
  assert.ok(moving > 100);
});
test('real executions, rest, closure, pause and reduced motion retain their boundaries', () => {
  const s = E.create(),
    life = L.create(W, E),
    a = s.agents[0];
  s.tasks.push({ id: 'real-test', agent: a.id, status: 'working', execution: { kind: 'real' } });
  assert.equal(life.plan(s, a).target, null);
  a.rest = true;
  assert.equal(life.plan(s, a).target, null);
  a.rest = false;
  const before = life.elapsed;
  advance(life, 2, { paused: true });
  assert.equal(life.elapsed, before);
  life.advance(0.05, { reduced: true });
  assert.equal(life.plan(s, life.companions[0]).target, null);
  life.advance(0.05);
  s.office.status = 'closed';
  assert.equal(life.plan(s, life.companions[0]).target, null);
});
test('conversations alternate named partners and record complete lines only after both arrive', () => {
  const s = E.create(),
    life = L.create(W, E),
    roster = life.roster(s),
    positions = new Map();
  advance(life, 20.1);
  assert.deepEqual(life.speech(s, positions), []);
  const { story } = life.current();
  assert.equal(story.lines.length, 6);
  for (const id of story.ids) assert.ok(roster.find((a) => a.id === id));
  const place = () => {
    for (const a of roster) {
      const target = life.plan(s, a).target || life.home(s, a);
      positions.set(a.id, { ...target, visible: true, route: [] });
    }
  };
  for (let i = 0; i < 6; i++) {
    place();
    const speech = life.speech(s, positions);
    assert.equal(speech.length, 1);
    assert.equal(speech[0].id, story.ids[i % 2]);
    assert.equal(speech[0].text, story.lines[i]);
    life.record(s, positions);
    life.record(s, positions);
    if (i < 5) advance(life, 8);
  }
  assert.equal(life.history.length, 6);
  assert.ok(life.history.every((x) => x.text.length > 65));
  positions.get(story.ids[0]).route = [{ x: 0, y: 0 }];
  assert.deepEqual(life.speech(s, positions), []);
});
test('conversation archive contains eight complete exchanges and valid participant identities', () => {
  const s = E.create(),
    life = L.create(W, E),
    ids = new Set(life.roster(s).map((a) => a.id));
  assert.equal(life.conversations.length, 8);
  for (const story of life.conversations) {
    assert.equal(story.lines.length, 6);
    for (const id of story.ids) assert.ok(ids.has(id));
    for (const line of story.lines) assert.ok(line.length > 65);
  }
});
