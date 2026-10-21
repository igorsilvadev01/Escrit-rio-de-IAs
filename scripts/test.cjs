'use strict';
const fs = require('node:fs');
const { spawnSync } = require('node:child_process');
const files = fs
  .readdirSync('tests')
  .filter((name) => name.endsWith('.test.cjs'))
  .sort()
  .map((name) => 'tests/' + name);
const result = spawnSync(process.execPath, ['--test', ...files], {
  stdio: 'inherit',
  windowsHide: true,
});
process.exitCode = result.status ?? 1;
