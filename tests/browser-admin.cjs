'use strict';
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path');
const { chromium } = require('playwright'),
  { fakeProviders } = require('./ai-fixtures.cjs');
const fake = fakeProviders(),
  server = require('./browser-server.cjs').office(fake);
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
    await page.waitForFunction(() => window.FirmaStudio && !document.getElementById('modal').open);
    await page.evaluate(() => FirmaGame.openStation('admin', 'chat'));
    await page.locator('#studio[open]').waitFor();
    assert.equal(await page.locator('#st-role').inputValue(), 'development');
    assert.match(await page.locator('#studio-title').innerText(), /Sua mesa/);
    await page.evaluate(async () => {
      await FirmaAccess.ai('codex.login');
      await FirmaAccess.ai('codex.check');
    });
    await page.waitForFunction(() => !document.getElementById('st-send').disabled);
    await page.locator('#st-prompt').fill('Proponha uma função pequena.');
    await page.locator('.ide-send-options summary').click();
    await page.locator('#st-consent').check();
    await page.locator('#st-send').click();
    await page.locator('.st-message-body').filter({ hasText: 'Resposta de QA do Codex' }).waitFor();
    assert.equal(fake.calls.length, 1);
    await page.locator('[data-pane=tasks]').click();
    await page.locator('#st-task-new').click();
    await page.locator('#modal [name=title]').fill('Tarefa criada pela mesa');
    await page.locator('#modal [name=description]').fill('Implementar uma função.');
    await page.locator('#modal [name=executionMode]').selectOption('real');
    await page.locator('#modal-submit').click();
    await page.waitForFunction(() =>
      FirmaUI.state.tasks.some(
        (t) => t.title === 'Tarefa criada pela mesa' && t.execution?.status === 'held',
      ),
    );
    assert.equal(fake.calls.length, 1);
    await page.locator('#close-modal').click();
    const guest = await browser.newContext(),
      visitor = await guest.newPage();
    await visitor.goto(url);
    await visitor.locator('#visit-office:enabled').click();
    await visitor.waitForFunction(() => window.FirmaGame);
    await visitor.evaluate(() => FirmaGame.openStation('admin'));
    assert.equal(await visitor.locator('#studio').count(), 0);
    assert.equal(
      await visitor.evaluate(async () => (await fetch('/api/studio/status')).status),
      401,
    );
    await guest.close();
    fs.mkdirSync('artifacts', { recursive: true });
    await page.screenshot({
      path: path.resolve('artifacts/firma-admin-current.png'),
      fullPage: true,
    });
    assert.deepEqual(errors, []);
    console.log(
      'PASS: admin desk, explicit provider consent, held task creation, shared history and visitor restrictions; one mocked provider call.',
    );
  } finally {
    await browser?.close();
    server.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
