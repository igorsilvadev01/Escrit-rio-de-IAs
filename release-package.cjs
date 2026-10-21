'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const { atomicJSON } = require('./persistence.cjs');
const digest = (content) => crypto.createHash('sha256').update(content).digest('hex');

function tar(files) {
  const blocks = [];
  for (const file of files) {
    const name = Buffer.from(file.path);
    if (name.length > 100 || file.path.startsWith('/') || file.path.split('/').includes('..'))
      throw Error('Caminho de pacote inválido ou acima de 100 bytes.');
    const body = Buffer.isBuffer(file.content) ? file.content : Buffer.from(file.content),
      header = Buffer.alloc(512);
    name.copy(header);
    const field = (offset, length, value) =>
      header.write(value.toString(8).padStart(length - 1, '0') + '\0', offset, length, 'ascii');
    field(100, 8, 0o644);
    field(108, 8, 0);
    field(116, 8, 0);
    field(124, 12, body.length);
    field(136, 12, 0);
    header.fill(32, 148, 156);
    header[156] = 48;
    header.write('ustar\0', 257, 'ascii');
    header.write('00', 263, 'ascii');
    const checksum = header.reduce((n, b) => n + b, 0);
    header.write(checksum.toString(8).padStart(6, '0') + '\0 ', 148, 'ascii');
    blocks.push(header, body, Buffer.alloc((512 - (body.length % 512)) % 512));
  }
  blocks.push(Buffer.alloc(1024));
  return zlib.gzipSync(Buffer.concat(blocks));
}
function prepareRelease(company, p) {
  if (p.confirm !== true) throw Error('Confirme a preparação do pacote local.');
  const run = company.getRun(p.runId),
    task = company.getState().tasks.find((t) => t.id === run.taskId);
  if (
    run.status !== 'integrated' ||
    run.restoredAt ||
    task?.status !== 'done' ||
    !run.evidence?.length ||
    run.evidence.some((e) => !e.passed)
  )
    throw Error('Aprove uma entrega integrada com verificações antes de preparar a versão.');
  if (
    company.active ||
    company.workstation.child ||
    company.workstation.projects.locks.has(run.projectId)
  )
    throw Error('Aguarde a operação atual.');
  const snapshot = company.snapshot(run.projectId);
  if (
    Object.keys(snapshot).length !== Object.keys(run.files).length ||
    Object.entries(run.files).some(([name, value]) => snapshot[name] !== value)
  )
    throw Error('O projeto mudou após a validação. Valide e aprove uma nova execução.');
  const files = [];
  const source = p.source || 'project';
  if (source === 'dist') {
    if (!run.evidence.some((e) => e.command === 'npm run build' && e.passed))
      throw Error('Execute o build na cópia antes de preparar dist/.');
    const execution = path.resolve(company.dataDir, 'executions', run.id),
      root = path.join(execution, 'dist');
    if (!fs.existsSync(root) || fs.lstatSync(root).isSymbolicLink())
      throw Error('O build não gerou uma pasta dist/ válida.');
    let bytes = 0;
    const walk = (dir, prefix = '') => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const name = prefix + entry.name,
          file = path.join(dir, entry.name),
          stat = fs.lstatSync(file);
        if (stat.isSymbolicLink() || /(?:^|\/)\.|(?:secret|credential|password)/i.test(name))
          throw Error('Arquivo privado ou vinculado no build.');
        if (entry.isDirectory()) {
          walk(file, name + '/');
          continue;
        }
        if (!entry.isFile() || stat.nlink !== 1 || stat.size > 10000000)
          throw Error('Arquivo de build indisponível.');
        const content = fs.readFileSync(file);
        bytes += content.length;
        if (bytes > 50000000 || files.length >= 2000)
          throw Error('Build acima de 50 MB ou 2.000 arquivos.');
        if (
          /\.(?:html|css|js|json|txt|svg|map)$/i.test(name) &&
          company.workstation.clean(content.toString('utf8')) !== content.toString('utf8')
        )
          throw Error('Credencial detectada no build.');
        files.push({ path: name, content });
      }
    };
    walk(root);
  } else if (source === 'project') {
    for (const [name, content] of Object.entries(snapshot))
      if (/\.(?:html|css|js|mjs|svg)$/i.test(name) && !name.startsWith('tests/'))
        files.push({ path: name, content: Buffer.from(content) });
  } else throw Error('Escolha projeto estático ou dist/.');
  if (files.some((f) => f.path === 'firma-release.json'))
    throw Error('O nome firma-release.json é reservado ao manifesto.');
  if (!files.some((f) => f.path === 'index.html'))
    throw Error('O pacote estático precisa de index.html na raiz.');
  const id = crypto.randomUUID(),
    manifest = {
      id,
      status: 'prepared',
      target: 'static',
      projectId: run.projectId,
      runId: run.id,
      commit: run.git?.head || null,
      createdAt: new Date().toISOString(),
      source,
      checks: run.evidence.map((e) => ({ name: e.name, command: e.command, passed: e.passed })),
      files: files.map((f) => ({
        path: f.path,
        bytes: f.content.length,
        sha256: digest(f.content),
      })),
      published: false,
      url: null,
    };
  const archive = tar([
    ...files,
    { path: 'firma-release.json', content: JSON.stringify(manifest, null, 2) },
  ]);
  manifest.archiveSha256 = digest(archive);
  const dir = path.join(company.dataDir, 'releases', id);
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  fs.writeFileSync(path.join(dir, 'site.tar.gz'), archive, { mode: 0o600 });
  atomicJSON(path.join(dir, 'manifest.json'), manifest);
  company.audit(
    run.projectId,
    'release',
    'Pacote estático preparado localmente. Nenhuma publicação executada.',
    { runId: run.id, releaseId: id },
  );
  return { ...manifest, download: '/api/company/release?id=' + id };
}
function readRelease(company, id) {
  if (!/^[a-f0-9-]{36}$/.test(id || '')) throw Error('Pacote inválido.');
  const dir = path.join(company.dataDir, 'releases', id);
  const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
  const archive = fs.readFileSync(path.join(dir, 'site.tar.gz'));
  if (digest(archive) !== manifest.archiveSha256) throw Error('Integridade do pacote inválida.');
  return { manifest, archive };
}
module.exports = { prepareRelease, readRelease, tar };
