'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { cleanEnvironment } = require('./execution-runner.cjs');

class GitService {
  constructor(projects, dataDir) {
    this.projects = projects;
    this.dataDir = dataDir;
    this.active = new Set();
    this.hooks = path.join(dataDir, 'disabled-hooks');
    fs.mkdirSync(this.hooks, { recursive: true });
  }
  command(dir, args, limit = 100000) {
    return new Promise((resolve, reject) => {
      const env = {
        ...cleanEnvironment(),
        GIT_CONFIG_NOSYSTEM: '1',
        GIT_CONFIG_GLOBAL: process.platform === 'win32' ? 'NUL' : '/dev/null',
        GIT_AUTHOR_NAME: 'Firma',
        GIT_AUTHOR_EMAIL: 'firma@localhost',
        GIT_COMMITTER_NAME: 'Firma',
        GIT_COMMITTER_EMAIL: 'firma@localhost',
      };
      const child = spawn(
        'git',
        [
          '-c',
          'core.hooksPath=' + this.hooks,
          '-c',
          'core.fsmonitor=false',
          '-c',
          'protocol.file.allow=never',
          '-c',
          'core.autocrlf=false',
          ...args,
        ],
        {
          cwd: dir,
          env,
          shell: false,
          windowsHide: true,
          stdio: ['ignore', 'pipe', 'pipe'],
        },
      );
      this.active.add(child);
      let output = '',
        failed = false;
      const timer = setTimeout(() => {
        failed = true;
        child.kill();
        reject(Error('Tempo limite do Git.'));
      }, 60000);
      const append = (chunk) => {
        output += chunk.toString();
        if (output.length > limit) {
          failed = true;
          child.kill();
          reject(Error('Saída Git acima do limite.'));
        }
      };
      child.stdout.on('data', append);
      child.stderr.on('data', append);
      child.once('error', () => {
        this.active.delete(child);
        clearTimeout(timer);
        reject(Error('Git não encontrado. Instale o Git para usar versionamento.'));
      });
      child.once('close', (code) => {
        this.active.delete(child);
        clearTimeout(timer);
        if (failed) return;
        code === 0
          ? resolve(output.trim())
          : reject(Error('Operação Git falhou. Confira o repositório e suas alterações locais.'));
      });
    });
  }
  root(project) {
    if (project === 'firma') throw Error('Use um projeto próprio para versionar tarefas.');
    return this.projects.base(project);
  }
  async ensureSafe(project) {
    const root = this.root(project);
    const metadata = path.join(root, '.git');
    if (
      !fs.existsSync(metadata) ||
      !fs.lstatSync(metadata).isDirectory() ||
      fs.lstatSync(metadata).isSymbolicLink()
    )
      throw Error('Inicialize o Git deste projeto antes de preparar uma branch.');
    const actual = await this.command(root, ['rev-parse', '--show-toplevel']);
    if (fs.realpathSync(actual) !== fs.realpathSync(root))
      throw Error('Repositório fora do projeto.');
    const tracked = await this.command(root, ['ls-files', '-z']);
    for (const file of tracked.split('\0').filter(Boolean)) {
      this.projects.validate(file);
      const read = this.projects.read(file, project);
      if (!read.editable) throw Error('Git contém um arquivo privado ou indisponível: ' + file);
    }
    return root;
  }
  async init(project, confirm) {
    if (confirm !== true) throw Error('Confirme a criação do histórico Git.');
    const root = this.root(project);
    if (fs.existsSync(path.join(root, '.git'))) throw Error('Este projeto já tem Git.');
    await this.command(root, ['init', '--initial-branch=main']);
    fs.writeFileSync(
      path.join(root, '.git', 'info', 'exclude'),
      '\nnode_modules/\ndist/\nartifacts/\ncoverage/\n.env\n.env.*\n!.env.example\n',
    );
    const files = this.projects
      .files(project)
      .filter((f) => this.projects.read(f.path, project).editable)
      .map((f) => f.path);
    for (let n = 0; n < files.length; n += 50)
      await this.command(root, ['add', '--', ...files.slice(n, n + 50)]);
    await this.command(root, ['commit', '--allow-empty', '-m', 'Início do projeto na Firma']);
    return this.status(project);
  }
  async status(project) {
    const root = this.root(project);
    if (!fs.existsSync(path.join(root, '.git'))) return { initialized: false };
    await this.ensureSafe(project);
    return {
      initialized: true,
      head: await this.command(root, ['rev-parse', 'HEAD']),
      branch: await this.command(root, ['branch', '--show-current']),
      changes: await this.command(root, ['status', '--short']),
      history: await this.command(root, ['log', '-8', '--format=%h %s']),
    };
  }
  async prepare(project, runId, dir) {
    if (!/^[a-f0-9-]{36}$/.test(runId)) throw Error('Execução Git inválida.');
    const root = await this.ensureSafe(project);
    if (await this.command(root, ['status', '--porcelain']))
      throw Error('Salve um checkpoint Git antes de criar a branch.');
    if (fs.existsSync(dir)) throw Error('A cópia Git já existe.');
    const base = await this.command(root, ['rev-parse', 'HEAD']);
    const branch = 'firma/task-' + runId;
    fs.mkdirSync(path.dirname(dir), { recursive: true });
    await this.command(root, ['worktree', 'add', '-b', branch, dir, base]);
    return { base, branch, head: base, pointer: fs.readFileSync(path.join(dir, '.git'), 'utf8') };
  }
  async checkpoint(project, confirm) {
    if (confirm !== true) throw Error('Confirme o checkpoint Git.');
    const root = await this.ensureSafe(project);
    const files = this.projects
      .files(project)
      .filter((f) => this.projects.read(f.path, project).editable)
      .map((f) => f.path);
    for (let n = 0; n < files.length; n += 50)
      await this.command(root, ['add', '--', ...files.slice(n, n + 50)]);
    if (await this.command(root, ['diff', '--cached', '--name-only']))
      await this.command(root, ['commit', '-m', 'Checkpoint revisado na Firma']);
    return this.status(project);
  }
  async integrate(run, dir) {
    const root = await this.ensureSafe(run.projectId);
    const metadata = path.join(dir, '.git');
    if (
      !fs.existsSync(metadata) ||
      fs.lstatSync(metadata).isSymbolicLink() ||
      fs.readFileSync(metadata, 'utf8') !== run.git.pointer
    )
      throw Error('A referência Git da cópia foi alterada. Prepare outra execução.');
    if (
      (await this.command(root, ['rev-parse', 'HEAD'])) !== run.git.base ||
      (await this.command(root, ['status', '--porcelain']))
    )
      throw Error('O projeto mudou desde a preparação da branch. Prepare outra execução.');
    const changed = Object.keys(run.files).filter((file) => run.files[file] !== run.base[file]);
    for (let n = 0; n < changed.length; n += 50)
      await this.command(dir, ['add', '--', ...changed.slice(n, n + 50)]);
    await this.command(dir, ['commit', '--allow-empty', '-m', 'Entrega da tarefa ' + run.taskId]);
    const head = await this.command(dir, ['rev-parse', 'HEAD']);
    // Only a fast-forward of the exact validated task branch is allowed.
    await this.command(root, ['merge', '--ff-only', head]);
    run.git.head = head;
    return head;
  }
  async exclusive(project, work) {
    if (this.projects.locks.has(project)) throw Error('Aguarde a operação Git deste projeto.');
    this.projects.locks.add(project);
    try {
      return await work();
    } finally {
      this.projects.locks.delete(project);
    }
  }
  async importRepository(input, confirm) {
    if (confirm !== true) throw Error('Confirme a importação do repositório público.');
    const url = new URL(input);
    if (
      url.protocol !== 'https:' ||
      url.hostname !== 'github.com' ||
      url.port ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      !/^\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+(?:\.git)?$/.test(url.pathname)
    )
      throw Error('Use a URL HTTPS de um repositório público do GitHub, sem credenciais.');
    const temporary = fs.mkdtempSync(path.join(this.dataDir, 'import-'));
    const checkout = path.join(temporary, 'repository');
    try {
      await this.command(temporary, [
        'clone',
        '--depth=1',
        '--no-recurse-submodules',
        '--',
        url.href,
        checkout,
      ]);
      const files = [];
      let bytes = 0;
      const walk = (dir, prefix = '', depth = 0) => {
        if (depth > 5) return;
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const name = prefix + entry.name;
          if (entry.isSymbolicLink() || ['.git', 'node_modules'].includes(entry.name)) continue;
          if (entry.isDirectory()) {
            walk(path.join(dir, entry.name), name + '/', depth + 1);
            continue;
          }
          try {
            this.projects.validate(name);
          } catch {
            continue;
          }
          const file = path.join(dir, entry.name),
            stat = fs.statSync(file);
          if (!stat.isFile() || stat.nlink !== 1 || stat.size > 300000) continue;
          const content = fs.readFileSync(file, 'utf8');
          if (content.includes('\0') || this.projects.clean(content) !== content) continue;
          bytes += Buffer.byteLength(content);
          if (bytes > 12000000 || files.length >= 600)
            throw Error('Repositório acima do limite de 600 arquivos ou 12 MB.');
          files.push({ path: name, text: content });
        }
      };
      walk(checkout);
      if (!files.length) throw Error('Nenhum arquivo de código permitido encontrado.');
      const name = url.pathname
        .split('/')
        .at(-1)
        .replace(/\.git$/, '');
      const { project } = this.projects.create({
        name,
        description: 'Importado de ' + url.href,
        empty: true,
      });
      for (const file of files)
        this.projects.write({ project: project.id, ...file, hash: '', confirm: true });
      await this.init(project.id, true);
      return { project, files: files.length, source: url.href };
    } finally {
      // The target is created by mkdtemp under our own private import directory.
      if (
        path.dirname(path.resolve(temporary)) === path.resolve(this.dataDir) &&
        path.basename(temporary).startsWith('import-')
      )
        fs.rmSync(temporary, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
    }
  }
  close() {
    for (const child of this.active) child.kill();
  }
}
module.exports = { GitService };
