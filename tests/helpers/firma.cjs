'use strict';
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const { createFirmaServer } = require('../../server.cjs');
const { fakeProviders } = require('../ai-fixtures.cjs');

async function fixture(options = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'firma-production-'));
  const root = path.join(dir, 'app'),
    dataDir = path.join(dir, 'private');
  fs.mkdirSync(root);
  fs.writeFileSync(path.join(root, 'app.js'), 'console.log("app");\n');
  const fake = fakeProviders();
  const app = createFirmaServer({ dataDir, workspaceRoot: root, ai: fake, ...options });
  await app.readiness;
  await new Promise((resolve) => app.server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + app.server.address().port;
  const origin = options.publicOrigin || base;
  let auth = {};
  const request = (route, { method = 'GET', payload, headers = {} } = {}) =>
    new Promise((resolve, reject) => {
      const req = http.request(
        base + route,
        {
          method,
          headers: {
            Host: new URL(origin).host,
            ...auth,
            ...headers,
            ...(payload !== undefined
              ? { Origin: origin, 'Content-Type': 'application/json' }
              : {}),
          },
        },
        (res) => {
          const chunks = [];
          res.on('data', (c) => chunks.push(c));
          res.on('end', () =>
            resolve(
              new Response(Buffer.concat(chunks), { status: res.statusCode, headers: res.headers }),
            ),
          );
        },
      );
      req.on('error', reject);
      req.end(payload === undefined ? undefined : JSON.stringify(payload));
    });
  const setup = await request('/api/setup', {
    method: 'POST',
    payload: {
      token: app.setupToken,
      username: 'owner',
      password: 'Senha de testes bem longa 2026!',
    },
  });
  const session = await setup.json();
  if (setup.status !== 201) throw Error('Setup failed');
  auth = { Cookie: setup.headers.get('set-cookie').split(';')[0], 'X-Firma-CSRF': session.csrf };
  const project = () => app.workstation.projects.create({ name: 'Projeto de QA' }).project;
  const task = (projectId) =>
    require('../../engine.js').addTask(app.company.getState(), {
      projectId,
      template: 'development',
      agent: '3',
      title: 'Validar aplicação',
      description: 'Criar função pequena.',
    });
  return {
    dir,
    root,
    dataDir,
    app,
    fake,
    request,
    project,
    task,
    async run(projectId, changes = {}, extra = {}) {
      const t = task(projectId),
        { runId } = await app.company.action('run.create', {
          projectId,
          taskId: t.id,
          mode: 'manual',
          ...extra,
        });
      for (const [name, content] of Object.entries(changes))
        app.company.stage({ runId, path: name, content });
      app.company.start({ runId, operation: 'check', confirm: true });
      await wait(() => !app.company.active);
      return app.company.getRun(runId);
    },
    async close() {
      await new Promise((resolve) => app.server.close(resolve));
      await new Promise((resolve) => setTimeout(resolve, 120));
      if (path.dirname(dir) !== os.tmpdir() || !path.basename(dir).startsWith('firma-production-'))
        throw Error('Unsafe cleanup');
      fs.rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
    },
  };
}
async function wait(check) {
  for (let n = 0; n < 500; n++) {
    if (await check()) return;
    await new Promise((r) => setTimeout(r, 20));
  }
  throw Error('QA timed out');
}
module.exports = { fixture, wait };
