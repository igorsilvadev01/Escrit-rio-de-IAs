'use strict';
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  os = require('node:os'),
  path = require('node:path');
const { chromium } = require(process.env.FIRMA_PLAYWRIGHT || 'playwright'),
  { fakeProviders } = require('./ai-fixtures.cjs');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'firma-scene-browser-'));
fs.writeFileSync(path.join(root, 'app.js'), 'console.log("QA");');
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
    const page = await browser.newPage({ viewport: { width: 1512, height: 982 } });
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(url);
    await page.locator('#modal[open]').waitFor();
    await page.locator('#modal-submit').click();
    await page.waitForFunction(() => window.FirmaGame?.sceneDebug);
    assert.equal(
      await page.locator('button[data-scene-mode=ambient]').getAttribute('aria-pressed'),
      'true',
    );
    assert.equal(await page.locator('.scene-mission').isVisible(), false);
    const start = await page.evaluate(() => ({ ...FirmaGame.player }));
    await page.evaluate(() => {
      FirmaGame.player.x = 38;
      FirmaGame.player.y = 30;
    });
    await page.waitForFunction(() => {
      const order = FirmaGame.sceneDebug.drawOrder;
      return order.indexOf('player') < order.indexOf('tree:0');
    });
    await page.evaluate(() => {
      FirmaGame.player.x = 38;
      FirmaGame.player.y = 80;
    });
    await page.waitForFunction(() => {
      const order = FirmaGame.sceneDebug.drawOrder;
      return order.indexOf('player') > order.indexOf('tree:0');
    });
    await page.evaluate((p) => Object.assign(FirmaGame.player, p), start);
    const ids = await page.evaluate(async () => {
      await FirmaAccess.command('simulation', { paused: true });
      const { project: a } = await FirmaAccess.studio('project.create', {
          name: 'Projeto visual A',
        }),
        { project: b } = await FirmaAccess.studio('project.create', { name: 'Projeto privado B' }),
        s = FirmaEngine.migrate(FirmaUI.state);
      s.tasks = [];
      const delivery = FirmaEngine.addTask(s, {
        projectId: a.id,
        title: 'Entrega visual para revisar',
        description: 'QA',
        template: 'development',
        agent: '3',
      });
      delivery.status = 'review';
      delivery.progress = 100;
      delivery.result = 'Código revisável';
      const secret = FirmaEngine.addTask(s, {
        projectId: b.id,
        title: 'PRIVATE_OTHER_PROJECT',
        description: 'Never expose',
        template: 'planning',
        agent: '1',
      });
      secret.execution = {
        kind: 'real',
        provider: 'codex',
        role: 'planning',
        status: 'error',
        model: 'qa',
        error: 'PRIVATE_FAILURE',
        tokens: 0,
      };
      await FirmaAccess.command('restore', { state: s });
      await FirmaUI.sync();
      await FirmaProjects.select(a.id);
      return { a: a.id, b: b.id, task: delivery.id, secret: secret.id };
    });
    await page.locator('button[data-scene-mode=work]').click();
    await page.waitForFunction(() => FirmaGame.sceneDebug.hitIds.includes('badge:3'));
    const badge = await page.evaluate(() => {
      const p = FirmaGame.agentPositions.find((a) => a.id === '3');
      return FirmaGame.project({ x: p.x + 14, y: p.y - 43 });
    });
    await page.mouse.move(badge.x, badge.y);
    await page.locator('.scene-selection').waitFor({ state: 'visible' });
    await page.mouse.click(badge.x, badge.y);
    await page.locator('#modal-title').filter({ hasText: 'Entrega visual para revisar' }).waitFor();
    await page.locator('#close-modal').click();
    await page.selectOption('#company-project', ids.b);
    await page.waitForFunction(() => !FirmaGame.sceneDebug.hitIds.includes('badge:3'));
    assert.equal(await page.locator(`[data-scene-task="${ids.task}"]`).count(), 0);
    await page.selectOption('#company-project', ids.a);
    await page.locator('[data-scene-camera=desk]').click();
    await page.waitForFunction(() => FirmaGame.sceneDebug.camera.mode === 'desk');
    assert.equal(await page.evaluate(() => FirmaGame.sceneDebug.camera.x), 500);
    await page.locator('[data-scene-camera=overview]').click();
    await page.waitForFunction(() => FirmaGame.sceneDebug.camera.mode === 'overview');
    await page.locator('.scene-tools summary').click();
    await page.locator('#scene-customize').click();
    await page.locator('[name=material]').selectOption('walnut');
    await page.locator('[name=rug]').selectOption('clay');
    await page.locator('[name=lighting]').selectOption('evening');
    await page.locator('[name=reduceMotion]').check();
    await page.locator('#modal-submit').click();
    await page.waitForFunction(
      () => !document.getElementById('modal').open && FirmaSceneUI.prefs.material === 'walnut',
    );
    const animation = await page.evaluate(() => FirmaGame.sceneDebug.animationTime);
    await page.waitForTimeout(250);
    assert.equal(await page.evaluate(() => FirmaGame.sceneDebug.animationTime), animation);
    assert.equal(await page.evaluate(() => FirmaSceneUI.audioState), 'off');
    fs.mkdirSync('artifacts', { recursive: true });
    await page.mouse.move(5, 5);
    await page.screenshot({ path: path.resolve('artifacts/firma-scene-work.png'), fullPage: true });
    await page.reload();
    await page.waitForFunction(() => window.FirmaGame?.sceneDebug);
    assert.equal(await page.evaluate(() => FirmaSceneUI.prefs.material), 'walnut');
    assert.equal(
      await page.locator('button[data-scene-mode=work]').getAttribute('aria-pressed'),
      'true',
    );
    assert.equal(await page.evaluate(() => FirmaSceneUI.audioState), 'off');
    await page.locator('.scene-tools summary').click();
    await page.locator('#scene-audio').click();
    await page.waitForFunction(() => FirmaSceneUI.audioState === 'running');
    await page.locator('#scene-audio').click();
    await page.waitForFunction(() => FirmaSceneUI.audioState === 'suspended');
    await page.locator('.scene-tools summary').click();
    await page.locator('button[data-scene-mode=ambient]').click();
    await page.screenshot({
      path: path.resolve('artifacts/firma-scene-ambient.png'),
      fullPage: true,
    });
    const mobile = await browser.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    mobile.on('pageerror', (e) => errors.push(e.message));
    await mobile.goto(url);
    await mobile.waitForFunction(() => window.FirmaGame?.sceneDebug);
    await mobile.locator('[data-scene-camera=overview]').tap();
    assert.equal(
      await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
    );
    for (const direction of ['up', 'down', 'left', 'right']) {
      const clear = await mobile.locator(`[data-move="${direction}"]`).evaluate((el) => {
        const b = el.getBoundingClientRect(),
          top = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2);
        return top === el || el.contains(top);
      });
      assert.equal(clear, true, 'Touch control must not be covered: ' + direction);
    }
    await mobile.screenshot({
      path: path.resolve('artifacts/firma-scene-mobile.png'),
      fullPage: true,
    });
    await mobile.locator('.scene-tools summary').tap();
    await mobile.locator('[data-scene-agent="3"]').tap();
    await mobile.locator('#modal-title').filter({ hasText: 'Theo' }).waitFor();
    const context = await browser.newContext(),
      guest = await context.newPage();
    guest.on('pageerror', (e) => errors.push(e.message));
    await guest.goto(url);
    await guest.locator('#visit-office').click();
    await guest.waitForFunction(() => window.FirmaGame?.sceneDebug);
    await guest.locator('button[data-scene-mode=work]').click();
    assert.equal(await guest.locator('[data-scene-task]').count(), 0);
    assert.ok(!(await guest.locator('body').innerText()).includes('PRIVATE_OTHER_PROJECT'));
    await context.close();
    const performance = await page.evaluate(() => FirmaGame.sceneDebug);
    assert.ok(Number.isFinite(performance.averageRenderMs));
    assert.deepEqual(errors, []);
    assert.equal(fake.calls.length, 0);
    console.log(
      'PASS: scene depth, contextual task click, cross-project isolation, camera, local customization, persistence, reduced motion, opt-in audio, touch and visitor privacy. Average render: ' +
        performance.averageRenderMs.toFixed(2) +
        ' ms. No provider calls.',
    );
  } finally {
    await browser?.close();
    await new Promise((r) => server.close(r));
    if (
      path.dirname(root) === os.tmpdir() &&
      path.basename(root).startsWith('firma-scene-browser-')
    )
      fs.rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
