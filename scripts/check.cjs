'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (
      entry.isSymbolicLink() ||
      entry.name.startsWith('.') ||
      ['node_modules', 'projects', 'artifacts', 'assets', 'coverage'].includes(entry.name)
    )
      continue;
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (/\.(?:js|cjs)$/.test(file)) files.push(file);
  }
}
walk('.');
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], {
    stdio: 'inherit',
    windowsHide: true,
  });
  if (result.status !== 0) process.exit(result.status || 1);
}
console.log(`Sintaxe válida: ${files.length} arquivos.`);
