'use strict';
const path = require('node:path');
const fs = require('node:fs');
const { fork, spawn } = require('node:child_process');

function cleanEnvironment(source = process.env) {
  const env = {};
  for (const key of [
    'PATH',
    'Path',
    'SYSTEMROOT',
    'SystemRoot',
    'WINDIR',
    'TEMP',
    'TMP',
    'PATHEXT',
  ])
    if (source[key]) env[key] = source[key];
  env.NO_COLOR = '1';
  env.GIT_TERMINAL_PROMPT = '0';
  return env;
}

class ExecutionRunner {
  constructor(options = {}) {
    this.mode = options.mode || process.env.FIRMA_EXECUTOR || 'local';
    if (!['local', 'docker'].includes(this.mode))
      throw Error('FIRMA_EXECUTOR deve ser local ou docker.');
    this.image = options.image || process.env.FIRMA_RUNNER_IMAGE || 'node:22-bookworm-slim';
    if (!/^[a-zA-Z0-9][a-zA-Z0-9./_:@-]{0,220}$/.test(this.image)) throw Error('Imagem inválida.');
    this.installNetwork = options.installNetwork || process.env.FIRMA_INSTALL_NETWORK || 'bridge';
    this.user =
      options.user ||
      process.env.FIRMA_RUNNER_USER ||
      `${process.getuid?.() || 1000}:${process.getgid?.() || 1000}`;
    if (!/^\d{1,10}:\d{1,10}$/.test(this.user))
      throw Error('Usuário do executor inválido. Use UID:GID.');
    if (!/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,80}$/.test(this.installNetwork))
      throw Error('Rede inválida.');
    this.active = new Set();
    this.closed = false;
  }
  status() {
    return {
      mode: this.mode,
      image: this.mode === 'docker' ? this.image : null,
      isolated: this.mode === 'docker',
      active: this.active.size,
    };
  }
  async probe() {
    if (this.mode !== 'docker') return true;
    return new Promise((resolve) => {
      const child = spawn('docker', ['image', 'inspect', this.image], {
        env: this.environment(),
        windowsHide: true,
        shell: false,
        stdio: 'ignore',
      });
      const timer = setTimeout(() => {
        child.kill();
        resolve(false);
      }, 5000);
      child.once('error', () => {
        clearTimeout(timer);
        resolve(false);
      });
      child.once('close', (code) => {
        clearTimeout(timer);
        resolve(code === 0);
      });
    });
  }
  run({ dir, args, kind = 'node', signal, timeout = 90000 }) {
    if (this.closed) return Promise.reject(Error('Executor encerrado.'));
    if (signal?.aborted) return Promise.reject(Error('Execução cancelada.'));
    const real = fs.realpathSync(dir);
    if (this.mode === 'docker' && /[,\r\n]/.test(real))
      throw Error('A pasta do executor não pode conter vírgulas ou quebras de linha.');
    if (fs.lstatSync(dir).isSymbolicLink()) throw Error('Cópia vinculada não permitida.');
    if (kind !== 'node' && this.mode !== 'docker')
      return Promise.reject(Error('Dependências e scripts npm exigem o executor Docker.'));
    return new Promise((resolve) => {
      const worker = fork(path.join(__dirname, 'execution-worker.cjs'), [], {
        env: this.environment(),
        execArgv: [],
        windowsHide: true,
        stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
        serialization: 'json',
      });
      this.active.add(worker);
      let finished = false;
      const finish = (result) => {
        if (finished) return;
        finished = true;
        clearTimeout(deadline);
        signal?.removeEventListener('abort', cancel);
        this.active.delete(worker);
        if (worker.connected) worker.disconnect();
        resolve({
          passed: false,
          output: 'Executor interrompido.',
          time: new Date().toISOString(),
          ...result,
        });
      };
      const cancel = () => {
        if (worker.connected) worker.send({ type: 'cancel' });
      };
      const deadline = setTimeout(() => {
        cancel();
        setTimeout(() => worker.kill(), 4000).unref();
      }, timeout + 3000);
      worker.on('message', (result) => {
        if (result?.type === 'result') finish(result.result);
      });
      worker.once('error', () => finish({ output: 'Não foi possível iniciar o worker.' }));
      worker.once('exit', () =>
        finish({ output: signal?.aborted ? 'Execução cancelada.' : 'Worker interrompido.' }),
      );
      signal?.addEventListener('abort', cancel, { once: true });
      worker.send({
        type: 'run',
        dir: real,
        args,
        kind,
        timeout,
        mode: this.mode,
        image: this.image,
        installNetwork: this.installNetwork,
        user: this.user,
      });
      if (signal?.aborted) cancel();
    });
  }
  environment() {
    const env = cleanEnvironment();
    // This endpoint is administrator configuration and is never passed into the workload.
    if (process.env.DOCKER_HOST) env.DOCKER_HOST = process.env.DOCKER_HOST;
    return env;
  }
  close() {
    this.closed = true;
    for (const worker of this.active) if (worker.connected) worker.send({ type: 'cancel' });
  }
}
module.exports = { ExecutionRunner, cleanEnvironment };
