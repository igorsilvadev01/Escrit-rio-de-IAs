'use strict';
const test = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('node:fs'),
  os = require('node:os'),
  path = require('node:path');
const E = require('../engine.js'),
  P = require('../ai-providers.cjs'),
  { createFirmaServer } = require('../server.cjs'),
  { fakeProviders } = require('./ai-fixtures.cjs');
async function fixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'firma-ai-test-')),
    fakes = fakeProviders(),
    app = createFirmaServer({ dataDir: dir, ai: fakes });
  await new Promise((resolve) => app.server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + app.server.address().port;
  let auth = {};
  const request = (url, options = {}) => fetch(base + url, options);
  const post = (url, data, headers = auth) =>
    request(url, {
      method: 'POST',
      headers: { Origin: base, 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(data),
    });
  const setup = await post('/api/setup', {
    token: app.setupToken,
    username: 'qa-admin',
    password: 'Uma senha longa para QA 2026!',
  });
  const session = await setup.json();
  auth = { Cookie: setup.headers.get('set-cookie').split(';')[0], 'X-Firma-CSRF': session.csrf };
  const action = (action, payload = {}) => post('/api/ai/action', { action, payload });
  const get = async () => await (await request('/api/state', { headers: auth })).json();
  async function connect() {
    assert.equal(
      (await action('connect', { provider: 'gemini', key: 'QA_SECRET_API_KEY_1234567890' })).status,
      200,
    );
    await action('codex.login');
    await action('codex.check');
  }
  return {
    dir,
    app,
    fakes,
    request,
    post,
    action,
    get,
    connect,
    get auth() {
      return auth;
    },
    async close() {
      app.ai.close();
      await new Promise((resolve) => app.server.close(resolve));
      assert.equal(path.dirname(dir), os.tmpdir());
      assert.ok(path.basename(dir).startsWith('firma-ai-test-'));
      fs.rmSync(dir, { recursive: true, force: true });
    },
  };
}

test('office hours are admin-only, suspend queued calls and forbid AI requests until fully open', async () => {
  const f = await fixture();
  try {
    assert.equal((await f.post('/api/action', { action: 'office.close' }, {})).status, 401);
    await f.connect();
    await f.post('/api/action', { action: 'simulation', payload: { paused: true } });
    assert.equal((await f.action('queue', { id: '3', confirm: true })).status, 200);
    assert.equal(f.app.ai.armed.size, 1);
    f.app.ai.activeChat = { role: 'development', controller: new AbortController() };
    assert.equal((await f.post('/api/action', { action: 'office.close' })).status, 409);
    f.app.ai.activeChat = null;
    const response = await f.post('/api/action', { action: 'office.close' });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).state.office.status, 'closing');
    assert.equal(f.app.ai.armed.size, 0);
    const s = f.app.ai.getState();
    assert.equal(s.tasks.find((t) => t.id === '3').execution.status, 'held');
    const progress = s.tasks.map((t) => t.progress);
    await new Promise((r) => setTimeout(r, 1100));
    assert.ok(s.office.progress >= 1, 'the door sequence continues when production is paused');
    E.advanceOffice(s, 1000);
    assert.equal(s.office.status, 'closed');
    E.tick(s, 100);
    assert.deepEqual(
      s.tasks.map((t) => t.progress),
      progress,
    );
    assert.equal((await f.action('queue', { id: '3', confirm: true })).status, 400);
    const count = s.tasks.length;
    assert.equal(
      (await f.action('flow', { goal: 'Não criar enquanto fechado', confirm: true })).status,
      400,
    );
    assert.equal(
      (await f.action('advice', { goal: 'Não criar enquanto fechado', confirm: true })).status,
      400,
    );
    assert.equal(s.tasks.length, count);
    assert.throws(
      () => f.app.ai.chat({ role: 'development', messages: [{ role: 'user', text: 'hello' }] }),
      /Abra o escritório/,
    );
    assert.equal(f.fakes.calls.length, 0);
    assert.equal((await f.post('/api/action', { action: 'office.open' })).status, 200);
    assert.equal(s.office.status, 'opening');
    E.advanceOffice(s, 1000);
    assert.equal(s.office.status, 'open');
    assert.equal((await f.get()).paused, true);
  } finally {
    await f.close();
  }
});
test('AI endpoints require admin, same-origin JSON and CSRF; secrets are never in snapshots, files or backups', async () => {
  const f = await fixture();
  try {
    assert.equal((await f.request('/api/ai/status')).status, 401);
    assert.equal(
      (await f.post('/api/ai/action', { action: 'connect', payload: {} }, {})).status,
      401,
    );
    assert.equal(
      (
        await f.post(
          '/api/ai/action',
          { action: 'connect', payload: {} },
          { Cookie: f.auth.Cookie },
        )
      ).status,
      403,
    );
    await f.connect();
    for (const url of ['/api/ai/status', '/api/state', '/api/backup']) {
      const r = await f.request(url, { headers: f.auth });
      assert.equal(r.status, 200);
      assert.ok(!(await r.text()).includes('QA_SECRET_API_KEY'));
    }
    assert.equal((await f.request('/codex-bridge.cjs')).status, 404);
    assert.equal((await f.request('/.firma-private/ai-settings.json')).status, 404);
    for (const name of fs.readdirSync(f.dir).filter((n) => n.endsWith('.json')))
      assert.ok(!fs.readFileSync(path.join(f.dir, name), 'utf8').includes('QA_SECRET_API_KEY'));
    assert.equal((await f.action('queue', { id: '3', confirm: false })).status, 400);
    assert.equal(
      (await f.action('connect', { provider: 'http://localhost', key: 'QA_SECRET_API_KEY' }))
        .status,
      400,
    );
  } finally {
    await f.close();
  }
});
test('four real stages respect dependencies, use assigned providers and carry approved output forward', async () => {
  const f = await fixture();
  try {
    await f.connect();
    assert.equal(
      (await f.action('flow', { goal: 'Criar uma página acessível', confirm: true })).status,
      200,
    );
    const state = f.app.ai.getState(),
      tasks = state.tasks.slice(-4);
    E.tick(state, 20);
    for (const [index, task] of tasks.entries()) {
      await f.app.ai.pump();
      await f.app.ai.pump();
      assert.equal(task.status, 'review');
      assert.equal(task.progress, 100);
      assert.equal(task.execution.kind, 'real');
      assert.match(task.result, /Entrega gerada por IA/);
      assert.equal(f.fakes.calls.length, index + 1);
      for (const next of tasks.slice(index + 1)) assert.equal(next.execution.status, 'pending');
      assert.equal(
        (await f.post('/api/action', { action: 'task.approve', payload: { id: task.id } })).status,
        200,
      );
    }
    assert.deepEqual(
      f.fakes.calls.map((c) => c.provider),
      ['gemini', 'codex', 'gemini', 'gemini'],
    );
    const dev = f.fakes.calls[1];
    assert.match(dev.prompt, /Entrega gerada por IA/);
    assert.match(dev.system, /NÃO tem um executor/);
    const testing = JSON.stringify(f.fakes.calls[2].payload);
    assert.match(testing, /NÃO executa testes/);
    const publicState = await (await f.request('/api/state')).json();
    assert.ok(publicState.state.tasks.every((t) => !t.result && !t.execution?.error));
    assert.ok(!JSON.stringify(publicState).includes('Criar uma página acessível'));
  } finally {
    await f.close();
  }
});
test('real tasks never gain simulated progress; failures and truncated output never become review or retry automatically', async () => {
  const f = await fixture();
  try {
    await f.connect();
    const state = f.app.ai.getState(),
      agent = E.recommend(state, 'planning');
    const t = E.addTask(state, {
      template: 'planning',
      agent: agent.id,
      title: 'Planejamento real',
      description: 'Verificar limites.',
    });
    assert.equal((await f.action('queue', { id: t.id, confirm: true })).status, 200);
    E.tick(state, 500);
    assert.equal(t.progress, 0);
    f.fakes.settings.fail = true;
    await f.app.ai.pump();
    assert.equal(t.execution.status, 'error');
    assert.notEqual(t.status, 'review');
    assert.match(t.execution.error, /Limite/);
    for (let i = 0; i < 5; i++) await f.app.ai.pump();
    assert.equal(f.fakes.calls.length, 1);
    f.fakes.settings.fail = false;
    f.fakes.settings.truncated = true;
    await f.action('queue', { id: t.id, confirm: true });
    await f.app.ai.pump();
    assert.equal(t.execution.status, 'error');
    assert.equal(t.result, '');
    assert.ok(!JSON.stringify(await f.get()).includes('QA_SECRET'));
  } finally {
    await f.close();
  }
});
test('daily call cap, meeting, pause, cancellation and restore require deliberate authorization', async () => {
  const f = await fixture();
  try {
    await f.connect();
    const state = f.app.ai.getState(),
      agent = E.recommend(state, 'planning');
    const make = () =>
      E.addTask(state, {
        template: 'planning',
        agent: agent.id,
        title: 'Uma ordem',
        description: 'Uma tarefa pequena.',
      });
    const first = make();
    await f.action('queue', { id: first.id, confirm: true });
    await f.post('/api/action', { action: 'simulation', payload: { paused: true } });
    await f.app.ai.pump();
    assert.equal(f.fakes.calls.length, 0);
    await f.post('/api/action', { action: 'simulation', payload: { paused: false } });
    E.summonTeam(state);
    await f.app.ai.pump();
    assert.equal(f.fakes.calls.length, 0);
    E.dismissTeam(state);
    let started;
    const began = new Promise((resolve) => {
      started = resolve;
    });
    f.fakes.settings.block = true;
    f.fakes.settings.started = started;
    const running = f.app.ai.pump();
    await began;
    assert.equal(
      (await f.post('/api/action', { action: 'restore', payload: { state: E.create() } })).status,
      409,
    );
    assert.equal((await f.action('cancel', { id: first.id })).status, 200);
    await running;
    assert.equal(first.execution.status, 'held');
    assert.equal(first.result, '');
    const roles = f.app.ai.settings.roles;
    await f.action('settings', { roles, dailyLimit: 1, maxTokens: 4096 });
    f.fakes.settings.block = false;
    const second = make();
    await f.action('queue', { id: second.id, confirm: true });
    await f.app.ai.pump();
    assert.equal(f.fakes.calls.length, 1);
    assert.match(second.execution.error, /diário/);
    const imported = E.migrate(state);
    const target = imported.tasks.find((t) => t.id === second.id);
    target.execution.status = 'pending';
    await f.post('/api/action', { action: 'restore', payload: { state: imported } });
    await f.app.ai.pump();
    assert.equal(f.fakes.calls.length, 1);
    assert.equal(
      f.app.ai.getState().tasks.find((t) => t.id === second.id).execution.status,
      'held',
    );
  } finally {
    await f.close();
  }
});
test('provider adapters reject invalid model paths and do not follow redirects or expose upstream error bodies', async () => {
  await assert.rejects(
    () =>
      P.generate('gemini', { model: '../../.env' }, () => {
        throw Error('must not fetch');
      }),
    /modelo válido/,
  );
  await assert.rejects(
    () =>
      P.listModels('gemini', 'QA_SECRET', async (url, options) => {
        assert.equal(options.redirect, 'error');
        return new Response('QA_SECRET', { status: 401 });
      }),
    /Credencial recusada/,
  );
});

test('removed Claude has no adapter or credential handling; legacy roles migrate without provider calls', async () => {
  const f = await fixture();
  try {
    assert.deepEqual(Object.keys(P.catalog), ['codex', 'gemini', 'ollama']);
    assert.equal(
      (await f.action('connect', { provider: 'claude', key: 'QA_REMOVED_KEY_1234567890' })).status,
      400,
    );
    const settings = {
      ...f.app.ai.settings,
      roles: {
        ...f.app.ai.settings.roles,
        planning: { provider: 'claude', model: 'legacy-model' },
      },
    };
    assert.equal((await f.action('settings', settings)).status, 400);
    assert.equal(f.fakes.calls.length, 0);
    await assert.rejects(
      () =>
        P.listModels('claude', 'QA_REMOVED', () => {
          throw Error('must not fetch');
        }),
      /Provedor inválido/,
    );
    await assert.rejects(
      () =>
        P.generate('claude', { model: 'legacy-model' }, () => {
          throw Error('must not fetch');
        }),
      /Provedor inválido/,
    );
    const migrationDir = path.join(f.dir, 'migration');
    fs.mkdirSync(migrationDir);
    fs.writeFileSync(path.join(migrationDir, 'ai-settings.json'), JSON.stringify(settings));
    const { AIRuntime } = require('../ai-runtime.cjs'),
      state = E.create();
    const migrated = new AIRuntime({
      dataDir: migrationDir,
      getState: () => state,
      isPaused: () => true,
      changed: () => {},
      codex: f.fakes.codex,
      fetcher: f.fakes.fetcher,
      env: { ANTHROPIC_API_KEY: 'QA_REMOVED_KEY' },
    });
    try {
      assert.equal(migrated.settings.roles.planning.provider, 'gemini');
      assert.equal(migrated.settings.roles.planning.model, 'gemini-3.8-flash');
      assert.equal(migrated.key('claude'), '');
      assert.equal(migrated.usage().used, 0);
      assert.ok(
        !fs.readFileSync(path.join(migrationDir, 'ai-settings.json'), 'utf8').includes('claude'),
      );
      assert.equal(f.fakes.calls.length, 0);
    } finally {
      migrated.close();
    }
  } finally {
    await f.close();
  }
});
test('direct collaborator orders use their own department and revisions require a new confirmation', async () => {
  const f = await fixture();
  try {
    await f.connect();
    assert.equal(
      (
        await f.action('agent.order', {
          id: '6',
          goal: 'Revise estes critérios e proponha testes.',
          confirm: true,
        })
      ).status,
      200,
    );
    const state = f.app.ai.getState(),
      task = state.tasks.at(-1);
    assert.equal(task.execution.provider, 'gemini');
    assert.equal(task.agent, '6');
    await f.app.ai.pump();
    await f.app.ai.pump();
    assert.equal(task.status, 'review');
    assert.equal(E.contract(state, task).mode, 'real');
    assert.equal(
      (
        await f.post('/api/action', {
          action: 'task.revise',
          payload: { id: task.id, feedback: 'Inclua casos de erro.' },
        })
      ).status,
      200,
    );
    assert.equal(task.execution.status, 'held');
    assert.equal(task.result, '');
    const count = f.fakes.calls.length;
    await f.app.ai.pump();
    assert.equal(f.fakes.calls.length, count);
    const settings = { ...f.app.ai.settings, dailyLimit: 1.5 };
    assert.equal((await f.action('settings', settings)).status, 400);
  } finally {
    await f.close();
  }
});
test('restart never resumes paid jobs or persists typed API keys', async () => {
  const f = await fixture();
  try {
    await f.connect();
    assert.equal(
      (await f.action('agent.order', { id: '6', goal: 'Revisão após reinício.', confirm: true }))
        .status,
      200,
    );
    const task = f.app.ai.getState().tasks.at(-1);
    f.app.ai.close();
    const { AIRuntime } = require('../ai-runtime.cjs'),
      fresh = new AIRuntime({
        dataDir: f.dir,
        getState: () => f.app.ai.getState(),
        isPaused: () => false,
        changed: () => {},
        ...f.fakes,
      });
    try {
      assert.equal(task.execution.status, 'held');
      assert.equal(fresh.status().providers.find((p) => p.id === 'gemini').connected, false);
      await fresh.pump();
      assert.equal(f.fakes.calls.length, 0);
    } finally {
      fresh.close();
    }
  } finally {
    await f.close();
  }
});
