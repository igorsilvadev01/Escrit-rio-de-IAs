'use strict';
const assert = require('node:assert/strict');
const app = require('../server.cjs').createFirmaServer();
app.server.listen(0, '127.0.0.1', async () => {
  try {
    const base = 'http://127.0.0.1:' + app.server.address().port;
    for (const route of [
      '/',
      '/readyz',
      '/assets/editor.js',
      '/office-logo.svg',
      '/office-art.js',
      '/seat-motion.js',
      '/public-art/furniture.png',
      '/public-art/chibi-sit.png',
    ])
      assert.equal((await fetch(base + route)).status, 200, route);
    assert.equal((await fetch(base + '/api/studio/status')).status, 401);
    console.log('Imagem pronta: HTTP, saúde, editor e privacidade.');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    app.shutdown();
  }
});
