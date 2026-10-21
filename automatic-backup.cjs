'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { atomicJSON } = require('./persistence.cjs');
const { exportCompany, inspectCompany } = require('./company-backup.cjs');

class AutomaticBackup {
  constructor(company, options = {}) {
    this.company = company;
    this.dir = path.resolve(
      options.dir ||
        process.env.FIRMA_BACKUP_DIR ||
        path.join(company.dataDir, 'backups', 'automatic'),
    );
    this.hours = Number(options.hours ?? process.env.FIRMA_BACKUP_HOURS ?? 24);
    if (!Number.isFinite(this.hours) || this.hours < 1 || this.hours > 720)
      throw Error('Intervalo de backup inválido. Use de 1 a 720 horas.');
    this.last = null;
    this.lastError = '';
    if (fs.existsSync(this.dir)) {
      const latest = fs
        .readdirSync(this.dir)
        .filter((name) => /^firma-\d{4}-[\dTZ-]+\.json$/.test(name))
        .sort()
        .at(-1);
      if (latest)
        try {
          const file = path.join(this.dir, latest);
          if (fs.lstatSync(file).isSymbolicLink() || fs.statSync(file).size > 30000000)
            throw Error('Backup anterior indisponível.');
          const backup = JSON.parse(fs.readFileSync(file, 'utf8'));
          inspectCompany(company, backup);
          this.last = { time: backup.createdAt, file: latest, sha256: backup.sha256 };
        } catch {
          this.lastError = 'O último backup não pôde ser validado. Crie outro pacote.';
        }
    }
  }
  status() {
    return { last: this.last, lastError: this.lastError, intervalHours: this.hours, retention: 7 };
  }
  create() {
    try {
      if (
        this.company.active ||
        this.company.workstation.projects.locks.size ||
        this.company.workstation.child ||
        this.company.ai.active ||
        this.company.ai.activeChat
      )
        throw Error('Aguarde as execuções antes de criar o backup.');
      const backup = exportCompany(this.company);
      inspectCompany(this.company, backup);
      fs.mkdirSync(this.dir, { recursive: true, mode: 0o700 });
      if (fs.lstatSync(this.dir).isSymbolicLink()) throw Error('Pasta de backup vinculada.');
      const name = 'firma-' + new Date().toISOString().replace(/[:.]/g, '-') + '.json';
      atomicJSON(path.join(this.dir, name), backup);
      this.last = { time: backup.createdAt, file: name, sha256: backup.sha256 };
      this.lastError = '';
      const files = fs
        .readdirSync(this.dir)
        .filter((name) => /^firma-\d{4}-[\dTZ-]+\.json$/.test(name))
        .sort()
        .reverse();
      for (const old of files.slice(7)) {
        const target = path.resolve(this.dir, old);
        if (path.dirname(target) !== this.dir || fs.lstatSync(target).isSymbolicLink()) continue;
        fs.unlinkSync(target);
      }
      return this.last;
    } catch (error) {
      this.lastError = this.company.workstation.clean(error.message);
      throw error;
    }
  }
  start(log) {
    const tick = () => {
      let delay = this.hours * 3600000;
      try {
        this.create();
        log?.('backup.completed');
      } catch {
        log?.('backup.failed');
        delay = 60000;
      }
      this.timer = setTimeout(tick, delay);
      this.timer.unref();
    };
    const remaining = this.last
      ? this.hours * 3600000 - (Date.now() - Date.parse(this.last.time))
      : 60000;
    this.timer = setTimeout(tick, Math.max(1000, Number.isFinite(remaining) ? remaining : 1000));
    this.timer.unref();
  }
  close() {
    clearTimeout(this.timer);
  }
}
module.exports = { AutomaticBackup };
