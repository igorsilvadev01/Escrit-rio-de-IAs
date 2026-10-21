// @ts-check
'use strict';
const crypto = require('node:crypto');

/**
 * @param {{files: Record<string,string>, contextFiles?: string[], input?: {objective?:string,instructions?:string,acceptanceCriteria?:string}, projectContext?:string, evidence?: {name?:string,passed?:boolean,output?:string}[]}} run
 * @param {{title:string,description?:string,criteria?:string}} task
 * @param {string} previousApproved
 * @returns {{text:string,selected:string[],omitted:number}}
 */
function buildContext(run, task, previousApproved = '') {
  const files = Object.create(null);
  const manifest = Object.entries(run.files).map(([path, content]) => ({
    path,
    characters: content.length,
    sha256: crypto.createHash('sha256').update(content).digest('hex'),
  }));
  const body = {
    objective: run.input?.objective || task.title,
    briefing: run.input?.instructions || task.description || '',
    acceptance: run.input?.acceptanceCriteria || task.criteria || '',
    project: run.projectContext || '',
    previousApproved: previousApproved.slice(0, 4000),
    manifest,
    files,
    previousChecks: (run.evidence || []).map((e) => ({
      name: e.name,
      passed: e.passed,
      output: e.output?.slice(-2000),
    })),
  };
  if (JSON.stringify(body).length > 42000)
    throw Error('Briefing e catálogo acima do limite. Divida a tarefa.');
  const explicit = run.contextFiles?.length ? run.contextFiles : null;
  const words = (body.objective + ' ' + body.briefing)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2);
  const ranked = Object.keys(run.files).sort((a, b) => {
    const score = (/** @type {string} */ name) =>
      (/^(README\.md|package\.json|tsconfig\.json)$/.test(name) ? 10 : 0) +
      words.filter((w) => name.toLowerCase().includes(w)).length * 3;
    return score(b) - score(a) || a.localeCompare(b);
  });
  for (const name of explicit || ranked) {
    if (!Object.hasOwn(run.files, name))
      throw Error('Arquivo de contexto não existe na cópia: ' + name);
    files[name] = run.files[name];
    if (JSON.stringify(body).length > 44000) {
      delete files[name];
      if (explicit) throw Error('Arquivos selecionados excedem o contexto. Reduza a seleção.');
    }
  }
  return {
    text: JSON.stringify(body),
    selected: Object.keys(files),
    omitted: manifest.length - Object.keys(files).length,
  };
}

/** @param {string} original @param {{search:string,replace:string}} patch */
function replaceExactly(original, patch) {
  if (
    !patch ||
    typeof patch.search !== 'string' ||
    !patch.search ||
    typeof patch.replace !== 'string'
  )
    throw Error('Alteração estruturada inválida.');
  const first = original.indexOf(patch.search);
  if (first < 0 || original.indexOf(patch.search, first + 1) >= 0)
    throw Error('O trecho da alteração precisa existir exatamente uma vez.');
  return original.slice(0, first) + patch.replace + original.slice(first + patch.search.length);
}
module.exports = { buildContext, replaceExactly };
