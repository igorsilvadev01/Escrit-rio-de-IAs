// @ts-check
'use strict';

/** @typedef {'syntax'|'node-test'|'node-script'|'npm-ci'|'npm-script'} CheckKind */
/** @typedef {{id?: string, kind: CheckKind, file?: string, name?: string}} ProjectCheck */

const scripts = new Set(['test', 'build', 'lint', 'typecheck']);

/**
 * Validate at every boundary, including backup restore and worker admission.
 * @param {unknown} input
 * @param {(name: string) => void} validatePath
 * @returns {ProjectCheck}
 */
function validateCheck(input, validatePath) {
  if (!input || typeof input !== 'object') throw Error('Verificação inválida.');
  const check = /** @type {Record<string, unknown>} */ (input);
  const kind = check.kind;
  if (!['syntax', 'node-test', 'node-script', 'npm-ci', 'npm-script'].includes(String(kind)))
    throw Error('Tipo de verificação inválido.');
  const file = typeof check.file === 'string' ? check.file : '';
  if (kind === 'node-test' || kind === 'node-script') {
    validatePath(file);
    if (!/\.(?:js|cjs|mjs)$/.test(file)) throw Error('Selecione um arquivo JavaScript.');
  }
  if (kind === 'npm-script' && !scripts.has(file))
    throw Error('Use um script test, build, lint ou typecheck.');
  if (check.name !== undefined && (typeof check.name !== 'string' || check.name.length > 80))
    throw Error('Nome de verificação inválido.');
  return {
    kind: /** @type {CheckKind} */ (kind),
    file,
    name: String(check.name || (kind === 'npm-script' ? 'npm run ' + file : kind)),
  };
}
module.exports = { validateCheck };
