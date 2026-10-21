'use strict';
const test = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  crypto = require('node:crypto');
const { fixture, wait } = require('./helpers/firma.cjs');
const { ProjectWorkspace } = require('../workspace-projects.cjs');
const { ExecutionRunner, cleanEnvironment } = require('../execution-runner.cjs');
const { dockerArguments } = require('../execution-worker.cjs');
const { buildContext, replaceExactly } = require('../execution-context.cjs');

test('projects move to durable storage without deleting legacy originals; restart preserves edited copies', async () => {
  const f = await fixture();
  try {
    const legacy = path.join(f.root, 'projects', 'old-project');
    fs.mkdirSync(legacy, { recursive: true });
    fs.writeFileSync(path.join(legacy, 'app.js'), 'const legacy = true;');
    fs.writeFileSync(
      path.join(f.dataDir, 'projects.json'),
      JSON.stringify({ projects: [{ id: 'old-project', name: 'Antigo' }], prompts: [] }),
    );
    const p = new ProjectWorkspace(f.root, f.dataDir, (x) => x);
    assert.equal(p.base('old-project'), path.join(f.dataDir, 'projects', 'old-project'));
    const file = p.read('app.js', 'old-project');
    p.write({
      project: 'old-project',
      path: 'app.js',
      text: 'const edited = true;',
      hash: file.hash,
      confirm: true,
    });
    assert.match(fs.readFileSync(path.join(legacy, 'app.js'), 'utf8'), /legacy/);
    const restarted = new ProjectWorkspace(f.root, f.dataDir, (x) => x);
    assert.match(restarted.read('app.js', 'old-project').text, /edited/);
  } finally {
    await f.close();
  }
});

test('infrastructure configuration is editable without exposing secrets or arbitrary hidden paths', async () => {
  const f = await fixture();
  try {
    const p = f.project(),
      workspace = f.app.workstation.projects;
    for (const name of [
      'Dockerfile',
      'compose.yaml',
      '.github/workflows/ci.yml',
      '.gitignore',
      '.env.example',
    ])
      workspace.write({
        project: p.id,
        path: name,
        text: '# configuration',
        hash: '',
        confirm: true,
      });
    assert.ok(workspace.files(p.id).some((file) => file.path === '.github/workflows/ci.yml'));
    for (const name of [
      '.env',
      '.env.production',
      '.git/config',
      '.github/secrets.json',
      '../escape.yml',
      '--import=bad.js',
    ])
      assert.throws(() => workspace.validate(name));
  } finally {
    await f.close();
  }
});

test('worker has a clean environment, enforces permissions and cancellation, and npm never falls back to host execution', async () => {
  const f = await fixture();
  const runner = new ExecutionRunner({ mode: 'local' });
  try {
    assert.deepEqual(
      cleanEnvironment({ PATH: 'test', GEMINI_API_KEY: 'private', NODE_OPTIONS: '--require=bad' }),
      { PATH: 'test', NO_COLOR: '1', GIT_TERMINAL_PROMPT: '0' },
    );
    const dir = path.join(f.dir, 'copy');
    fs.mkdirSync(dir);
    fs.writeFileSync(
      path.join(dir, 'check.js'),
      'const fs=require("node:fs"); try { fs.readFileSync("../private/admin.json");process.exit(2); } catch(e) { console.log(e.code); }',
    );
    const result = await runner.run({
      dir,
      args: ['check.js'],
      signal: new AbortController().signal,
    });
    assert.equal(result.passed, true, result.output);
    assert.match(result.output, /ERR_ACCESS_DENIED/);
    await assert.rejects(runner.run({ dir, args: ['build'], kind: 'npm-script' }), /Docker/);
    fs.writeFileSync(path.join(dir, 'wait.js'), 'setInterval(()=>{},100);');
    const controller = new AbortController();
    const pending = runner.run({ dir, args: ['wait.js'], signal: controller.signal });
    setTimeout(() => controller.abort(), 150);
    const cancelled = await pending;
    assert.equal(cancelled.passed, false);
    assert.match(cancelled.output, /cancelad/i);
  } finally {
    runner.close();
    await f.close();
  }
});

test('Docker workload limits capabilities, memory, network and credentials; installation disables package lifecycle scripts', () => {
  const job = {
    dir: path.resolve('test-copy'),
    args: ['build'],
    kind: 'npm-script',
    image: 'node:22-bookworm-slim',
    installNetwork: 'bridge',
  };
  const args = dockerArguments(job);
  for (const flag of [
    '--read-only',
    '--cap-drop=ALL',
    '--security-opt=no-new-privileges',
    '--memory=512m',
    '--cpus=1',
    '--pids-limit=96',
  ])
    assert.ok(args.includes(flag));
  assert.equal(args[args.indexOf('--network') + 1], 'none');
  assert.ok(!args.some((a) => a.includes('docker.sock') || a.includes('GEMINI_API_KEY')));
  const install = dockerArguments({ ...job, kind: 'npm-ci', args: [] });
  assert.ok(install.includes('--ignore-scripts'));
  assert.equal(install[install.indexOf('--network') + 1], 'bridge');
});

test('project terminal validates the selected project and never substitutes the application test suite', async () => {
  const f = await fixture();
  try {
    const p = f.project();
    f.app.workstation.projects.write({
      project: p.id,
      path: 'tests/real.test.cjs',
      text: 'const test=require("node:test");test("PROJECT_ONLY",()=>{});',
      hash: '',
      confirm: true,
    });
    f.app.company.checks({
      projectId: p.id,
      checks: [{ kind: 'node-test', file: 'tests/real.test.cjs' }],
    });
    f.app.workstation.run({ command: 'tests', project: p.id, confirm: true });
    await wait(() => !f.app.workstation.child);
    assert.equal(f.app.workstation.terminal.status, 'completed');
    assert.match(f.app.workstation.terminal.output, /PROJECT_ONLY/);
    assert.doesNotMatch(f.app.workstation.terminal.output, /single administrator setup/);
  } finally {
    await f.close();
  }
});

test('large AI context selects relevant files, records omissions and rejects ambiguous structured edits', () => {
  const files = { 'README.md': '# Projeto', 'src/cart.js': 'const cart = 1;' };
  for (let n = 0; n < 20; n++) files['src/large-' + n + '.js'] = '// content\n'.repeat(2000);
  const selected = buildContext({ files }, { title: 'Corrigir cart', description: 'Alterar cart' });
  assert.ok(selected.text.length <= 45000);
  assert.ok(selected.selected.includes('src/cart.js'));
  assert.ok(selected.omitted > 0);
  assert.throws(
    () => buildContext({ files, contextFiles: Object.keys(files) }, { title: 'Too big' }),
    /contexto/,
  );
  assert.equal(replaceExactly('hello world', { search: 'world', replace: 'Firma' }), 'hello Firma');
  assert.throws(() => replaceExactly('same same', { search: 'same', replace: 'x' }), /exatamente/);
});

test('remote tools require explicit opt-in, HTTPS and Docker; visitors and root source remain protected', async () => {
  const { createFirmaServer } = require('../server.cjs');
  assert.throws(
    () => createFirmaServer({ publicOrigin: 'http://firma.example', remoteAdmin: true }),
    /HTTPS/,
  );
  assert.throws(
    () =>
      createFirmaServer({
        publicOrigin: 'https://firma.example',
        remoteAdmin: true,
        executor: { mode: 'local' },
      }),
    /docker/,
  );
  const runner = {
    mode: 'docker',
    status: () => ({ mode: 'docker', isolated: true }),
    probe: async () => true,
    close() {},
  };
  const f = await fixture({ publicOrigin: 'https://firma.example', remoteAdmin: true, runner });
  try {
    assert.equal((await f.request('/api/company/status')).status, 200);
    const save = await f.request('/api/studio/action', {
      method: 'POST',
      payload: {
        action: 'file.save',
        payload: { project: 'firma', path: 'injected.js', text: 'bad', confirm: true },
      },
    });
    assert.equal(save.status, 400);
    assert.equal(fs.existsSync(path.join(f.root, 'injected.js')), false);
    assert.equal((await f.request('/api/company/status', { headers: { Cookie: '' } })).status, 401);
    assert.equal(
      (
        await f.request('/api/company/action', {
          method: 'POST',
          headers: { 'X-Firma-CSRF': '' },
          payload: { action: 'backup.now' },
        })
      ).status,
      403,
    );
  } finally {
    await f.close();
  }
});

test('offline isolated executor refuses remote tools and reports not ready without private data', async () => {
  const runner = {
    mode: 'docker',
    status: () => ({ mode: 'docker' }),
    probe: async () => false,
    close() {},
  };
  const f = await fixture({ publicOrigin: 'https://firma.example', remoteAdmin: true, runner });
  try {
    assert.equal((await f.request('/api/company/status')).status, 503);
    const health = await f.request('/readyz');
    assert.equal(health.status, 503);
    assert.deepEqual(await health.json(), { ok: false });
    assert.equal((await f.request('/healthz')).status, 200);
    const notices = await f.request('/assets/editor.LICENSE.txt');
    assert.equal(notices.status, 200);
    assert.equal(notices.headers.get('content-type'), 'text/plain; charset=utf-8');
  } finally {
    await f.close();
  }
});

test('automatic backup is verified, excludes credentials and restores into new copies', async () => {
  const f = await fixture();
  try {
    const p = f.project();
    f.app.workstation.projects.write({
      project: p.id,
      path: 'src/app.js',
      text: 'console.log("recover");',
      hash: '',
      confirm: true,
    });
    const created = f.app.backups.create();
    const backup = JSON.parse(fs.readFileSync(path.join(f.app.backups.dir, created.file), 'utf8'));
    assert.equal(
      crypto.createHash('sha256').update(JSON.stringify(backup.payload)).digest('hex'),
      created.sha256,
    );
    assert.doesNotMatch(JSON.stringify(backup), /Senha de testes|"salt"|"csrf"/);
    const restored = await f.app.company.action('backup.restore', { backup, confirm: true });
    assert.match(f.app.workstation.read('src/app.js', restored.projectMap[p.id]).text, /recover/);
  } finally {
    await f.close();
  }
});

test('Git task worktrees isolate commits, integrate only clean bases and preserve task attribution', async () => {
  const f = await fixture();
  try {
    const p = f.project();
    await f.app.company.action('git.init', { projectId: p.id, confirm: true });
    const run = await f.run(p.id, { 'app.js': 'console.log("git task");\n' }, { git: true });
    assert.equal(run.status, 'review', run.error);
    assert.ok(run.git.branch.startsWith('firma/task-'));
    assert.equal(fs.existsSync(path.join(p.path, 'app.js')), false);
    await f.app.company.action('run.integrate', { runId: run.id, confirm: true });
    const state = await f.app.company.git.status(p.id);
    assert.equal(state.head, run.git.head);
    assert.equal(state.changes, '');
    assert.match(state.history, /Entrega da tarefa/);
    assert.match(fs.readFileSync(path.join(p.path, 'app.js'), 'utf8'), /git task/);
    const next = await f.run(p.id, { 'app.js': 'console.log("next");\n' }, { git: true });
    fs.writeFileSync(path.join(p.path, 'app.js'), 'console.log("external edit");');
    await assert.rejects(
      f.app.company.action('run.integrate', { runId: next.id, confirm: true }),
      /Conflito|mudou/,
    );
    assert.match(fs.readFileSync(path.join(p.path, 'app.js'), 'utf8'), /external edit/);
  } finally {
    await f.close();
  }
});

test('local release packages require approval and unchanged validated sources; preparation never publishes', async () => {
  const f = await fixture();
  try {
    const p = f.project(),
      run = await f.run(p.id, { 'app.js': 'console.log("release");\n' });
    await f.app.company.action('run.integrate', { runId: run.id, confirm: true });
    await assert.rejects(
      f.app.company.action('release.prepare', { runId: run.id, confirm: true }),
      /Aprove/,
    );
    require('../engine.js').approve(f.app.company.getState(), run.taskId);
    const result = await f.app.company.action('release.prepare', { runId: run.id, confirm: true });
    assert.equal(result.published, false);
    assert.equal(result.url, null);
    assert.equal(result.target, 'static');
    const download = await f.request(result.download);
    assert.equal(download.status, 200);
    assert.equal(download.headers.get('content-type'), 'application/gzip');
    const bytes = Buffer.from(await download.arrayBuffer());
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), result.archiveSha256);
    fs.writeFileSync(path.join(p.path, 'app.js'), 'console.log("not validated");');
    await assert.rejects(
      f.app.company.action('release.prepare', { runId: run.id, confirm: true }),
      /mudou/,
    );
  } finally {
    await f.close();
  }
});

test('asynchronous Git integration locks edits, execution and backup restore until it finishes', async () => {
  const f = await fixture();
  try {
    const p = f.project();
    await f.app.company.action('git.init', { projectId: p.id, confirm: true });
    const run = await f.run(p.id, { 'app.js': 'console.log("locked");\n' }, { git: true });
    const backup = await f.app.company.action('backup.export');
    let rejectMerge;
    f.app.company.git.integrate = () =>
      new Promise((resolve, reject) => {
        rejectMerge = reject;
      });
    const pending = f.app.company.action('run.integrate', { runId: run.id, confirm: true });
    const failed = assert.rejects(pending, /Injected Git failure/);
    await wait(() => run.status === 'integrating');
    assert.throws(
      () => f.app.company.stage({ runId: run.id, path: 'app.js', content: 'bad' }),
      /alterada/,
    );
    assert.throws(
      () => f.app.company.start({ runId: run.id, operation: 'check', confirm: true }),
      /Estado inválido/,
    );
    await assert.rejects(
      f.app.company.action('backup.restore', { backup, confirm: true }),
      /Conclua ou cancele/,
    );
    rejectMerge(Error('Injected Git failure'));
    await failed;
    assert.equal(run.status, 'interrupted');
    assert.equal(fs.existsSync(path.join(p.path, 'app.js')), false);
  } finally {
    await f.close();
  }
});

test('backup metadata survives restart and restored evidence cannot authorize a fresh release', async () => {
  const f = await fixture();
  try {
    const p = f.project(),
      run = await f.run(p.id, { 'app.js': 'console.log("restored");\n' });
    await f.app.company.action('run.integrate', { runId: run.id, confirm: true });
    require('../engine.js').approve(f.app.company.getState(), run.taskId);
    const last = f.app.backups.create();
    const { AutomaticBackup } = require('../automatic-backup.cjs');
    assert.equal(new AutomaticBackup(f.app.company).status().last.sha256, last.sha256);
    const backup = JSON.parse(fs.readFileSync(path.join(f.app.backups.dir, last.file), 'utf8'));
    await f.app.company.action('backup.restore', { backup, confirm: true });
    assert.ok(f.app.company.getRun(run.id).restoredAt);
    await assert.rejects(
      f.app.company.action('release.prepare', { runId: run.id, confirm: true }),
      /Aprove/,
    );
  } finally {
    await f.close();
  }
});

test('forwarded login addresses are trusted only from the configured proxy', () => {
  const { clientAddress } = require('../request-security.cjs');
  const request = {
    socket: { remoteAddress: '127.0.0.1' },
    headers: { 'x-forwarded-for': '203.0.113.99, 198.51.100.8' },
  };
  assert.equal(clientAddress(request, ''), '127.0.0.1');
  assert.equal(clientAddress(request, '127.0.0.1'), '198.51.100.8');
  assert.equal(
    clientAddress({ ...request, socket: { remoteAddress: '198.51.100.9' } }, '127.0.0.1'),
    '198.51.100.9',
  );
  assert.equal(
    clientAddress({ ...request, headers: { 'x-forwarded-for': 'spoofed' } }, '127.0.0.1'),
    '127.0.0.1',
  );
});
