'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

// A completed rename never exposes a partially written JSON document.
function atomicWrite(file, value, mode = 0o600) {
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  const temporary = file + '.' + crypto.randomUUID() + '.tmp';
  let descriptor;
  try {
    descriptor = fs.openSync(temporary, 'wx', mode);
    fs.writeFileSync(descriptor, value);
    fs.fsyncSync(descriptor);
    fs.closeSync(descriptor);
    descriptor = undefined;
    fs.renameSync(temporary, file);
  } finally {
    if (descriptor !== undefined) fs.closeSync(descriptor);
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
  }
}
function atomicJSON(file, value) {
  atomicWrite(file, JSON.stringify(value, null, 2));
}
module.exports = { atomicJSON, atomicWrite };
