const { test } = require('node:test'),
  assert = require('node:assert/strict'),
  E = require('../engine.js'),
  W = require('../world.js');
test('closing releases exactly one worker at a time, Codex last; reopening welcomes Codex first', () => {
  const s = E.create();
  E.changeOffice(s, 'closed');
  assert.equal(s.office.status, 'closing');
  assert.equal(s.office.order.at(-1), 'codex-leader');
  assert.equal(s.agents.filter((a) => E.presence(s, a.id) === 'leaving').length, 1);
  E.advanceOffice(s, 4);
  assert.equal(s.office.cursor, 0);
  E.advanceOffice(s, 1);
  assert.equal(s.office.cursor, 1);
  assert.equal(E.presence(s, s.agents[0].id), 'outside');
  assert.equal(E.presence(s, s.agents[1].id), 'leaving');
  E.advanceOffice(s, E.shiftSeconds * s.office.order.length);
  assert.equal(s.office.status, 'closed');
  assert.ok(s.agents.every((a) => E.presence(s, a.id) === 'outside'));
  E.changeOffice(s, 'open');
  assert.equal(s.office.order[0], 'codex-leader');
  assert.equal(E.presence(s, 'codex-leader'), 'entering');
  assert.ok(s.agents.every((a) => E.presence(s, a.id) === 'outside'));
  E.advanceOffice(s, E.shiftSeconds * s.office.order.length);
  assert.equal(s.office.status, 'open');
  assert.ok(s.agents.every((a) => E.presence(s, a.id) === 'inside'));
});
test('closing and closed states preserve progress, feedback, energy and pause preferences', () => {
  const s = E.create(),
    before = s.tasks.map((t) => ({ progress: t.progress, revisions: t.revisions })),
    energy = s.agents.map((a) => a.energy);
  E.changeOffice(s, 'closed');
  E.tick(s, 100);
  assert.deepEqual(
    s.tasks.map((t) => ({ progress: t.progress, revisions: t.revisions })),
    before,
  );
  assert.deepEqual(
    s.agents.map((a) => a.energy),
    energy,
  );
  assert.ok(s.tasks.every((t) => t.status !== 'working'));
  assert.throws(() => E.changeOffice(s, 'open'), /Aguarde/);
  E.advanceOffice(s, 1000);
  E.tick(s, 100);
  assert.deepEqual(
    s.tasks.map((t) => ({ progress: t.progress, revisions: t.revisions })),
    before,
  );
  E.changeOffice(s, 'open');
  E.advanceOffice(s, 1000);
  assert.ok(s.tasks.some((t) => t.status === 'working'));
});
test('transition order and elapsed time survive backups without replaying departures', () => {
  const s = E.create();
  E.changeOffice(s, 'closed');
  E.advanceOffice(s, 7);
  const restored = E.migrate(JSON.parse(JSON.stringify(s)));
  assert.deepEqual(restored.office, s.office);
  E.advanceOffice(restored, 3);
  assert.equal(restored.office.cursor, 2);
  assert.equal(restored.office.progress, 0);
  assert.equal(restored.events.filter((e) => e.text.includes('saiu do escritório')).length, 2);
});
test('old saves receive an open office and invalid presence IDs cannot hide valid workers', () => {
  const s = E.create();
  delete s.office;
  assert.equal(E.migrate(s).office.status, 'open');
  s.office = {
    status: 'closing',
    clock: NaN,
    order: ['intruder', '1', '1'],
    cursor: 0,
    progress: 0,
  };
  const clean = E.migrate(s);
  assert.equal(clean.office.order.includes('intruder'), false);
  assert.equal(new Set(clean.office.order).size, clean.agents.length + 1);
  assert.equal(clean.office.clock, 0);
});
test('every employee has a reachable chair and coffee bench; no walls or large lounge were added', () => {
  assert.equal(W.chairs.length, 24);
  assert.equal(W.workDesks.length, 24);
  assert.equal(W.rooms.length, 5);
  assert.equal(W.walls.length, 0);
  assert.ok(W.lounge.w * W.lounge.h < 15000);
  for (const r of W.rooms.filter((r) => r.seats.length))
    for (let i = 0; i < 6; i++) {
      const p = W.agentSeat({ department: r.id }, i);
      assert.ok(W.path(W.exit, p).length);
      for (const coffee of W.lounge.seats) assert.ok(W.path(p, coffee).length);
    }
  assert.ok(W.path(W.exit, W.leaderHome).length);
});
test('ambient conversations are local, alternate speakers and stop when office is closed', () => {
  const s = E.create();
  s.office.clock = 0;
  const first = E.dialogue(s);
  s.office.clock = 5;
  const second = E.dialogue(s);
  assert.equal(first[0].kind, 'simulation');
  assert.notEqual(first[0].id, second[0].id);
  s.office.clock = 12;
  assert.deepEqual(E.dialogue(s), []);
  E.changeOffice(s, 'closed');
  assert.match(E.dialogue(s)[0].text, /amanhã/);
  E.advanceOffice(s, 1000);
  assert.deepEqual(E.dialogue(s), []);
});
