'use strict';
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const steps = [
  ['scripts/check.cjs'],
  ['node_modules/typescript/bin/tsc', '--project', 'tsconfig.json'],
  [
    'node_modules/prettier/bin/prettier.cjs',
    '--check',
    '*.js',
    '*.cjs',
    'editor/',
    'scripts/',
    'tests/',
    '*.json',
    '.github/',
  ],
  ['scripts/build.cjs'],
  ['scripts/test.cjs'],
];
for (const args of steps) {
  const result = spawnSync(
    process.execPath,
    args.map((arg, i) => (i === 0 ? path.resolve(arg) : arg)),
    { stdio: 'inherit', windowsHide: true },
  );
  if (result.status !== 0) process.exit(result.status || 1);
}
