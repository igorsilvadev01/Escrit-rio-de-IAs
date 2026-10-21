'use strict';
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  os = require('node:os'),
  path = require('node:path');
const { chromium } = require(process.env.FIRMA_PLAYWRIGHT || 'playwright'),
  { fakeProviders } = require('./ai-fixtures.cjs');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'firma-desk-qa-'));
fs.writeFileSync(path.join(root, 'app.js'), 'console.log("QA");\n');
fs.writeFileSync(path.join(root, 'README.md'), '# QA');
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
    page.on('dialog', (d) => d.accept());
    await page.goto(url);
    await page.locator('#modal[open]').waitFor();
    await page.locator('#modal-submit').click();
    await page.waitForFunction(() => window.FirmaStudio);
    await page.evaluate(async () => {
      await FirmaAccess.ai('connect', { provider: 'gemini', key: 'QA_SECRET_API_KEY_1234567890' });
      await FirmaAccess.ai('codex.login');
      await FirmaAccess.ai('codex.check');
    });
    await page.evaluate(() => FirmaGame.openStation('leadership', 'chat'));
    await page.locator('#studio[open]').waitFor();
    await page.locator('#st-project option').first().waitFor({ state: 'attached' });
    assert.match(await page.locator('#studio-title').innerText(), /Codex/);
    fs.mkdirSync('artifacts', { recursive: true });
    await page.screenshot({ path: path.resolve('artifacts/firma-codex-desk.png'), fullPage: true });
    await page.locator('#st-project-new').click();
    await page.locator('#modal [name="name"]').fill('Meu aplicativo de QA');
    await page.locator('#modal [name="description"]').fill('Um projeto criado no jogo.');
    await page.locator('#modal-submit').click();
    await page.waitForFunction(
      () => FirmaStudio.project !== 'firma' && !document.getElementById('modal').open,
    );
    const project = await page.evaluate(() =>
      FirmaStudio.live.projects.find((p) => p.id === FirmaStudio.project),
    );
    assert.ok(fs.existsSync(path.join(project.path, 'index.html')));
    await page.locator('[data-file="index.html"]').first().click();
    await page
      .locator('#st-codemirror .cm-content')
      .fill('<!doctype html>\n<h1>Meu app funcionando no disco</h1>\n');
    await page.locator('#st-codemirror .cm-content').press('Control+s');
    await page.waitForFunction(
      () => document.getElementById('st-file-state').textContent === 'SALVO NO DISCO',
    );
    assert.match(
      fs.readFileSync(path.join(project.path, 'index.html'), 'utf8'),
      /Meu app funcionando/,
    );
    await page.locator('#st-file-new').click();
    await page.locator('#modal [name="path"]').fill('src/main.js');
    await page.locator('#modal-submit').click();
    await page.waitForFunction(
      () =>
        document.getElementById('st-file-name').textContent === 'src/main.js' &&
        !document.getElementById('modal').open,
    );
    await page.locator('#st-codemirror .cm-content').fill('console.log("Meu projeto");\n');
    await page.locator('#st-save-file').click();
    await page.waitForFunction(
      () => document.getElementById('st-file-state').textContent === 'SALVO NO DISCO',
    );
    await page.locator('#st-layout-terminal').click();
    await page.locator('#st-run').click();
    await page.locator('#st-terminal-output').filter({ hasText: 'concluído' }).waitFor();
    assert.match(
      await page.locator('#st-terminal-output').innerText(),
      /node --check src\/main.js/,
    );
    await page.locator('[data-contact="agent:1"]').click();
    await page
      .locator('#st-prompt')
      .fill('Plano exclusivo do Atlas <img src=x onerror="window.QA_XSS=1">');
    await page.locator('.ide-send-options summary').click();
    await page.locator('#st-attach').check();
    await page.locator('#st-consent').check();
    await page.locator('#st-send').click();
    await page
      .locator('.st-message-body')
      .filter({ hasText: 'resposta em tempo real de QA' })
      .waitFor();
    assert.match(JSON.stringify(fake.calls.at(-1).payload), /src\/main.js/);
    assert.equal(await page.locator('.st-message-body img').count(), 0);
    assert.equal(await page.evaluate(() => window.QA_XSS), undefined);
    await page.locator('#st-role').selectOption('agent:2');
    assert.match(await page.locator('#st-messages').innerText(), /Esta é sua conversa com Luna/);
    await page.locator('#st-prompt').fill('Ideia exclusiva da Luna');
    await page.locator('#st-consent').check();
    await page.locator('#st-send').click();
    await page
      .locator('.st-message-body')
      .filter({ hasText: 'resposta em tempo real de QA' })
      .waitFor();
    assert.ok(
      !(await page.locator('#st-messages').innerText()).includes('Plano exclusivo do Atlas'),
    );
    await page.locator('#st-role').selectOption('agent:1');
    await page
      .locator('.st-message-body')
      .filter({ hasText: 'Plano exclusivo do Atlas' })
      .waitFor();
    assert.equal(fake.calls.length, 2);
    await page
      .locator('.st-message button')
      .filter({ hasText: 'Criar tarefa com esta resposta' })
      .click();
    await page.locator('#modal [name="title"]').fill('Tarefa do Atlas pela conversa');
    assert.match(
      await page.locator('#modal [name="description"]').inputValue(),
      /resposta em tempo real/,
    );
    await page.locator('#modal-submit').click();
    await page.waitForFunction(() =>
      FirmaUI.state.tasks.some(
        (t) => t.title === 'Tarefa do Atlas pela conversa' && t.agent === '1',
      ),
    );
    await page.locator('#close-modal').click();
    await page.evaluate(() => FirmaStudio.openAgent('1'));
    await page.locator('[data-pane="prompts"]').click();
    await page.locator('#st-prompt-new').click();
    await page.locator('#modal [name="title"]').fill('Prompt de QA');
    await page.locator('#modal [name="text"]').fill('Revise minha experiência de uso.');
    await page.locator('#modal-submit').click();
    await page.locator('#st-prompt-list h4').filter({ hasText: 'Prompt de QA' }).waitFor();
    await page
      .locator('#st-prompt-list article')
      .filter({ hasText: 'Prompt de QA' })
      .locator('button')
      .click();
    assert.equal(await page.locator('#st-prompt').inputValue(), 'Revise minha experiência de uso.');
    await page.locator('[data-pane="code"]').click();
    await page.screenshot({
      path: path.resolve('artifacts/firma-programming-desk.png'),
      fullPage: true,
    });
    await page.locator('#st-close').click();
    await page.evaluate(() => FirmaUI.agentDetail('2'));
    await page.locator('[data-studio-agent="2"]').click();
    await page.waitForFunction(
      () =>
        document.getElementById('st-role').value === 'agent:2' &&
        document.getElementById('studio').open,
    );
    assert.match(await page.locator('#st-messages').innerText(), /Ideia exclusiva da Luna/);
    const mobile = await browser.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    mobile.on('pageerror', (e) => errors.push(e.message));
    await mobile.goto(url);
    await mobile.waitForFunction(() => window.FirmaStudio);
    await mobile.evaluate(async (id) => {
      await FirmaProjects.select(id);
      await FirmaStudio.openAgent('1');
    }, project.id);
    await mobile
      .locator('.st-message-body')
      .filter({ hasText: 'Plano exclusivo do Atlas' })
      .waitFor();
    assert.equal(
      await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
    );
    assert.equal(
      await mobile.evaluate(() => {
        const d = document.getElementById('studio');
        return d.scrollWidth <= d.clientWidth;
      }),
      true,
    );
    const send = await mobile.locator('#st-send').boundingBox();
    assert.ok(send.y + send.height < 844);
    await mobile.screenshot({
      path: path.resolve('artifacts/firma-programming-mobile.png'),
      fullPage: true,
    });
    const guest = await browser.newContext(),
      visitor = await guest.newPage();
    await visitor.goto(url);
    await visitor.locator('#visit-office').click();
    await visitor.waitForFunction(() => window.FirmaGame);
    assert.equal(
      await visitor.evaluate(async () => (await fetch('/api/studio/status')).status),
      401,
    );
    await guest.close();
    assert.deepEqual(errors, []);
    console.log(
      'PASS: Codex entry, real project/file creation and disk saves, syntax terminal, isolated agent chats, prompts, profile navigation, mobile and visitor limits. Only protocol doubles used.',
    );
  } finally {
    await browser?.close();
    await new Promise((r) => server.close(r));
    if (path.dirname(root) === os.tmpdir() && path.basename(root).startsWith('firma-desk-qa-'))
      fs.rmSync(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
