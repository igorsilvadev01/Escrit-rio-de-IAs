'use strict';
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  os = require('node:os'),
  path = require('node:path');
const { chromium } = require(process.env.FIRMA_PLAYWRIGHT || 'playwright'),
  { fakeProviders } = require('./ai-fixtures.cjs');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'firma-company-browser-'));
fs.writeFileSync(path.join(root, 'app.js'), 'console.log("QA");\n');
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
    const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(url);
    await page.locator('#modal[open]').waitFor();
    await page.locator('#modal-submit').click();
    await page.waitForFunction(() => window.FirmaProjects?.data && window.FirmaStudio);
    const projects = await page.evaluate(async () => {
      await FirmaAccess.command('simulation', { paused: true });
      const a = await FirmaAccess.studio('project.create', { name: 'Loja acessível' }),
        b = await FirmaAccess.studio('project.create', { name: 'Outro cliente' });
      await FirmaProjects.refresh();
      return [a.project, b.project];
    });
    await page.selectOption('#company-project', projects[0].id);
    await page.locator('#company-open').click();
    await page.locator('[data-company=configure]').click();
    await page.locator('[name=objective]').fill('Criar uma loja acessível');
    await page.locator('#modal-submit').click();
    await page
      .locator('.company-card h3')
      .filter({ hasText: 'Criar uma loja acessível' })
      .waitFor();
    await page.locator('[data-company-tab=memory]').click();
    await page.locator('[data-company=memory-new]').click();
    await page.locator('[name=text]').fill('Usar navegação pelo teclado');
    await page.locator('[name=approved]').check();
    await page.locator('#modal-submit').click();
    await page
      .locator('.company-card')
      .filter({ hasText: 'Usar navegação pelo teclado' })
      .waitFor();
    await page.locator('[data-company-tab=plans]').click();
    await page.locator('[data-company=plan-new]').click();
    await page.locator('[name=goal]').fill('Construir a loja');
    await page.locator('#modal-submit').click();
    await page.locator('[data-plan-step]').first().waitFor();
    assert.equal(await page.locator('[data-plan-step]').count(), 4);
    await page.locator('[data-field=title]').first().fill('Definir requisitos de acesso');
    await page.locator('#modal-submit').click();
    await page.locator('[data-start-plan]').click();
    await page.locator('.company-card').filter({ hasText: 'Iniciado em' }).waitFor();
    await page.evaluate(() => FirmaUI.closeModal());
    await page.locator('#management-button').click();
    await page.locator('.manage-nav [data-manage=tasks]').click();
    assert.equal(await page.locator('.manage-task').count(), 4);
    await page.selectOption('#company-project', projects[1].id);
    await page.waitForFunction(() => !document.querySelector('.manage-task'));
    await page.selectOption('#company-project', projects[0].id);
    await page.waitForFunction(() => document.querySelectorAll('.manage-task').length === 4);
    const task = await page.evaluate(
      () =>
        FirmaUI.state.tasks.find(
          (t) => t.projectId === FirmaProjects.current && t.template === 'planning',
        ) || FirmaUI.state.tasks.find((t) => t.projectId === FirmaProjects.current),
    );
    const run = await page.evaluate(
      async (taskId) =>
        FirmaAccess.company('run.create', {
          projectId: FirmaProjects.current,
          taskId,
          mode: 'manual',
        }),
      task.id,
    );
    await page.locator('#close-modal').click();
    await page.locator('#company-open').click();
    await page.locator('[data-company-tab=runs]').click();
    await page.locator(`[data-company-run="${run.runId}"]`).click();
    await page.locator('[data-run-stage]').click();
    await page.locator('[name=path]').fill('app.js');
    await page.locator('[name=content]').fill('console.log("copia revisada");\n');
    await page.locator('#modal-submit').click();
    assert.equal(fs.existsSync(path.join(projects[0].path, 'app.js')), false);
    await page.locator('[data-run-check]').click();
    assert.equal(await page.locator('[name=confirm]').isChecked(), false);
    await page.locator('[name=confirm]').check();
    await page.locator('#modal-submit').click();
    await page.waitForFunction(
      async (id) => (await FirmaAccess.companyRead('run?id=' + id)).status === 'review',
      run.runId,
    );
    await page.locator('[data-company-run]').click();
    await page.locator('.company-evidence summary').filter({ hasText: 'Passou' }).waitFor();
    fs.mkdirSync('artifacts', { recursive: true });
    await page.screenshot({
      path: path.resolve('artifacts/firma-company-validation.png'),
      fullPage: true,
    });
    await page.locator('[data-run-integrate]').click();
    await page.locator('#modal-submit').click();
    await page.locator('.task-detail-meta').filter({ hasText: 'Integrada' }).waitFor();
    assert.match(fs.readFileSync(path.join(projects[0].path, 'app.js'), 'utf8'), /copia revisada/);
    await page.locator('[data-company-tab=runs]').click();
    await page.locator('[data-company-tab=settings]').click();
    const download = page.waitForEvent('download');
    await page.locator('[data-company=export]').click();
    assert.match((await download).suggestedFilename(), /firma-completa/);
    await page.evaluate(async () => {
      await FirmaAccess.command('task.create', {
        projectId: FirmaProjects.current,
        template: 'development',
        agent: '3',
        title: 'Comparar outra solução',
        description: 'QA',
        executionMode: 'real',
      });
      await FirmaUI.sync();
      const task = FirmaUI.state.tasks.at(-1);
      await FirmaAccess.company('run.create', {
        projectId: FirmaProjects.current,
        taskId: task.id,
        mode: 'manual',
      });
      await FirmaProjects.refresh();
    });
    await page.locator('[data-company=compare]').click();
    await page.locator('[name=b]').selectOption({ index: 1 });
    await page.locator('#modal-submit').click();
    await page.locator('.company-comparison table').waitFor();
    assert.match(
      await page.locator('.company-comparison').innerText(),
      /Duração da última tentativa/,
    );
    await page.evaluate(() => FirmaProjects.open('settings'));
    await page.locator('[data-company=appearance]').click();
    await page.locator('[name=reducedMotion]').check();
    await page.locator('[name=social]').uncheck();
    await page.locator('#modal-submit').click();
    await page.waitForFunction(() => document.body.classList.contains('reduced-motion'));
    await page.evaluate(() => FirmaUI.closeModal());
    await page.evaluate(() => FirmaGame.openStation('admin'));
    await page.locator('#studio[open]').waitFor();
    assert.equal(await page.locator('#st-project').inputValue(), projects[0].id);
    await page.locator('#st-close').click();
    const mobile = await browser.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    mobile.on('pageerror', (e) => errors.push(e.message));
    await mobile.goto(url);
    await mobile.waitForFunction(() => window.FirmaProjects?.data);
    await mobile.selectOption('#company-project', projects[0].id);
    await mobile.locator('#company-open').click();
    await mobile.locator('[data-company-tab=runs]').click();
    assert.equal(
      await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
    );
    assert.equal(
      await mobile.evaluate(() => {
        const d = document.getElementById('modal');
        return d.scrollWidth <= d.clientWidth;
      }),
      true,
    );
    await mobile.screenshot({
      path: path.resolve('artifacts/firma-company-mobile.png'),
      fullPage: true,
    });
    assert.equal(fake.calls.length, 0);
    assert.deepEqual(errors, []);
    console.log(
      'PASS: project scope, objective, approved memory, editable plan, manual copy, evidence, integration, backup, motion settings, desk sync and mobile layout; zero real AI calls.',
    );
  } finally {
    await browser?.close();
    await new Promise((r) => server.close(r));
    if (
      path.dirname(root) === os.tmpdir() &&
      path.basename(root).startsWith('firma-company-browser-')
    )
      fs.rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
