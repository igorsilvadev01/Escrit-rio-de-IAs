'use strict';
const { isIP } = require('node:net');
class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
function requestOrigin(req, configuredOrigin) {
  const host = req.headers.host;
  if (!host) throw new ApiError(400, 'Host ausente.');
  if (configuredOrigin) {
    if (host !== new URL(configuredOrigin).host) throw new ApiError(403, 'Host não permitido.');
    return configuredOrigin;
  }
  if (!/^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(host))
    throw new ApiError(403, 'Configure FIRMA_PUBLIC_ORIGIN para usar este domínio.');
  return 'http://' + host;
}
function validateMutation(req, expected) {
  if (req.headers.origin !== expected || req.headers['sec-fetch-site'] === 'cross-site')
    throw new ApiError(403, 'Origem não permitida.');
  if (
    String(req.headers['content-type'] || '')
      .split(';')[0]
      .trim()
      .toLowerCase() !== 'application/json'
  )
    throw new ApiError(415, 'Envie dados JSON.');
}
async function readJSON(req, maxBytes = 3000000) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBytes) throw new ApiError(413, `Envie até ${maxBytes / 1000000} MB.`);
    chunks.push(chunk);
  }
  try {
    const value = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error();
    return value;
  } catch {
    throw new ApiError(400, 'JSON inválido.');
  }
}
function clientAddress(req, trustedProxy) {
  const socketAddress = req.socket.remoteAddress || 'unknown';
  const forwarded = String(req.headers['x-forwarded-for'] || '')
    .split(',')
    .at(-1)
    .trim();
  return trustedProxy &&
    (socketAddress === trustedProxy || socketAddress === '::ffff:' + trustedProxy) &&
    isIP(forwarded)
    ? forwarded
    : socketAddress;
}
module.exports = { ApiError, requestOrigin, validateMutation, readJSON, clientAddress };
