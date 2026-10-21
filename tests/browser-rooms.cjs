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
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(url);
    await page.locator('#modal[open]').waitFor();
    await page.locator('#modal-submit').click();
    await page.waitForFunction(() => window.FirmaStudio && !document.getElementById('modal').open);
    assert.equal(await page.evaluate(() => FirmaWorld.rooms.length), 5);
    const initial = await page.evaluate(() => ({ x: FirmaGame.player.x, y: FirmaGame.player.y }));
    for (const id of ['planning', 'development', 'testing', 'publishing', 'leadership', 'admin']) {
      await page.evaluate((id) => FirmaGame.openStation(id), id);
      await page.locator('#studio[open]').waitFor();
      assert.equal(await page.evaluate(() => FirmaStudio.room), id);
      assert.deepEqual(
        await page.evaluate(() => ({ x: FirmaGame.player.x, y: FirmaGame.player.y })),
        initial,
      );
      await page.locator('#st-room-tools').click();
      await page.locator('#modal[open]').waitFor();
      assert.match(await page.locator('#modal-title').innerText(), /Gestão/);
      await page.locator('#close-modal').click();
    }
    assert.equal(fake.calls.length, 0);
    await page.locator('#office-canvas').focus();
    await page.keyboard.down('d');
    await page.waitForTimeout(300);
    await page.keyboard.up('d');
    assert.ok(await page.evaluate((x) => FirmaGame.player.x > x + 15, initial.x));
    fs.mkdirSync('artifacts', { recursive: true });
    await page.screenshot({
      path: path.resolve('artifacts/firma-navigation-desktop.png'),
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
    await mobile.evaluate(() => FirmaGame.openStation('admin'));
    await mobile.locator('#studio[open]').waitFor();
    assert.equal(
      await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
    );
    await mobile.screenshot({
      path: path.resolve('artifacts/firma-navigation-mobile.png'),
      fullPage: true,
    });
    assert.deepEqual(errors, []);
    console.log(
      'PASS: six station shortcuts, management access, unchanged position, keyboard walking, mobile navigation and zero provider calls.',
    );
  } finally {
    await browser?.close();
    server.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
