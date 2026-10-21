const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path');
const { chromium } = require(process.env.FIRMA_PLAYWRIGHT || 'playwright');
const server = require('./browser-server.cjs').office(),
  root = path.resolve(__dirname, '..');
const password = 'Uma senha de navegador 2026!';
(async () => {
  let browser;
  const errors = [];
  try {
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const url = `http://127.0.0.1:${server.address().port}`;
    browser = await chromium.launch({
      headless: true,
      ...(process.env.FIRMA_BROWSER ? { executablePath: process.env.FIRMA_BROWSER } : {}),
    });
    const owner = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    owner.on('pageerror', (e) => errors.push(e.message));
    await owner.goto(url);
    await owner.locator('#visit-office:enabled').waitFor();
    assert.equal(await owner.locator('#show-login').isVisible(), true);
    assert.equal(await owner.locator('#setup-form').isVisible(), false);
    assert.equal(await owner.locator('main').isVisible(), false);
    fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true });
    await owner.screenshot({
      path: path.join(root, 'artifacts', 'firma-login-desktop.png'),
      fullPage: true,
    });
    await owner.evaluate(() => {
      const old = FirmaEngine.create();
      old.company = 'Meu escritório anterior';
      localStorage.setItem('firma-office-v2', JSON.stringify(old));
    });
    await owner.goto(url + '/#configurar=' + server.setupToken());
    await owner.locator('#setup-form:not([hidden])').waitFor();
    assert.equal(await owner.evaluate(() => location.hash), '');
    await owner.locator('#setup-username').fill('igor');
    await owner.locator('#setup-password').fill(password);
    await owner.locator('#setup-confirm').fill(password);
    await owner.locator('#setup-form button[type="submit"]').click();
    await owner.locator('#legacy-choice:not([hidden])').waitFor();
    await owner.locator('#import-legacy').click();
    await owner.locator('#modal[open]').waitFor();
    await owner.locator('#modal-submit').click();
    await owner.locator('#modal[open]').waitFor({ state: 'hidden' });
    assert.match(await owner.locator('#access-role').innerText(), /ADMIN/);
    assert.equal(await owner.evaluate(() => FirmaUI.state.company), 'Meu escritório anterior');
    await owner.evaluate(async () => {
      await FirmaAccess.command('memory', { memory: 'SEGREDO PRIVADO DO FUNDADOR' });
      await FirmaAccess.command('agent.hire', {
        name: 'Ada',
        role: 'Engenheira',
        instructions: 'INSTRUÇÃO PRIVADA',
      });
      await FirmaUI.sync();
    });
    const visitor = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    visitor.on('pageerror', (e) => errors.push(e.message));
    await visitor.goto(url);
    await visitor.locator('#visit-office:enabled').waitFor();
    await visitor.locator('#visit-office').click();
    await visitor.locator('body.visitor.playing').waitFor();
    assert.equal(await visitor.evaluate(() => FirmaUI.state.agents.length), 7);
    assert.equal(await visitor.locator('#hire-button').isVisible(), false);
    assert.equal(await visitor.locator('[data-action="character"]').isVisible(), false);
    const response = await visitor.evaluate(async () => {
      const r = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'memory', payload: { memory: 'invaded' } }),
      });
      return r.status;
    });
    assert.equal(response, 401);
    const publicData = await visitor.evaluate(async () =>
      JSON.stringify(await (await fetch('/api/state')).json()),
    );
    assert.equal(publicData.includes('SEGREDO PRIVADO'), false);
    assert.equal(publicData.includes('INSTRUÇÃO PRIVADA'), false);
    const seconds = await visitor.evaluate(() => FirmaUI.state.seconds);
    await visitor.waitForFunction((before) => FirmaUI.state.seconds > before, seconds, {
      timeout: 5000,
    });
    const before = await visitor.evaluate(() => FirmaGame.player.y);
    await visitor.locator('#office-canvas').focus();
    await visitor.keyboard.down('w');
    await visitor.waitForTimeout(300);
    await visitor.keyboard.up('w');
    assert.ok(await visitor.evaluate((y) => FirmaGame.player.y < y - 15, before));
    await visitor.locator('.office-destinations summary').click();
    await visitor.locator('[data-destination="planning"]').click();
    await visitor.locator('#modal[open]').waitFor({ timeout: 10000 });
    assert.match(await visitor.locator('#modal-title').innerText(), /Gestão da Firma/);
    assert.equal(await visitor.locator('#modal-content [data-action="new-task"]').count(), 0);
    await visitor.locator('[data-manage="tasks"]').click();
    await visitor.locator('#modal-content .manage-task').first().click();
    assert.equal(await visitor.locator('#modal-submit').isVisible(), false);
    assert.match(await visitor.locator('#modal-content').innerText(), /administrador/);
    await visitor.locator('#close-modal').click();
    await visitor.screenshot({
      path: path.join(root, 'artifacts', 'firma-visitor-desktop.png'),
      fullPage: true,
    });
    await owner.locator('#session-exit').click();
    await owner.locator('#visit-office:enabled').waitFor();
    assert.equal(await owner.evaluate(async () => (await fetch('/api/backup')).status), 401);
    await owner.locator('#show-login').click();
    await owner.locator('#login-username').fill('igor');
    await owner.locator('#login-password').fill('senha incorreta');
    await owner.locator('#login-form button[type="submit"]').click();
    await owner.waitForFunction(() =>
      document.getElementById('access-error').textContent.includes('inválidos'),
    );
    assert.equal(await owner.locator('main').isVisible(), false);
    await owner.locator('#login-password').fill(password);
    await owner.locator('#login-form button[type="submit"]').click();
    await owner.locator('#access-gate').waitFor({ state: 'hidden' });
    assert.match(await owner.locator('#access-role').innerText(), /ADMIN/);
    assert.equal(await owner.evaluate(() => FirmaUI.state.memory), 'SEGREDO PRIVADO DO FUNDADOR');
    const mobile = await browser.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    mobile.on('pageerror', (e) => errors.push(e.message));
    await mobile.goto(url);
    await mobile.locator('#visit-office:enabled').waitFor();
    assert.equal(
      await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
    );
    await mobile.screenshot({
      path: path.join(root, 'artifacts', 'firma-login-mobile.png'),
      fullPage: true,
    });
    await mobile.locator('#visit-office').click();
    await mobile.locator('body.visitor.playing').waitFor();
    assert.equal(
      await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
    );
    await mobile.screenshot({
      path: path.join(root, 'artifacts', 'firma-visitor-mobile.png'),
      fullPage: true,
    });
    assert.deepEqual(errors, []);
    console.log(
      'PASS: public welcome, owner-only setup, private token removal, login, failed login, logout, visitor walking, protected actions, redacted data, live server progress, persistent private state, desktop/mobile; no browser errors.',
    );
  } finally {
    await browser?.close();
    server.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
