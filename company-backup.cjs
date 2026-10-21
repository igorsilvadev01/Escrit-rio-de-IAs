'use strict';
const fs = require('node:fs'),
  path = require('node:path'),
  crypto = require('node:crypto'),
  E = require('./engine.js');
const { validateCheck } = require('./project-checks.cjs');
const digest = (value) => crypto.createHash('sha256').update(value).digest('hex'),
  clone = (value) => JSON.parse(JSON.stringify(value));
function exportCompany(company) {
  if (company.workstation.projects.locks.size)
    throw Error('Aguarde a operação Git antes de exportar.');
  const work = company.workstation,
    omitted = [],
    projects = work.projects.list().map((project) => ({
      id: project.id,
      name: project.name,
      description: project.description,
      files: work
        .files(project.id)
        .map((f) => {
          const read = work.read(f.path, project.id);
          if (!read.editable) {
            omitted.push(project.id + '/' + f.path);
            return null;
          }
          return { path: f.path, text: read.text, sha256: digest(read.text) };
        })
        .filter(Boolean),
    }));
  const payload = JSON.parse(
    work.clean(
      JSON.stringify({
        office: company.getState(),
        projects,
        chats: work.chats,
        prompts: work.projects.data.prompts,
        company: company.data,
      }),
    ),
  );
  const data = JSON.stringify(payload);
  if (Buffer.byteLength(data) > 25_000_000)
    throw Error('Pacote acima de 25 MB. Exporte projetos menores separadamente.');
  return {
    format: 'firma-complete',
    version: 1,
    createdAt: new Date().toISOString(),
    omitted,
    payload,
    sha256: digest(data),
  };
}
function inspectCompany(company, backup) {
  if (
    backup?.format !== 'firma-complete' ||
    backup.version !== 1 ||
    !backup.payload ||
    digest(JSON.stringify(backup.payload)) !== backup.sha256
  )
    throw Error('Pacote inválido ou integridade incorreta.');
  const p = backup.payload;
  E.migrate(p.office);
  if (
    !Array.isArray(p.projects) ||
    !p.projects.length ||
    p.projects.length > 41 ||
    new Set(p.projects.map((x) => x.id)).size !== p.projects.length
  )
    throw Error('Lista de projetos inválida.');
  const ids = new Set(p.projects.map((x) => x.id));
  let bytes = 0,
    count = 0;
  for (const project of p.projects) {
    if (
      typeof project.id !== 'string' ||
      !/^[a-z0-9-]{1,80}$/.test(project.id) ||
      typeof project.name !== 'string' ||
      !Array.isArray(project.files) ||
      project.files.length > 600
    )
      throw Error('Projeto inválido no pacote.');
    const paths = new Set();
    for (const file of project.files) {
      company.workstation.projects.validate(file.path);
      if (
        paths.has(file.path) ||
        typeof file.text !== 'string' ||
        Buffer.byteLength(file.text) > 300000 ||
        digest(file.text) !== file.sha256
      )
        throw Error('Arquivo inválido ou alterado no pacote.');
      paths.add(file.path);
      bytes += Buffer.byteLength(file.text);
      count++;
    }
  }
  if (bytes > 25_000_000) throw Error('Pacote acima de 25 MB.');
  if (
    !p.company ||
    !Array.isArray(p.company.runs) ||
    !Array.isArray(p.company.plans) ||
    !p.company.projects
  )
    throw Error('Metadados ausentes.');
  for (const [projectId, meta] of Object.entries(p.company.projects)) {
    if (!ids.has(projectId)) continue;
    if (
      !Array.isArray(meta.memory) ||
      meta.memory.length > 150 ||
      !Array.isArray(meta.checks) ||
      meta.checks.length > 12 ||
      !meta.limits ||
      !Number.isInteger(meta.limits.calls) ||
      meta.limits.calls < 1 ||
      meta.limits.calls > 100 ||
      !Number.isInteger(meta.limits.rounds) ||
      meta.limits.rounds < 1 ||
      meta.limits.rounds > 5 ||
      !Number.isInteger(meta.limits.seconds) ||
      meta.limits.seconds < 15 ||
      meta.limits.seconds > 600
    )
      throw Error('Configuração inválida no pacote.');
    for (const check of meta.checks) {
      validateCheck(check, (name) => company.workstation.projects.validate(name));
    }
  }
  if (
    p.company.runs.length > 120 ||
    p.company.plans.length > 500 ||
    !Array.isArray(p.company.events) ||
    p.company.events.length > 1500
  )
    throw Error('Histórico acima do limite.');
  const validLimits = (l) =>
    l &&
    Number.isInteger(l.calls) &&
    l.calls >= 1 &&
    l.calls <= 100 &&
    Number.isInteger(l.rounds) &&
    l.rounds >= 1 &&
    l.rounds <= 5 &&
    Number.isInteger(l.seconds) &&
    l.seconds >= 15 &&
    l.seconds <= 600;
  for (const plan of p.company.plans) {
    if (
      !ids.has(plan.projectId) ||
      !Array.isArray(plan.steps) ||
      plan.steps.length < 1 ||
      plan.steps.length > 20
    )
      throw Error('Plano inválido no pacote.');
    const seen = new Set();
    for (const step of plan.steps) {
      const agent = p.office.agents.find((a) => a.id === step.agent);
      if (
        !agent ||
        !E.templates[step.template] ||
        agent.department !== E.templates[step.template].department ||
        typeof step.id !== 'string' ||
        seen.has(step.id) ||
        (step.dependsOn && !seen.has(step.dependsOn))
      )
        throw Error('Etapa inválida no pacote.');
      seen.add(step.id);
    }
  }
  for (const run of p.company.runs) {
    if (
      !/^[a-f0-9-]{36}$/.test(run.id) ||
      !ids.has(run.projectId) ||
      !['manual', 'assisted', 'delegated'].includes(run.mode) ||
      !validLimits(run.limits) ||
      !Number.isInteger(run.calls) ||
      run.calls < 0 ||
      run.calls > 5 ||
      !run.files ||
      !run.base ||
      !Array.isArray(run.checkpoints) ||
      run.checkpoints.length > 5 ||
      !Array.isArray(run.evidence)
    )
      throw Error('Execução inválida no pacote.');
    for (const files of [
      run.files,
      run.base,
      ...run.checkpoints.map((c) => c.files),
      run.integrationCheckpoint?.files,
    ].filter(Boolean)) {
      if (typeof files !== 'object' || Array.isArray(files) || Object.keys(files).length > 600)
        throw Error('Checkpoint inválido.');
      for (const [name, value] of Object.entries(files)) {
        company.workstation.projects.validate(name);
        if (typeof value !== 'string' || Buffer.byteLength(value) > 300000)
          throw Error('Checkpoint inválido.');
      }
    }
  }
  if (typeof p.chats !== 'object' || !Array.isArray(p.prompts) || p.prompts.length > 60)
    throw Error('Conversas ou prompts inválidos.');
  return {
    projects: p.projects.map((x) => ({ name: x.name, files: x.files.length })),
    tasks: p.office.tasks.length,
    agents: p.office.agents.length,
    files: count,
    bytes,
    omitted: backup.omitted || [],
    credentialsIncluded: false,
  };
}
function restoreCompany(company, backup, confirm) {
  if (confirm !== true) throw Error('Confirme a restauração após conferir o resumo.');
  inspectCompany(company, backup);
  const work = company.workstation;
  if (
    company.active ||
    company.ai.active ||
    company.ai.activeChat ||
    company.ai.armed.size ||
    work.child ||
    work.projects.locks.size
  )
    throw Error('Conclua ou cancele as execuções antes de restaurar.');
  if (work.projects.data.projects.length + backup.payload.projects.length > 40)
    throw Error('Não há espaço para importar as cópias: o limite é de 40 projetos.');
  const safety = exportCompany(company),
    safetyFile = path.join(
      company.dataDir,
      'backups',
      'complete-before-restore-' + crypto.randomUUID() + '.json',
    );
  fs.mkdirSync(path.dirname(safetyFile), { recursive: true });
  fs.writeFileSync(safetyFile, JSON.stringify(safety), { mode: 0o600 });
  const previous = {
      office: clone(company.getState()),
      company: clone(company.data),
      projects: clone(work.projects.data),
      chats: clone(work.chats),
    },
    p = clone(backup.payload),
    map = {};
  try {
    for (const source of p.projects) {
      const created = work.projects.create({
        name: source.name + ' · restaurado',
        description: source.description || '',
      }).project;
      map[source.id] = created.id;
      for (const file of source.files) {
        let original;
        try {
          original = work.read(file.path, created.id);
        } catch {}
        work.projects.write({
          project: created.id,
          path: file.path,
          text: file.text,
          hash: original?.hash || '',
          confirm: true,
        });
      }
    }
    const restored = E.migrate(p.office);
    for (const task of restored.tasks) task.projectId = map[task.projectId || 'firma'] || 'firma';
    const newMeta = {};
    for (const [key, value] of Object.entries(p.company.projects))
      if (map[key]) newMeta[map[key]] = value;
    for (const [key, value] of Object.entries(company.data.projects))
      if (!newMeta[key]) newMeta[key] = value;
    company.data = {
      ...p.company,
      projects: newMeta,
      plans: p.company.plans.map((plan) => ({
        ...plan,
        projectId: map[plan.projectId] || 'firma',
      })),
      runs: p.company.runs.map((run) => ({
        ...run,
        projectId: map[run.projectId],
        git: null,
        restoredAt: new Date().toISOString(),
        status: ['integrated', 'review', 'validation_failed'].includes(run.status)
          ? run.status
          : 'interrupted',
        error: run.status === 'generating' ? 'Restauração: chamada não repetida.' : run.error,
      })),
      events: (p.company.events || []).map((e) => ({
        ...e,
        projectId: map[e.projectId] || 'firma',
      })),
    };
    work.chats = {};
    for (const [key, messages] of Object.entries(p.chats)) {
      const match = key.match(/^project:([^:]+):(.+)$/),
        project = match ? match[1] : 'firma',
        conversation = match ? match[2] : key;
      if (!map[project] || !Array.isArray(messages)) continue;
      work.chats['project:' + map[project] + ':' + conversation] = messages
        .slice(-24)
        .filter((m) => ['user', 'assistant'].includes(m.role) && typeof m.text === 'string')
        .map((m) => ({ ...m, status: m.status === 'running' ? 'interrupted' : m.status }));
    }
    for (const role of ['leadership', 'planning', 'development', 'testing', 'publishing'])
      work.chats[role] ??= [];
    for (const task of restored.tasks)
      if (task.workRunId)
        task.workStatus =
          company.data.runs.find((r) => r.id === task.workRunId)?.status || 'interrupted';
    work.projects.data.prompts = p.prompts;
    work.projects.save();
    work.save();
    company.restoreState(restored);
    company.ai.holdAll();
    company.save();
    company.audit('firma', 'restore', 'Pacote completo restaurado em cópias de projeto.');
    return { projectMap: map, safetyBackup: path.basename(safetyFile) };
  } catch (error) {
    work.projects.data = previous.projects;
    work.projects.save();
    work.chats = previous.chats;
    work.save();
    company.data = previous.company;
    company.restoreState(previous.office);
    company.save();
    throw Error('Restauração revertida. Os dados anteriores foram preservados. ' + error.message);
  }
}
module.exports = { exportCompany, inspectCompany, restoreCompany };
