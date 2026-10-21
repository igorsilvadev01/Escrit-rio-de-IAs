const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path');
const { chromium } = require(process.env.FIRMA_PLAYWRIGHT || 'playwright');
const server = require('./browser-server.cjs').office();
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
    assert.equal(await page.evaluate(() => FirmaWorld.rooms.length), 5);
    assert.equal(await page.locator('[data-destination="rest"]').count(), 1);
    assert.equal(await page.locator('[data-destination="admin"]').count(), 1);
    fs.mkdirSync('artifacts', { recursive: true });
    await page.screenshot({
      path: path.resolve('artifacts/firma-village-desktop.png'),
      fullPage: true,
    });
    for (const id of ['planning', 'development', 'testing', 'publishing', 'leadership', 'admin']) {
      await page.evaluate((id) => FirmaGame.goTo(FirmaWorld.stations.find((s) => s.id === id)), id);
      await page.locator('#studio[open]').waitFor({ timeout: 8000 });
      assert.equal(await page.evaluate(() => FirmaStudio.room), id);
      await page.locator('#st-close').click();
    }
    await page.evaluate(() => FirmaGame.goTo(FirmaWorld.playerSeats.admin));
    await page.waitForFunction(() => FirmaGame.seated === 'admin', {}, { timeout: 8000 });
    assert.equal(
      await page.evaluate(() => FirmaWorld.roomAt(FirmaGame.player.x, FirmaGame.player.y).id),
      'leadership',
    );
    await page.evaluate(() => FirmaGame.openStation('admin', 'chat'));
    await page.locator('#studio[open]').waitFor();
    assert.equal(await page.locator('#st-role').inputValue(), 'development');
    await page.screenshot({
      path: path.resolve('artifacts/firma-village-shared-office.png'),
      fullPage: true,
    });
    await page.locator('#st-close').click();
    await page.evaluate(() => FirmaUI.interact({ id: 'leadership' }));
    assert.equal(
      await page
        .locator('.assembly-card,[data-action="assembly-start"],[data-action="meeting-sit"]')
        .count(),
      0,
    );
    await page.locator('#close-modal').click();
    assert.equal(await page.evaluate(() => FirmaWorld.walls.length), 0);
    assert.equal(await page.evaluate(() => FirmaWorld.meetingArea === undefined), true);
    await page.evaluate(async () => {
      const s = FirmaEngine.migrate(FirmaUI.state);
      for (const department of Object.keys(FirmaEngine.departments))
        while (s.agents.filter((a) => a.department === department).length < 6)
          s.agents.push({
            ...s.agents[0],
            id: 'qa-' + s.agents.length,
            name: 'QA ' + s.agents.length,
            department,
            rest: true,
          });
      await FirmaAccess.command('restore', { state: s });
      await FirmaAccess.command('simulation', { paused: true });
      await FirmaUI.sync();
    });
    await page.waitForFunction(
      () =>
        FirmaGame.agentPositions.length === 24 &&
        FirmaGame.agentPositions.every((p) => FirmaWorld.walkable(p.x, p.y)),
      {},
      { timeout: 10000 },
    );
    await page.evaluate(() => FirmaGame.goTo({ x: 240, y: 184, name: 'Open floor' }));
    await page.waitForFunction(() => !FirmaGame.moving, {}, { timeout: 8000 });
    assert.ok(
      await page.evaluate(() => Math.hypot(FirmaGame.player.x - 240, FirmaGame.player.y - 184) < 1),
    );
    const mobile = await browser.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    mobile.on('pageerror', (e) => errors.push(e.message));
    await mobile.goto(url);
    await mobile.waitForFunction(() => window.FirmaStudio);
    assert.equal(
      await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
    );
    await mobile.screenshot({
      path: path.resolve('artifacts/firma-village-mobile.png'),
      fullPage: true,
    });
    await mobile.evaluate(() => FirmaGame.openStation('admin', 'chat'));
    await mobile.locator('#studio[open]').waitFor();
    assert.equal(
      await mobile.evaluate(
        () =>
          document.getElementById('studio').scrollWidth <=
          document.getElementById('studio').clientWidth,
      ),
      true,
    );
    assert.deepEqual(errors, []);
    console.log(
      'PASS: five adjacent rooms, six physical terminals, shared Codex/admin office, removed lounge, no meeting area or walls, 24 accessible workstations, pauses at own desks, themed desktop/mobile and workstation; no browser errors.',
    );
  } finally {
    await browser?.close();
    server.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
