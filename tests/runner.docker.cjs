'use strict';
const test = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path');
const { fixture } = require('./helpers/firma.cjs');

test('Docker installs locked dependencies, runs project tests/build and blocks network and private files', async () => {
  const f = await fixture({ executor: { mode: 'docker' } });
  try {
    assert.equal(
      await f.app.runner.probe(),
      true,
      'Prepare o Docker e execute docker pull node:22-bookworm-slim.',
    );
    const p = f.project();
    const files = {
      'package.json': JSON.stringify({
        name: 'runner-test',
        version: '1.0.0',
        scripts: { test: 'node --test tests/app.test.cjs', build: 'node build.cjs' },
      }),
      'package-lock.json': JSON.stringify({
        name: 'runner-test',
        version: '1.0.0',
        lockfileVersion: 3,
        requires: true,
        packages: { '': { name: 'runner-test', version: '1.0.0' } },
      }),
      'tests/app.test.cjs':
        'const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs");test("private filesystem and environment",()=>{assert.equal(process.env.GEMINI_API_KEY,undefined);assert.equal(fs.existsSync("/host-private/admin.json"),false);assert.throws(()=>fs.writeFileSync("/etc/firma","bad"));});test("network denied",async()=>{await assert.rejects(fetch("https://example.com",{signal:AbortSignal.timeout(2000)}));});',
      'build.cjs':
        'const fs=require("node:fs");fs.mkdirSync("dist",{recursive:true});fs.writeFileSync("dist/index.html","<h1>Build validado</h1>");',
    };
    for (const [file, text] of Object.entries(files))
      f.app.workstation.projects.write({
        project: p.id,
        path: file,
        text,
        hash: '',
        confirm: true,
      });
    f.app.company.checks({
      projectId: p.id,
      checks: [
        { kind: 'npm-ci' },
        { kind: 'npm-script', file: 'test' },
        { kind: 'npm-script', file: 'build' },
      ],
    });
    const run = await f.run(p.id);
    assert.equal(run.status, 'review', JSON.stringify(run.evidence));
    assert.ok(run.evidence.length === 3 && run.evidence.every((e) => e.passed));
    assert.equal(fs.existsSync(path.join(p.path, 'dist')), false);
  } finally {
    await f.close();
  }
});
