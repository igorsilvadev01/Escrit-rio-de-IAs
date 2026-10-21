'use strict';
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  os = require('node:os'),
  path = require('node:path');
const { chromium } = require(process.env.FIRMA_PLAYWRIGHT || 'playwright'),
  { fakeProviders } = require('./ai-fixtures.cjs');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'firma-workbench-qa-'));
fs.writeFileSync(path.join(root, 'app.js'), 'console.log("Firma QA");\n');
const fake = fakeProviders();
fake.codex.run = async (request) => {
  fake.calls.push({ provider: 'codex', system: request.system });
  const value = 'Sugestão de código:\n```js\nconsole.log("sugestao revisada");\n```';
  request.onDelta?.(value);
  return { text: value, model: 'qa-codex', usage: { tokens: 12 } };
};
const server = require('./browser-server.cjs').office(fake, { workspaceRoot: root });
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
    const project = await page.evaluate(async () => {
      const { project: p } = await FirmaAccess.studio('project.create', {
        name: 'Bancada diária',
        description: 'Projeto de testes isolado',
      });
      const html = await FirmaAccess.studioRead('file?project=' + p.id + '&path=index.html');
      await FirmaAccess.studio('file.save', {
        project: p.id,
        path: 'index.html',
        hash: html.hash,
        confirm: true,
        text: '<!doctype html><html><head><link rel="stylesheet" href="style.css"></head><body><h1>Prévia inicial</h1><button id="preview-button">Trocar texto</button><p id="sandbox-result"></p><script src="app.js"></script></body></html>',
      });
      await FirmaAccess.studio('file.save', {
        project: p.id,
        path: 'style.css',
        hash: '',
        confirm: true,
        text: 'h1{color:rgb(30,90,40)}',
      });
      await FirmaAccess.studio('file.save', {
        project: p.id,
        path: 'app.js',
        hash: '',
        confirm: true,
        text: 'document.getElementById("preview-button").onclick=()=>{document.querySelector("h1").textContent="Prévia funcionando";};try{window.parent.QA_ESCAPE=true;}catch{document.getElementById("sandbox-result").textContent="isolada";}',
      });
      await FirmaAccess.studio('file.save', {
        project: p.id,
        path: 'src/main.js',
        hash: '',
        confirm: true,
        text: 'console.log("arquivo original");\n',
      });
      return p;
    });
    await page.evaluate(() => FirmaStudio.open('admin', 'home'));
    await page
      .locator('#st-project option')
      .filter({ hasText: 'Bancada diária' })
      .waitFor({ state: 'attached' });
    await page.locator('#st-project').selectOption(project.id);
    await page.locator('[data-file="index.html"]').first().click();
    await page.locator('#st-preview-open').click();
    const preview = page.frameLocator('#st-preview-frame');
    await preview.locator('h1').filter({ hasText: 'Prévia inicial' }).waitFor();
    await preview.locator('#preview-button').click();
    assert.equal(await preview.locator('h1').innerText(), 'Prévia funcionando');
    assert.equal(await preview.locator('#sandbox-result').innerText(), 'isolada');
    assert.equal(await page.evaluate(() => window.QA_ESCAPE), undefined);
    assert.equal(
      await preview.locator('h1').evaluate((el) => getComputedStyle(el).color),
      'rgb(30, 90, 40)',
    );
    await page.locator('#st-preview-close').click();
    await page.locator('#st-codemirror .cm-content').press('Control+p');
    await page.locator('#st-quick-input').fill('src/main');
    await page.locator('#st-quick-input').press('Enter');
    await page.waitForFunction(
      () => document.getElementById('st-file-name').textContent === 'src/main.js',
    );
    await page.locator('#st-codemirror .cm-content').fill('console.log("rascunho recuperado");\n');
    await page.locator('#st-prompt').fill('Pedido ainda não enviado.');
    let recoveredOnDisk = false;
    for (let attempt = 0; attempt < 30; attempt++) {
      recoveredOnDisk = await page.evaluate(async () => {
        const db = await new Promise((r) => {
          const q = indexedDB.open('firma-desk-recovery', 1);
          q.onsuccess = () => r(q.result);
        });
        const s = await new Promise((r) => {
          const q = db.transaction('desk').objectStore('desk').get('session');
          q.onsuccess = () => r(q.result);
        });
        db.close();
        return !!s?.dirty?.some(([, b]) => b.draft.includes('rascunho recuperado'));
      });
      if (recoveredOnDisk) break;
      await page.waitForTimeout(100);
    }
    assert.equal(recoveredOnDisk, true);
    await page.reload();
    await page.waitForFunction(() => window.FirmaStudio);
    await page.evaluate(() => FirmaStudio.open('admin', 'code'));
    await page.waitForFunction(() =>
      document.getElementById('st-editor-input').value.includes('rascunho recuperado'),
    );
    assert.equal(await page.locator('#st-project').inputValue(), project.id);
    assert.equal(await page.locator('#st-prompt').inputValue(), 'Pedido ainda não enviado.');
    assert.match(
      fs.readFileSync(path.join(project.path, 'src/main.js'), 'utf8'),
      /arquivo original/,
    );
    fs.writeFileSync(path.join(project.path, 'src/main.js'), 'console.log("mudança externa");\n');
    await page.locator('#st-file-list [data-file="src/main.js"]').click();
    await page.locator('#st-draft-message').filter({ hasText: 'mudou fora' }).waitFor();
    await page.locator('#st-auto-label').click();
    await page.locator('#modal [name="autosave"]').check();
    await page.locator('#modal [name="autocheck"]').check();
    await page.locator('#modal-submit').click();
    await page.waitForTimeout(1800);
    assert.match(
      fs.readFileSync(path.join(project.path, 'src/main.js'), 'utf8'),
      /mudança externa/,
    );
    await page.locator('#st-draft-resolve').click();
    assert.match(await page.locator('.line-diff').innerText(), /mudança externa/);
    assert.match(await page.locator('.line-diff').innerText(), /rascunho recuperado/);
    await page.locator('#modal-submit').click();
    await page.locator('#st-save-file').click();
    await page.locator('#st-terminal-output').filter({ hasText: 'concluído' }).waitFor();
    assert.match(
      fs.readFileSync(path.join(project.path, 'src/main.js'), 'utf8'),
      /rascunho recuperado/,
    );
    await page
      .locator('#st-codemirror .cm-content')
      .fill('throw new Error("A verificação não executa este código");\n');
    await page.waitForFunction(
      () => document.getElementById('st-file-state').textContent === 'SALVO NO DISCO',
    );
    await page.waitForFunction(() => FirmaStudio.live.terminal.status === 'completed');
    assert.match(
      fs.readFileSync(path.join(project.path, 'src/main.js'), 'utf8'),
      /throw new Error/,
    );
    await page.locator('#st-find-open').click();
    await page.locator('#st-find-input').fill('Error');
    await page.locator('#st-replace-input').fill('TypeError');
    await page.locator('#st-replace-all').click();
    assert.match(await page.evaluate(() => window.FirmaEditor.value()), /TypeError/);
    await page.locator('#st-find-close').click();
    await page.evaluate(async () => {
      await FirmaAccess.ai('codex.login');
      await FirmaAccess.ai('codex.check');
    });
    await page.locator('#st-role').selectOption('agent:3');
    await page.locator('#st-prompt').fill('Proponha uma melhoria.');
    await page.locator('.ide-send-options summary').click();
    await page.locator('#st-consent').check();
    await page.waitForFunction(() => !document.getElementById('st-send').disabled);
    await page.locator('#st-send').click();
    await page.locator('.st-message-body button').filter({ hasText: 'Revisar no editor' }).click();
    await page.locator('#modal-submit').click();
    await page.locator('#st-draft-message').filter({ hasText: 'Sugestão no rascunho' }).waitFor();
    await page.waitForTimeout(1800);
    assert.ok(
      !fs
        .readFileSync(path.join(project.path, 'src/main.js'), 'utf8')
        .includes('sugestao revisada'),
    );
    await page.locator('#st-draft-undo').click();
    assert.match(await page.evaluate(() => window.FirmaEditor.value()), /TypeError/);
    assert.equal(fake.calls.length, 1);
    await page.locator('#st-command-list').click();
    await page.locator('#st-quick-input').fill('Modo foco');
    await page.locator('#st-quick-input').press('Enter');
    assert.equal(await page.locator('.st-files').isVisible(), false);
    assert.equal(await page.locator('.st-chat').isVisible(), false);
    await page.locator('#st-command-list').click();
    await page.locator('#st-quick-input').fill('Restaurar painéis');
    await page.locator('#st-quick-input').press('Enter');
    assert.equal(await page.locator('.st-files').isVisible(), true);
    fs.mkdirSync('artifacts', { recursive: true });
    await page.screenshot({
      path: path.resolve('artifacts/firma-workbench-enhanced.png'),
      fullPage: true,
    });
    const mobile = await browser.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    mobile.on('pageerror', (e) => errors.push(e.message));
    await mobile.goto(url);
    await mobile.waitForFunction(() => window.FirmaStudio);
    await mobile.evaluate(() => FirmaStudio.openAgent('3'));
    await mobile.locator('#st-command-launch').click();
    await mobile.locator('#st-quick-input').fill('app');
    assert.equal(await mobile.locator('#st-palette').isVisible(), true);
    await mobile.locator('#st-quick-close').click();
    const box = await mobile.locator('#st-send').boundingBox();
    assert.ok(box.y + box.height < 844);
    assert.equal(
      await mobile.evaluate(
        () =>
          document.getElementById('studio').scrollWidth <=
          document.getElementById('studio').clientWidth,
      ),
      true,
    );
    await mobile.screenshot({
      path: path.resolve('artifacts/firma-workbench-enhanced-mobile.png'),
      fullPage: true,
    });
    assert.deepEqual(errors, []);
    console.log(
      'PASS: local preview with assets and sandbox, command palette, outage draft recovery, external-change protection, opted-in autosave and syntax checks, find/replace, AI suggestion review/undo, focus layout and mobile. One mocked AI call.',
    );
  } finally {
    await browser?.close();
    await new Promise((r) => server.close(r));
    if (path.dirname(root) === os.tmpdir() && path.basename(root).startsWith('firma-workbench-qa-'))
      fs.rmSync(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
