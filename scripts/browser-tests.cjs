'use strict';
const fs = require('node:fs');
const { spawnSync } = require('node:child_process');
const { chromium } = require('playwright');
const names = process.argv.slice(2).length
  ? process.argv.slice(2)
  : [
      'auth',
      'rooms',
      'ai',
      'admin',
      'desk',
      'management',
      'workbench',
      'company',
      'scene',
      'village',
      'office-life',
      'in-game',
      'production',
    ];
const env = { ...process.env };
if (
  !env.FIRMA_BROWSER &&
  !fs.existsSync(chromium.executablePath()) &&
  process.platform === 'win32'
) {
  env.FIRMA_BROWSER = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  ].find((file) => fs.existsSync(file));
}
for (const name of names) {
  if (!/^[a-z-]+$/.test(name)) throw Error('Jornada inválida.');
  console.log(`Navegador: ${name}`);
  const result = spawnSync(process.execPath, ['tests/browser-' + name + '.cjs'], {
    env,
    stdio: 'inherit',
    windowsHide: true,
  });
  if (result.status !== 0) process.exit(result.status || 1);
}
