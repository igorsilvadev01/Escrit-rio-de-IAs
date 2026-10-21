'use strict';
const { build } = require('esbuild');
const fs = require('node:fs');
const path = require('node:path');
build({
  entryPoints: ['editor/editor.js'],
  bundle: true,
  outfile: 'assets/editor.js',
  minify: true,
  format: 'iife',
  target: ['es2022'],
  legalComments: 'eof',
  charset: 'utf8',
  metafile: true,
})
  .then((result) => {
    const notices = new Map();
    for (const input of Object.keys(result.metafile.inputs)) {
      if (!input.startsWith('node_modules/')) continue;
      let dir = path.dirname(path.resolve(input));
      while (!fs.existsSync(path.join(dir, 'package.json')) && dir !== path.dirname(dir))
        dir = path.dirname(dir);
      const metadata = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
      const id = metadata.name + '@' + metadata.version;
      if (notices.has(id)) continue;
      const license = ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'license']
        .map((name) => path.join(dir, name))
        .find((file) => fs.existsSync(file));
      notices.set(
        id,
        id + '\n' + (license ? fs.readFileSync(license, 'utf8') : 'License: ' + metadata.license),
      );
    }
    fs.writeFileSync(
      'assets/editor.LICENSE.txt',
      [...notices]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([, value]) => value)
        .join('\n\n---\n\n') + '\n',
    );
  })
  .catch(() => {
    process.exitCode = 1;
  });
