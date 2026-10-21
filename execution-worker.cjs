'use strict';
const { spawn } = require('node:child_process');
const crypto = require('node:crypto');
const path = require('node:path');
const fs = require('node:fs');
let child,
  timer,
  container,
  done = false,
  output = '',
  cancelled = false,
  cancelMessage = '';

function finish(passed, message = '') {
  if (done) return;
  done = true;
  clearTimeout(timer);
  if (process.connected)
    process.send(
      {
        type: 'result',
        result: {
          passed: passed && !cancelled,
          output: (output + '\n' + message).slice(-50000),
          time: new Date().toISOString(),
        },
      },
      () => process.disconnect(),
    );
}
function cancel(message = 'Execução cancelada.') {
  if (done || cancelled) return;
  cancelled = true;
  cancelMessage = message;
  if (container) {
    const killer = spawn('docker', ['rm', '-f', container], {
      shell: false,
      windowsHide: true,
      stdio: 'ignore',
    });
    const cleanupDeadline = setTimeout(() => {
      killer.kill();
      finish(
        false,
        message +
          ' Não foi possível confirmar a remoção do contêiner. Confira o Docker antes de retomar.',
      );
    }, 4000);
    const cleaned = (code) => {
      clearTimeout(cleanupDeadline);
      finish(
        false,
        code === 0 ? message : message + ' Confira o encerramento do contêiner no Docker.',
      );
    };
    killer.once('error', () => cleaned(1));
    killer.once('close', cleaned);
  }
  if (child?.pid) {
    if (process.platform === 'win32') {
      const killer = spawn(
        path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'taskkill.exe'),
        ['/PID', String(child.pid), '/T', '/F'],
        { shell: false, windowsHide: true, stdio: 'ignore' },
      );
      killer.on('error', () => child.kill());
    } else {
      try {
        process.kill(-child.pid, 'SIGKILL');
      } catch {
        child.kill('SIGKILL');
      }
    }
  }
  if (!child?.pid && !container) finish(false, message);
}
function command(job) {
  if (!Array.isArray(job.args) || job.args.some((a) => typeof a !== 'string' || a.includes('\0')))
    throw Error('Argumentos inválidos.');
  if (job.kind === 'npm-ci') return ['npm', 'ci', '--ignore-scripts', '--no-audit', '--no-fund'];
  if (job.kind === 'npm-script') {
    if (!['test', 'build', 'lint', 'typecheck'].includes(job.args[0]))
      throw Error('Script não permitido.');
    return ['npm', 'run', job.args[0]];
  }
  if (job.kind !== 'node') throw Error('Operação não permitida.');
  return ['node', ...job.args];
}
function dockerArguments(job) {
  const cmd = command(job);
  container = 'firma-run-' + crypto.randomUUID();
  return [
    'run',
    '--rm',
    '--pull=never',
    '--name',
    container,
    '--network',
    job.kind === 'npm-ci' ? job.installNetwork : 'none',
    '--memory=512m',
    '--cpus=1',
    '--pids-limit=96',
    '--cap-drop=ALL',
    '--security-opt=no-new-privileges',
    '--read-only',
    '--user=' + (job.user || '1000:1000'),
    '--tmpfs=/tmp:rw,nosuid,nodev,size=134217728',
    '--env=HOME=/tmp',
    '--env=npm_config_cache=/tmp/npm-cache',
    '--env=CI=true',
    '--env=NO_COLOR=1',
    '--mount',
    'type=bind,src=' + job.dir + ',dst=/workspace',
    '--workdir=/workspace',
    job.image,
    ...cmd,
  ];
}
function run(job) {
  try {
    if (done || child) return;
    if (!path.isAbsolute(job.dir) || fs.lstatSync(job.dir).isSymbolicLink())
      throw Error('Pasta inválida.');
    const cmd = command(job);
    let executable, args;
    if (job.mode === 'docker') {
      executable = 'docker';
      args = dockerArguments(job);
    } else {
      if (job.kind !== 'node') throw Error('Scripts npm exigem Docker.');
      executable = process.execPath;
      args = [
        '--permission',
        '--allow-fs-read=' + job.dir,
        '--allow-fs-write=' + job.dir,
        ...(job.args[0] === '--test' ? ['--experimental-test-isolation=none'] : []),
        ...cmd.slice(1),
      ];
    }
    child = spawn(executable, args, {
      cwd: job.dir,
      env: process.env,
      shell: false,
      windowsHide: true,
      detached: process.platform !== 'win32',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    timer = setTimeout(
      () => cancel('Tempo limite atingido.'),
      Math.min(Math.max(job.timeout, 100), 600000),
    );
    const append = (data) => {
      output += data.toString();
      if (output.length > 100000) cancel('Limite de saída atingido.');
    };
    child.stdout.on('data', append);
    child.stderr.on('data', append);
    child.once('error', () =>
      finish(
        false,
        'Não foi possível iniciar o executor. Verifique a instalação e a imagem Docker.',
      ),
    );
    child.once('close', (code) => {
      if (cancelled) {
        if (!container) finish(false, cancelMessage);
      } else finish(code === 0, 'Código de saída: ' + code);
    });
  } catch (error) {
    finish(false, error.message);
  }
}
if (require.main === module) {
  process.on('message', (job) => {
    if (job?.type === 'cancel') cancel();
    else if (job?.type === 'run') run(job);
  });
  process.on('disconnect', () => {
    if (!done) cancel('Servidor desconectado.');
  });
}
module.exports = { command, dockerArguments };
