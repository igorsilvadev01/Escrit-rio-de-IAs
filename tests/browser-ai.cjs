'use strict';
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path');
const { chromium } = require(process.env.FIRMA_PLAYWRIGHT || 'playwright'),
  { fakeProviders } = require('./ai-fixtures.cjs');
const fake = fakeProviders(),
  server = require('./browser-server.cjs').office(fake);
(async () => {
  let browser;
  const errors = [];
  try {
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const url = 'http://127.0.0.1:' + server.address().port;
    browser = await chromium.launch({
      headless: true,
      ...(process.env.FIRMA_BROWSER ? { executablePath: process.env.FIRMA_BROWSER } : {}),
    });
    await server.authorizeBrowser(browser);
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    page.on('pageerror', (e) => errors.push(e.message));
    await page.context().route('https://auth.openai.com/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<p>Login oficial substituído por QA. Nenhuma conta real acessada.</p>',
      }),
    );
    await page.goto(url);
    await page.locator('#modal[open]').waitFor();
    await page.locator('#close-modal').click();
    await page.evaluate(() => FirmaAI.open());
    await page.locator('.ai-provider-card').first().waitFor();
    assert.equal(await page.locator('.ai-provider-card').count(), 3);
    assert.equal(await page.locator('[data-ai-connect="claude"]').count(), 0);
    assert.match(await page.locator('#ai-codex-plan').innerText(), /desconectado/);
    fake.settings.plan = 'pro';
    async function submit() {
      await page.locator('#modal-submit').click();
    }
    for (const provider of ['gemini']) {
      await page.locator('[data-ai-connect="' + provider + '"]').click();
      await page.locator('[name="apiKey"]').fill('QA_SECRET_API_KEY_1234567890');
      await submit();
      await page
        .locator('[data-ai-status="' + provider + '"]')
        .filter({ hasText: 'Conectado' })
        .waitFor();
      assert.ok(!(await page.content()).includes('QA_SECRET_API_KEY'));
    }
    await page.locator('[data-ai-connect="codex"]').click();
    await page.locator('#ai-login-status').waitFor();
    await page
      .locator('[data-ai-status="codex"]')
      .filter({ hasText: 'Conectado' })
      .waitFor({ timeout: 12000 });
    assert.match(await page.locator('#ai-codex-plan').innerText(), /plano da conta: pro/);
    await page.locator('[data-ai-settings]').click();
    await page.locator('[name="leadership-provider"]').waitFor();
    assert.equal(await page.locator('[name="leadership-provider"] option').count(), 1);
    await page.locator('[name="dailyLimit"]').fill('8');
    await submit();
    await page.locator('.ai-usage').filter({ hasText: '/ 8' }).waitFor();
    fs.mkdirSync('artifacts', { recursive: true });
    await page.screenshot({
      path: path.resolve('artifacts/firma-ai-connections-desktop.png'),
      fullPage: true,
    });
    await page.locator('[data-ai-order]').click();
    await page
      .locator('[name="goal"]')
      .fill('Defina prioridades e riscos de uma plataforma de estudos.');
    await submit();
    assert.equal(fake.calls.length, 0);
    await page.locator('[name="confirm"]').check();
    await submit();
    await page.waitForFunction(
      () =>
        FirmaUI.state.tasks.some(
          (t) => t.execution?.role === 'leadership' && t.status === 'review',
        ),
      {},
      { timeout: 10000 },
    );
    assert.equal(fake.calls[0].provider, 'codex');
    await page.evaluate(() =>
      FirmaUI.taskDetail(FirmaUI.state.tasks.find((t) => t.execution?.role === 'leadership').id),
    );
    assert.match(await page.locator('#modal-content').innerText(), /gerada por IA/);
    await page.screenshot({
      path: path.resolve('artifacts/firma-ai-real-delivery.png'),
      fullPage: true,
    });
    await page.locator('#close-modal').click();
    await page.evaluate(() => FirmaUI.newTask('development'));
    await page.locator('[name="title"]').fill('Função de desenvolvimento');
    await page.locator('[name="description"]').fill('Proponha uma função pequena.');
    await page.locator('[name="executionMode"]').selectOption('real');
    await submit();
    await page.waitForFunction(() =>
      FirmaUI.state.tasks.some((t) => t.title === 'Função de desenvolvimento'),
    );
    await page.evaluate(() =>
      FirmaAI.queue(FirmaUI.state.tasks.find((t) => t.title === 'Função de desenvolvimento').id),
    );
    await page.locator('[name="confirm"]').waitFor();
    await page.locator('[name="confirm"]').check();
    await submit();
    await page.waitForFunction(
      () =>
        FirmaUI.state.tasks.some(
          (t) =>
            t.template === 'development' && t.execution?.kind === 'real' && t.status === 'review',
        ),
      {},
      { timeout: 12000 },
    );
    assert.equal(fake.calls.filter((c) => c.provider === 'codex').length, 2);
    await page.evaluate(() => FirmaAI.agentOrder('6'));
    await page.locator('[name="goal"]').fill('Revise o plano e proponha casos de erro.');
    await page.locator('[name="confirm"]').check();
    await submit();
    await page.waitForFunction(
      () =>
        FirmaUI.state.tasks.some(
          (t) => t.execution?.provider === 'gemini' && t.status === 'review',
        ),
      {},
      { timeout: 10000 },
    );
    assert.equal(fake.calls.at(-1).provider, 'gemini');
    const mobile = await browser.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    mobile.on('pageerror', (e) => errors.push(e.message));
    await mobile.goto(url);
    await mobile.waitForFunction(() => window.FirmaAI);
    await mobile.evaluate(() => FirmaAI.open());
    await mobile.locator('.ai-provider-card').first().waitFor();
    assert.equal(
      await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
    );
    await mobile.screenshot({
      path: path.resolve('artifacts/firma-ai-connections-mobile.png'),
      fullPage: true,
    });
    const guest = await browser.newContext(),
      visitor = await guest.newPage();
    await visitor.goto(url);
    await visitor.locator('#visit-office').click();
    await visitor.waitForFunction(() => window.FirmaGame);
    assert.equal(await visitor.evaluate(async () => (await fetch('/api/ai/status')).status), 401);
    await visitor.evaluate(() => FirmaUI.interact({ id: 'leadership' }));
    assert.equal(await visitor.locator('[data-action="ai-connections"]').count(), 0);
    await guest.close();
    assert.deepEqual(errors, []);
    console.log(
      'PASS: connection UI, API key not retained in DOM, isolated OAuth UX with test doubles, provider mapping, limits, explicit consent, leader order, real task queue, honest output, mobile and visitor permissions. No real provider calls or credits used.',
    );
  } finally {
    await browser?.close();
    server.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
