'use strict';
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  os = require('node:os'),
  path = require('node:path'),
  zlib = require('node:zlib');
const { chromium } = require('playwright'),
  { fakeProviders } = require('./ai-fixtures.cjs');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'firma-production-browser-'));
fs.writeFileSync(path.join(root, 'app.js'), 'console.log("application");');
const fake = fakeProviders(),
  server = require('./browser-server.cjs').office(fake, { workspaceRoot: root });
(async () => {
  let browser;
  const errors = [];
  try {
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    const url = 'http://127.0.0.1:' + server.address().port;
    browser = await chromium.launch({
      headless: true,
      ...(process.env.FIRMA_BROWSER ? { executablePath: process.env.FIRMA_BROWSER } : {}),
    });
    await server.authorizeBrowser(browser);
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(url);
    await page.locator('#modal[open]').waitFor();
    await page.locator('#modal-submit').click();
    await page.waitForFunction(() => window.FirmaStudio && window.FirmaProjects?.data);
    const project = await page.evaluate(async () => {
      const { project } = await FirmaAccess.studio('project.create', { name: 'Versão local' });
      await FirmaAccess.studio('file.save', {
        project: project.id,
        path: 'main.js',
        text: 'const value = 1;\n',
        hash: '',
        confirm: true,
      });
      await FirmaAccess.command('task.create', {
        projectId: project.id,
        template: 'development',
        agent: '3',
        title: 'Entrega para pacote',
        description: 'Criar uma versão local.',
        executionMode: 'real',
      });
      await FirmaUI.sync();
      await FirmaProjects.select(project.id);
      return project;
    });
    await page.evaluate(() => FirmaGame.openStation('admin', 'code'));
    await page.locator('[data-file="main.js"]').first().click();
    const editor = page.locator('#st-codemirror .cm-content');
    await editor.fill('const value = 2;\n');
    await editor.press('Control+z');
    assert.equal(await page.evaluate(() => FirmaEditor.value()), 'const value = 1;\n');
    await editor.press('Control+y');
    await page.waitForFunction(() => FirmaEditor.value() === 'const value = 2;\n');
    assert.equal(await page.evaluate(() => FirmaEditor.value()), 'const value = 2;\n');
    await editor.press('Control+s');
    await page.waitForFunction(
      () => document.getElementById('st-file-state').textContent === 'SALVO NO DISCO',
    );
    assert.match(fs.readFileSync(path.join(project.path, 'main.js'), 'utf8'), /value = 2/);
    const size = await page.evaluate(() => ({
      editor: document.getElementById('st-codemirror').getBoundingClientRect().width,
      wrap: document.querySelector('.st-code-wrap').getBoundingClientRect().width,
    }));
    assert.ok(size.editor >= size.wrap - 5, 'O editor precisa ocupar toda a largura disponível.');
    await page.locator('#st-close').click();
    await page.locator('#company-open').click();
    await page.locator('[data-company-tab=settings]').click();
    await page.locator('[data-company=git]').click();
    await page.locator('#modal-submit').filter({ hasText: 'Inicializar Git' }).click();
    await page
      .locator('#modal-content')
      .filter({ hasText: 'Nenhuma alteração pendente.' })
      .waitFor();
    await page.locator('#close-modal').click();
    await page.locator('#company-open').click();
    await page.locator('[data-company-tab=runs]').click();
    await page.locator('[data-company=run-new]').click();
    await page.locator('#modal [name=git]').check();
    await page.locator('#modal-submit').click();
    await page.locator('[data-inspected-run]').waitFor({ state: 'attached' });
    const runId = await page.locator('[data-inspected-run]').getAttribute('data-inspected-run');
    await page.locator('[data-run-stage]').click();
    await page.locator('[name=path]').fill('main.js');
    await page.locator('[name=content]').fill('const value = 3;\n');
    await page.locator('#modal-submit').click();
    await page.locator('[data-run-check]').click();
    await page.locator('[name=confirm]').check();
    await page.locator('#modal-submit').click();
    await page.waitForFunction(
      async (id) => (await (await fetch('/api/company/run?id=' + id)).json()).status === 'review',
      runId,
    );
    await page.locator('[data-company-run="' + runId + '"]').click();
    await page.locator('[data-run-integrate]').click();
    await page.locator('#modal-submit').click();
    await page.locator('[data-run-status=integrated]').waitFor({ state: 'attached' });
    await page.evaluate(async (id) => {
      const run = await FirmaAccess.companyRead('run?id=' + id);
      await FirmaAccess.command('task.approve', { id: run.taskId });
      await FirmaUI.sync();
    }, runId);
    await page.locator('[data-prepare-release]').click();
    await page.locator('#modal-submit').click();
    const downloadEvent = page.waitForEvent('download');
    await page.locator('#modal-content a[download]').click();
    const download = await downloadEvent;
    const content = zlib.gunzipSync(fs.readFileSync(await download.path())).toString('utf8');
    assert.match(content, /firma-release.json/);
    assert.match(content, /"published": false/);
    assert.match(content, /value = 3/);
    await page.locator('#close-modal').click();
    await page.locator('#company-open').click();
    await page.locator('[data-company-tab=settings]').click();
    await page.locator('[data-company=backup-now]').click();
    await page.locator('#toast').filter({ hasText: 'Backup verificado' }).waitFor();
    assert.equal(fake.calls.length, 0);
    assert.deepEqual(errors, []);
    fs.mkdirSync('artifacts', { recursive: true });
    await page.screenshot({
      path: path.resolve('artifacts/firma-production-prepared.png'),
      fullPage: true,
    });
    console.log(
      'PASS: real editor undo/redo and width, save, Git initialization and task worktree, verification, integration, approved static release download and verified backup; no external publishing or model calls.',
    );
  } finally {
    await browser?.close();
    await new Promise((r) => server.close(r));
    if (
      path.dirname(root) === os.tmpdir() &&
      path.basename(root).startsWith('firma-production-browser-')
    )
      fs.rmSync(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
