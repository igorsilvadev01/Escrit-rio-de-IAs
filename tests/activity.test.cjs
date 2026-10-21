'use strict';
const test = require('node:test'),
  assert = require('node:assert/strict'),
  E = require('../engine.js'),
  A = require('../activity.js');
test('real generation has unknown percent; sector percentage counts actual ready deliveries', () => {
  const state = E.create();
  state.tasks = [
    {
      id: 'live',
      template: 'development',
      status: 'working',
      progress: 83,
      execution: { kind: 'real', role: 'development', status: 'running' },
    },
    {
      id: 'ready',
      template: 'development',
      status: 'review',
      progress: 100,
      execution: { kind: 'real', role: 'development', status: 'completed' },
    },
  ];
  const a = A.summarize(state, 'development');
  assert.equal(a.active, true);
  assert.equal(a.generationPercent, null);
  assert.equal(a.percent, 50);
  assert.equal(a.ready, 1);
  assert.equal(a.total, 2);
  assert.match(a.label, /indisponível/);
  state.tasks[0].status = 'review';
  state.tasks[0].execution.status = 'completed';
  const done = A.summarize(state, 'development');
  assert.equal(done.active, false);
  assert.equal(done.percent, 100);
});
test('simulation, pause, meeting and chat states are distinguished without fabricated progress', () => {
  const state = E.create();
  state.tasks = [{ id: 's', template: 'testing', status: 'working', progress: 42 }];
  assert.equal(A.summarize(state, 'testing').generationPercent, 42);
  assert.equal(A.summarize(state, 'testing').mode, 'simulation');
  assert.equal(A.summarize(state, 'testing', {}, true).active, false);
  state.assembly.active = true;
  assert.equal(A.summarize(state, 'testing').active, false);
  assert.match(A.summarize(state, 'testing').label, /reunião/);
  const chat = A.summarize(state, 'publishing', { chatRunning: { role: 'publishing' } });
  assert.equal(chat.active, true);
  assert.equal(chat.generationPercent, null);
  assert.equal(chat.percent, 0);
  assert.equal(chat.total, 0);
});
test('leadership is not incorrectly counted as a planning delivery and code extraction accepts live fences', () => {
  const state = E.create();
  state.tasks = [
    {
      template: 'planning',
      status: 'review',
      execution: { kind: 'real', role: 'leadership', status: 'completed' },
    },
  ];
  assert.equal(A.all(state).planning.total, 0);
  assert.equal(A.all(state).leadership.percent, 100);
  assert.deepEqual(A.codeFrom('Explicação\n```javascript\nconst answer = 42;'), [
    { language: 'javascript', code: 'const answer = 42;' },
  ]);
  assert.deepEqual(A.codeFrom('sem código'), []);
  assert.equal(A.codeFrom('```js\nx\n```\n```html\n<p>y</p>\n```').length, 2);
});
