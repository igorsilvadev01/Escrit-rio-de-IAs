'use strict';
const crypto = require('node:crypto');
const { promisify } = require('node:util');
const scrypt = promisify(crypto.scrypt);
const parameters = { N: 65536, r: 8, p: 1, maxmem: 128 * 1024 * 1024 };
function equal(a, b) {
  const left = Buffer.from(String(a)),
    right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}
async function createCredentials(username, password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = await scrypt(password, salt, 64, parameters);
  return { username, salt, hash: derived.toString('hex') };
}
async function verifyCredentials(record, username, password) {
  const salt = record?.salt || '00000000000000000000000000000000';
  const derived = await scrypt(password, salt, 64, parameters);
  return (
    !!record && equal(username, record.username) && equal(derived.toString('hex'), record.hash)
  );
}
module.exports = { equal, createCredentials, verifyCredentials };
