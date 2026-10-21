/* Project navigation and review tools. All mutation and scope checks remain server-side. */
(() => {
  'use strict';
  const A = window.FirmaAccess,
    U = window.FirmaUI,
    E = window.FirmaEngine;
  if (!A.isAdmin) return;
  const $ = (id) => document.getElementById(id),
    esc = (v) =>
      String(v ?? '').replace(
        /[&<>"']/g,
        (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
      );
  let current = 'firma',
    data = null,
    tab = 'summary',
    loading = false,
    inspection = 0;
  try {
    current = localStorage.getItem('firma-current-project') || 'firma';
  } catch {}
  const nav = {
      summary: 'Resumo',
      plans: 'Planos',
      memory: 'Memória',
      runs: 'Execuções',
      events: 'Caixa de entrada',
      settings: 'Dados e ajustes',
    },
    status = {
      prepared: 'Preparada',
      generating: 'IA produzindo',
      checking: 'Verificando',
      staged: 'Alterações preparadas',
      review: 'Sua revisão',
      validation_failed: 'Verificação falhou',
      integrating: 'Integrando',
      integrated: 'Integrada',
      cancelled: 'Cancelada',
      interrupted: 'Interrompida',
    };
  async function read() {
    try {
      const target = current,
        value = await A.companyRead('status?project=' + encodeURIComponent(target));
      if (target !== current) return data;
      data = value;
    } catch (error) {
      if (current !== 'firma') {
        current = 'firma';
        data = await A.companyRead('status?project=firma');
      } else throw error;
    }
    renderSelector();
    return data;
  }
  async function act(action, payload = {}) {
    const result = await A.company(action, { projectId: current, ...payload });
    await U.sync();
    await read();
    renderDashboard();
    return result;
  }
  async function select(project) {
    if (project === current && data) return;
    current = project;
    await read();
    try {
      localStorage.setItem('firma-current-project', current);
    } catch {}
    window.dispatchEvent(new CustomEvent('firma-project-changed', { detail: { id: current } }));
    renderDashboard();
  }
  function renderSelector() {
    const select = $('company-project');
    if (!select || !data) return;
    const stamp = JSON.stringify(data.projects.map((p) => [p.id, p.name]));
    if (select.dataset.stamp !== stamp) {
      select.innerHTML = data.projects
        .map((p) => `<option value="${esc(p.id)}">${esc(p.name)}</option>`)
        .join('');
      select.dataset.stamp = stamp;
    }
    select.value = current;
    document
      .querySelectorAll('[data-project-name]')
      .forEach(
        (el) => (el.textContent = data.projects.find((p) => p.id === current)?.name || 'Projeto'),
      );
    document.body.classList.toggle('reduced-motion', !!data.settings.reducedMotion);
    document.body.dataset.decoration = data.settings.decoration;
  }
  async function open(next = 'summary') {
    tab = nav[next] ? next : 'summary';
    await read();
    U.openModal(
      'Seu projeto',
      `<div class="company-dashboard"><div class="company-top"><button type="button" class="text-button" data-company-back>← Gestão</button><b data-project-name>${esc(data.projects.find((p) => p.id === current)?.name)}</b><button type="button" class="secondary-button" data-company="configure">Objetivo e equipe</button></div><nav class="company-nav" aria-label="Projeto">${Object.entries(
        nav,
      )
        .map(
          ([id, name]) =>
            `<button type="button" data-company-tab="${id}" aria-current="${tab === id ? 'page' : 'false'}">${name}</button>`,
        )
        .join('')}</nav><div id="company-live" aria-live="polite"></div></div>`,
      null,
      null,
      true,
    );
    renderDashboard();
  }
  function empty(message) {
    return '<p class="company-empty">' + message + '</p>';
  }
  function tasks() {
    return U.state.tasks.filter((t) => (t.projectId || 'firma') === current);
  }
  function renderDashboard() {
    if (!$('company-live') || !data) return;
    let html = '';
    if (tab === 'summary') {
      const s = data.summary;
      html = `<div class="company-stats"><span><b>${s.open}</b> em aberto</span><span><b>${s.review}</b> para revisar</span><span><b>${s.done}</b> aprovadas</span><span><b>${s.validated}</b> integrações validadas</span></div><section class="company-card"><small>OBJETIVO</small><h3>${esc(data.meta.objective || 'Qual é o próximo resultado que vamos entregar?')}</h3><div class="detail-tabs"><button type="button" class="primary-button" data-company="plan-new">＋ Preparar plano</button><button type="button" class="secondary-button" data-company="run-new">Trabalhar em uma cópia</button><button type="button" class="secondary-button" data-company="memory-new">Registrar uma decisão</button></div></section><h3 class="detail-subtitle">Marcos do projeto</h3><div class="company-milestones">${s.milestones.map((m) => `<span>★ ${esc(m.name)}</span>`).join('') || '<span>As entregas aprovadas e verificadas aparecerão aqui.</span>'}</div><details class="company-evidence"><summary>Primeiros passos e experiência comprovada</summary><ul>${s.onboarding.map((item) => `<li>${item.done ? '✓' : '○'} ${esc(item.name)}</li>`).join('')}</ul><p>${s.experience.map((item) => esc(item.name) + ': ' + item.approved).join(' · ')} entregas aprovadas com verificações.</p></details><h3 class="detail-subtitle">Próximo passo</h3>${
        tasks()
          .filter((t) => t.status === 'review')
          .map(
            (t) =>
              `<button type="button" class="task-link" data-task="${esc(t.id)}">Revisar: ${esc(t.title)} →</button>`,
          )
          .join('') ||
        empty(
          s.open
            ? 'A equipe tem tarefas em andamento. Acompanhe as execuções ou os bloqueios.'
            : 'Crie um plano ou uma tarefa para começar.',
        )
      }`;
    } else if (tab === 'plans') {
      html =
        '<div class="company-section-heading"><h3>Planos de trabalho</h3><button type="button" class="primary-button" data-company="plan-new">＋ Novo plano</button></div>' +
          data.plans
            .map(
              (plan) =>
                `<article class="company-card"><h3>${esc(plan.goal)}</h3><ol>${plan.steps.map((step) => `<li><b>${esc(step.title)}</b><small>${esc(U.state.agents.find((a) => a.id === step.agent)?.name)} · ${step.dependsOn ? 'Aguarda etapa ' + esc(step.dependsOn) : 'Pode começar'} · ${esc(step.criteria)}</small></li>`).join('')}</ol><div class="detail-tabs">${plan.started ? `<span class="detail-note">Iniciado em ${new Date(plan.started).toLocaleString('pt-BR')}</span>` : `<button type="button" class="secondary-button" data-edit-plan="${esc(plan.id)}">Editar etapas</button><button type="button" class="primary-button" data-start-plan="${esc(plan.id)}">Iniciar plano</button>`}</div></article>`,
            )
            .join('') || empty('Prepare um plano com etapas pequenas.');
    } else if (tab === 'memory') {
      html =
        '<div class="company-section-heading"><h3>Conhecimento do projeto</h3><button type="button" class="primary-button" data-company="memory-new">＋ Registro</button></div>' +
          data.meta.memory
            .map(
              (m) =>
                `<article class="company-card"><small>${{ requirement: 'REQUISITO', decision: 'DECISÃO', question: 'DÚVIDA', reference: 'REFERÊNCIA' }[m.kind]} · ${m.approved ? 'APROVADO' : 'SUGESTÃO'}</small><p>${esc(m.text)}</p><small>Origem: ${esc(m.source)} · ${new Date(m.time).toLocaleDateString('pt-BR')}</small><div class="detail-tabs">${!m.approved ? `<button type="button" data-approve-memory="${esc(m.id)}">Aprovar contexto</button>` : ''}<button type="button" data-edit-memory="${esc(m.id)}">Editar</button><button type="button" data-remove-memory="${esc(m.id)}">Remover</button></div></article>`,
            )
            .join('') ||
        empty(
          'Registre requisitos, decisões, dúvidas e fontes. Somente registros aprovados acompanham as novas tarefas.',
        );
    } else if (tab === 'runs') {
      html =
        '<div class="company-section-heading"><h3>Execuções e cópias de trabalho</h3><button type="button" class="primary-button" data-company="run-new">＋ Preparar execução</button></div>' +
          [...data.runs]
            .reverse()
            .map(
              (run) =>
                `<button type="button" class="company-run" data-company-run="${esc(run.id)}"><span><b>${esc(U.state.tasks.find((t) => t.id === run.taskId)?.title || run.summary || 'Execução')}</b><small>${esc(status[run.status] || run.status)} · ${run.mode === 'delegated' ? 'Delegado' : run.mode === 'assisted' ? 'Assistido' : 'Manual'} · ${run.calls}/${run.limits.rounds} rodadas · ${run.changedFiles.length} arquivos</small>${run.error ? `<small class="company-error">${esc(run.error)}</small>` : ''}</span><span>→</span></button>`,
            )
            .join('') ||
        empty('Prepare uma cópia de um projeto para trabalhar sem alterar a versão principal.');
    } else if (tab === 'events') {
      html =
        '<div class="company-section-heading"><h3>O que precisa da sua atenção</h3></div>' +
        tasks()
          .filter((t) => ['review', 'blocked'].includes(t.status))
          .map(
            (t) =>
              `<button type="button" class="task-link" data-task="${esc(t.id)}">${t.status === 'review' ? 'Entrega para revisar' : 'Dependência pendente'} · ${esc(t.title)} →</button>`,
          )
          .join('') +
        '<h3 class="detail-subtitle">Histórico do projeto</h3>' +
        data.events
          .map(
            (e) =>
              `<button type="button" class="company-event" ${e.runId ? 'data-company-run="' + esc(e.runId) + '"' : e.taskId ? 'data-task="' + esc(e.taskId) + '"' : ''}><span>${esc(e.message)}</span><small>${new Date(e.time).toLocaleString('pt-BR')}</small></button>`,
          )
          .join('');
    } else {
      html = `<div class="company-stats"><span><b>${data.meta.usage.day === new Date().toISOString().slice(0, 10) ? data.meta.usage.calls : 0}/${data.meta.limits.calls}</b> chamadas hoje</span><span><b>${data.meta.limits.rounds}</b> rodadas por execução</span><span><b>${data.meta.limits.seconds}s</b> por execução</span></div><div class="company-tools"><button type="button" data-company="configure">Objetivo, equipe e limites →</button><button type="button" data-company="checks">Verificações do projeto →</button><button type="button" data-company="git">Git e histórico de versões →</button><button type="button" data-company="backup-now">Criar backup no servidor →</button><button type="button" data-company="export">Exportar backup completo →</button><button type="button" data-company="import">Conferir e restaurar pacote →</button><button type="button" data-company="compare">Comparar execuções →</button><button type="button" data-company="diagnostics">Diagnóstico do ambiente →</button><button type="button" data-company="appearance">Cenário e acessibilidade →</button><button type="button" data-company="local">Conectar modelos locais →</button></div><p class="detail-note">Custos monetários: não informados. As contagens mostram chamadas autorizadas. Os limites gerais das IAs também continuam valendo.</p>`;
    }
    $('company-live').innerHTML = html;
  }
  function configure() {
    const m = data.meta;
    U.openModal(
      'Objetivo, equipe e limites',
      `<label>Objetivo do projeto<textarea name="objective" maxlength="1500">${esc(m.objective)}</textarea></label><details class="manage-advanced"><summary>Equipe do projeto</summary>${U.state.agents.map((a) => `<label class="company-check"><input type="checkbox" name="team" value="${esc(a.id)}" ${m.team.includes(a.id) ? 'checked' : ''}>${esc(a.name)} · ${esc(a.role)}</label>`).join('')}</details><div class="form-grid"><label>Chamadas por dia<input name="calls" type="number" min="1" max="100" required value="${m.limits.calls}"></label><label>Rodadas por execução<input name="rounds" type="number" min="1" max="5" required value="${m.limits.rounds}"></label><label>Tempo por execução (s)<input name="seconds" type="number" min="15" max="600" required value="${m.limits.seconds}"></label></div>`,
      'Salvar projeto',
      async (f) => {
        await act('project.configure', {
          objective: f.get('objective'),
          team: f.getAll('team'),
          limits: {
            calls: Number(f.get('calls')),
            rounds: Number(f.get('rounds')),
            seconds: Number(f.get('seconds')),
          },
        });
        await open();
      },
    );
  }
  function memoryForm(item) {
    U.openModal(
      item ? 'Editar registro' : 'Memória do projeto',
      `<label>Tipo<select name="kind">${[
        ['requirement', 'Requisito'],
        ['decision', 'Decisão'],
        ['question', 'Dúvida'],
        ['reference', 'Referência'],
      ]
        .map(
          ([id, name]) =>
            `<option value="${id}" ${id === item?.kind ? 'selected' : ''}>${name}</option>`,
        )
        .join(
          '',
        )}</select></label><label>Registro<textarea name="text" required maxlength="2500">${esc(item?.text || '')}</textarea></label><label>Origem<input name="source" maxlength="300" value="${esc(item?.source || 'Administrador')}"></label><label class="company-check"><input name="approved" type="checkbox" ${item?.approved ? 'checked' : ''}>Aprovado para acompanhar novas tarefas</label>`,
      'Salvar registro',
      async (f) => {
        await act('memory', {
          ...Object.fromEntries(f),
          id: item?.id,
          approved: f.has('approved'),
        });
        await open('memory');
      },
    );
  }
  async function newPlan() {
    U.openModal(
      'Objetivo para o plano',
      '<label>O que vamos entregar?<textarea name="goal" required maxlength="1500">' +
        esc(data.meta.objective) +
        '</textarea></label><p class="detail-note">Codex prepara uma estrutura local de etapas para você editar. Esta ação não envia uma chamada de IA.</p>',
      'Preparar etapas',
      async (f) => {
        const result = await act('plan', { goal: f.get('goal') });
        editPlan(result.plan);
      },
    );
  }
  function editPlan(plan) {
    if (plan.started) {
      open('plans');
      return;
    }
    let steps = structuredClone(plan.steps);
    U.openModal(
      'Editar plano de trabalho',
      `<label>Objetivo<textarea id="company-plan-goal" maxlength="1500" required>${esc(plan.goal)}</textarea></label><div id="company-plan-steps"></div><button type="button" class="secondary-button" id="company-step-add">＋ Acrescentar etapa</button>`,
      'Salvar plano',
      async () => {
        collect();
        await act('plan', { id: plan.id, goal: $('company-plan-goal').value, steps });
        await open('plans');
      },
      true,
    );
    function collect() {
      steps = [...document.querySelectorAll('[data-plan-step]')].map((row) => {
        const get = (name) => row.querySelector('[data-field="' + name + '"]').value;
        return {
          id: row.dataset.planStep,
          title: get('title'),
          template: get('template'),
          agent: get('agent'),
          description: get('description'),
          criteria: get('criteria'),
          dependsOn: get('dependsOn'),
        };
      });
    }
    function render() {
      const host = $('company-plan-steps');
      host.innerHTML = steps
        .map(
          (s, i) =>
            `<section class="company-step" data-plan-step="${esc(s.id)}"><header><b>Etapa ${i + 1}</b><button type="button" data-delete-step="${esc(s.id)}">Remover</button></header><label>Título<input data-field="title" required maxlength="100" value="${esc(s.title)}"></label><div class="form-grid"><label>Tipo<select data-field="template">${Object.entries(
              E.departments,
            )
              .map(
                ([key, d]) =>
                  `<option value="${d.template}" ${s.template === d.template ? 'selected' : ''}>${d.name}</option>`,
              )
              .join(
                '',
              )}</select></label><label>Responsável<select data-field="agent">${U.state.agents
              .filter((a) => a.department === E.templates[s.template].department)
              .map(
                (a) =>
                  `<option value="${esc(a.id)}" ${s.agent === a.id ? 'selected' : ''}>${esc(a.name)}</option>`,
              )
              .join(
                '',
              )}</select></label></div><label>Aguarda<select data-field="dependsOn"><option value="">Nenhuma etapa</option>${steps
              .slice(0, i)
              .map(
                (step, j) =>
                  `<option value="${esc(step.id)}" ${s.dependsOn === step.id ? 'selected' : ''}>Etapa ${j + 1}: ${esc(step.title)}</option>`,
              )
              .join(
                '',
              )}</select></label><details class="manage-advanced"><summary>Instruções e critérios</summary><label>Instruções<textarea data-field="description" maxlength="3000">${esc(s.description)}</textarea></label><label>Critérios<textarea data-field="criteria" maxlength="2000">${esc(s.criteria)}</textarea></label></details></section>`,
        )
        .join('');
      host.querySelectorAll('[data-delete-step]').forEach(
        (b) =>
          (b.onclick = () => {
            collect();
            steps = steps
              .filter((s) => s.id !== b.dataset.deleteStep)
              .map((s) => ({
                ...s,
                dependsOn: s.dependsOn === b.dataset.deleteStep ? '' : s.dependsOn,
              }));
            render();
          }),
      );
      host.querySelectorAll('[data-field=template]').forEach(
        (select) =>
          (select.onchange = (e) => {
            const row = e.target.closest('[data-plan-step]'),
              member = U.state.agents.find(
                (a) => a.department === E.templates[e.target.value].department,
              );
            collect();
            const step = steps.find((s) => s.id === row.dataset.planStep);
            step.agent = member?.id || '';
            step.criteria = E.templates[step.template].criteria;
            render();
          }),
      );
    }
    $('company-step-add').onclick = () => {
      collect();
      if (steps.length >= 20) return;
      const d = E.departments.development;
      steps.push({
        id: crypto.randomUUID(),
        title: 'Nova etapa',
        template: d.template,
        agent: U.state.agents.find((a) => a.department === 'development')?.id || '',
        description: plan.goal,
        criteria: E.templates[d.template].criteria,
        dependsOn: steps.at(-1)?.id || '',
      });
      render();
    };
    render();
  }
  function newRun(taskId = '') {
    if (current === 'firma') {
      U.openModal(
        'Escolha um projeto de trabalho',
        '<p class="detail-description">Selecione ou crie um projeto próprio na sua mesa. As execuções delegadas trabalham em cópias desse projeto.</p><button type="button" class="primary-button" data-studio-role="admin" data-studio-pane="home">Abrir minha mesa</button>',
        null,
        null,
      );
      return;
    }
    const available = tasks().filter((t) => t.status !== 'done');
    U.openModal(
      'Preparar cópia de trabalho',
      `<label>Tarefa<select name="taskId" required>${available.map((t) => `<option value="${esc(t.id)}" ${t.id === taskId ? 'selected' : ''}>${esc(t.title)}</option>`).join('')}</select></label><label>Modo<select name="mode"><option value="manual">Manual · editar a cópia e verificar</option><option value="assisted">Assistido · IA prepara arquivos para revisão</option><option value="delegated">Delegado · IA propõe, verifica e corrige dentro dos limites</option></select></label><label class="company-check"><input name="git" type="checkbox">Criar branch Git por tarefa (inicialize Git nos ajustes)</label><details><summary>Arquivos enviados como contexto</summary><label>Caminhos, um por linha<textarea name="contextFiles" placeholder="src/app.js&#10;tests/app.test.js"></textarea></label><p>Deixe vazio para seleção automática por relevância. A execução registra os arquivos enviados.</p></details><p class="detail-note">Preparar a cópia não envia chamadas. Antes de executar, você confere a pasta, os limites e as verificações.</p>`,
      'Preparar cópia',
      async (f) => {
        const result = await act('run.create', {
          ...Object.fromEntries(f),
          git: f.has('git'),
          contextFiles: String(f.get('contextFiles') || '')
            .split('\n')
            .map((x) => x.trim())
            .filter(Boolean),
        });
        await inspectRun(result.runId);
      },
    );
  }
  async function inspectRun(id) {
    const request = ++inspection,
      run = await A.companyRead('run?id=' + encodeURIComponent(id));
    if (request !== inspection) return;
    const task = U.state.tasks.find((t) => t.id === run.taskId);
    U.openModal(
      task?.title || 'Execução',
      `<div data-inspected-run="${esc(run.id)}" data-run-status="${esc(run.status)}"></div><button type="button" class="text-button" data-company-tab="runs">← Execuções</button><div class="task-detail-meta"><b>${esc(status[run.status] || run.status)}</b><span>${run.calls}/${run.limits.rounds} rodadas</span><span>${run.limits.seconds}s</span><span>${run.tokens || 0} tokens informados</span></div>${run.error ? '<p class="company-error">' + esc(run.error) + '</p>' : ''}<p>${esc(run.summary)}</p>${run.git ? `<p class="detail-note">Branch: ${esc(run.git.branch)} · Commit: ${esc(run.git.head.slice(0, 12))}</p>` : ''}${run.contextSelection ? `<details><summary>Contexto enviado (${run.contextSelection.files.length} arquivos)</summary><p>${run.contextSelection.files.map(esc).join(', ')}</p><p>${run.contextSelection.omitted} arquivo(s) apenas no catálogo.</p></details>` : ''}<div class="detail-tabs">${!['integrated', 'generating', 'checking'].includes(run.status) ? `<button type="button" class="primary-button" data-run-execute="${id}">${run.mode === 'manual' ? 'Verificar cópia' : 'Autorizar execução'}</button><button type="button" data-run-check="${id}">Executar verificações</button><button type="button" data-run-stage="${id}">Editar arquivo da cópia</button><button type="button" data-run-checkpoint="${id}">Salvar checkpoint</button>` : ''}${run.status === 'review' ? `<button type="button" class="primary-button" data-run-integrate="${id}">Revisar e integrar</button>` : ''}${['generating', 'checking'].includes(run.status) ? `<button type="button" data-run-cancel="${id}">Parar execução</button>` : ''}<button type="button" data-company-run="${id}">Atualizar estado</button>${run.status === 'integrated' ? `<button type="button" data-prepare-release="${id}">Preparar pacote do site</button>` : ''}</div><h3 class="detail-subtitle">Verificações reais</h3>${(run.evidence || []).map((e) => `<details class="company-evidence"><summary>${e.passed ? '✓ Passou' : '! Falhou'} · ${esc(e.name)}</summary><pre>${esc(e.output)}</pre></details>`).join('') || empty('Ainda não há verificações executadas.')}<h3 class="detail-subtitle">Arquivos alterados (${run.files.length})</h3>${run.files.map((file) => `<details class="company-evidence"><summary>${esc(file.path)}</summary>${window.FirmaCodeEditor ? FirmaCodeEditor.diffMarkup(file.before, file.after) : `<pre>${esc(file.after)}</pre>`}</details>`).join('')}<h3 class="detail-subtitle">Checkpoints</h3>${run.checkpoints.map((c) => `<button type="button" class="task-link" data-restore-checkpoint="${c.id}" data-checkpoint-run="${id}">${esc(c.label)} · ${new Date(c.time).toLocaleString('pt-BR')} →</button>`).join('')}`,
      null,
      null,
      true,
    );
  }
  async function executeRun(id, checkOnly = false) {
    const run = await A.companyRead('run?id=' + id);
    U.openModal(
      checkOnly ? 'Verificar a cópia' : 'Autorizar trabalho na cópia',
      `<p class="detail-description">Projeto: <b>${esc(data.projects.find((p) => p.id === run.projectId)?.name)}</b><br>Modo: ${esc(run.mode)}<br>Máximo: ${run.limits.rounds} rodadas e ${run.limits.seconds} segundos.</p><p class="detail-note">${checkOnly ? 'As verificações cadastradas executam código local na cópia.' : 'O briefing, o contexto aprovado e os arquivos de código da cópia serão enviados ao provedor configurado. Cada rodada pode consumir uma chamada. O projeto principal permanece aguardando a integração.'}</p><p class="detail-note">Verificações: ${esc(data.meta.checks.map((c) => c.name).join(', ') || 'Sintaxe JavaScript')}</p><label class="company-check"><input name="confirm" type="checkbox" required>Autorizar este escopo de execução</label>`,
      'Iniciar execução',
      async () => {
        await act('run.start', {
          runId: id,
          operation: checkOnly ? 'check' : 'generate',
          confirm: true,
        });
        await inspectRun(id);
      },
    );
  }
  async function stageRun(id) {
    const run = await A.companyRead('run?id=' + id);
    U.openModal(
      'Editar arquivo na cópia',
      '<label>Caminho<input name="path" required maxlength="200" placeholder="src/app.js"></label><label>Conteúdo completo<textarea name="content" required maxlength="300000" class="large-textarea"></textarea></label><p class="detail-note">Esta alteração fica somente na cópia. Você poderá comparar antes de integrar.</p>',
      'Preparar alteração',
      async (f) => {
        await act('run.stage', { runId: id, ...Object.fromEntries(f) });
        await inspectRun(id);
      },
      true,
    );
  }
  function checks() {
    U.openModal(
      'Verificações do projeto',
      `<p class="dialog-intro">Uma verificação por linha. Use <code>syntax</code>, <code>node-test:tests/app.test.js</code> ou <code>node-script:scripts/build.js</code>. Com Docker, use <code>npm-ci</code>, <code>npm-script:lint</code>, <code>npm-script:typecheck</code>, <code>npm-script:test</code> e <code>npm-script:build</code>, nessa ordem. Instalação exige package-lock.json e não executa scripts de instalação. Executor: <b>${esc(data.diagnostics.executor.mode)}</b>.</p><label>Catálogo<textarea name="checks" maxlength="3000">${esc(data.meta.checks.map((c) => c.kind + (c.file ? ':' + c.file : '')).join('\n') || 'syntax')}</textarea></label>`,
      'Salvar verificações',
      async (f) => {
        const checks = String(f.get('checks'))
          .split('\n')
          .filter((x) => x.trim())
          .map((line) => {
            const [kind, ...file] = line.trim().split(':');
            return { kind, file: file.join(':'), name: line.trim() };
          });
        await act('checks.configure', { checks });
        await open('settings');
      },
    );
  }
  function download(name, value) {
    const url = URL.createObjectURL(
        new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }),
      ),
      link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function exportAll() {
    const backup = await A.company('backup.export');
    download('firma-completa-' + new Date().toISOString().slice(0, 10) + '.json', backup);
    U.toast(
      'Pacote completo exportado. ' +
        backup.omitted.length +
        ' arquivo(s) protegido(s) omitido(s).',
    );
  }
  function importAll() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async () => {
      try {
        const file = input.files[0];
        if (!file) return;
        if (file.size > 30_000_000) throw Error('Use um pacote de até 30 MB.');
        const backup = JSON.parse(await file.text()),
          summary = await A.company('backup.inspect', { backup });
        U.openModal(
          'Conferir restauração completa',
          `<p class="detail-description">${summary.projects.length} projetos · ${summary.files} arquivos · ${summary.tasks} tarefas · ${summary.agents} agentes.</p><p class="detail-note">Os projetos serão importados como cópias. O escritório e os históricos serão restaurados a partir do pacote. Uma cópia de segurança do estado atual será preservada antes da operação. Credenciais não são incluídas.</p>`,
          'Restaurar cópia completa',
          async () => {
            await A.company('backup.restore', { backup, confirm: true });
            current = 'firma';
            await U.sync();
            await read();
            await open();
          },
        );
      } catch (e) {
        U.toast(e.message);
      }
    };
    input.click();
  }
  async function diagnostics() {
    const d = data.diagnostics,
      ai = await A.aiStatus();
    U.openModal(
      'Diagnóstico da Firma',
      `<div class="company-card"><p>Firma ${esc(d.version)} · servidor conectado · ${esc(d.node)}</p><p>Sistema: ${esc(d.platform)} · RAM total: ${d.memoryMB} MB</p><p>Armazenamento: ${esc(d.storage)}</p><p>Execução ativa: ${d.active ? esc(d.active) : 'nenhuma'}</p><p>Conexões: ${ai.providers.map((p) => esc(p.name) + ': ' + (p.connected ? 'conectado' : 'desconectado')).join(' · ')}</p><p>Última falha: ${esc(d.lastError || 'nenhuma registrada neste projeto')}</p><p>Custo monetário: não informado pelos dados atuais.</p></div><h3 class="detail-subtitle">Ferramentas por especialidade</h3>${Object.values(
        d.tools,
      )
        .map(
          (tool) =>
            `<article class="company-card"><b>${esc(tool.name)}</b><p>${esc(tool.output)}</p></article>`,
        )
        .join(
          '',
        )}<p class="detail-note">Os testes com provedores substitutos validam a aplicação. A qualidade das respostas reais deve ser conferida nas entregas e evidências.</p>`,
      null,
      null,
      true,
    );
  }
  function compare() {
    const runs = data.runs;
    if (runs.length < 2) {
      U.toast('Prepare pelo menos duas execuções neste projeto para comparar.');
      return;
    }
    const options = runs
      .map(
        (r) =>
          `<option value="${esc(r.id)}">${esc(U.state.tasks.find((t) => t.id === r.taskId)?.title || r.id)} · ${esc(status[r.status])} · ${esc(r.createdAt)}</option>`,
      )
      .join('');
    U.openModal(
      'Comparar execuções',
      `<p class="detail-note">Escolha execuções do mesmo objetivo para comparar revisões de instruções e resultados. Esta consulta não envia chamadas.</p><label>Primeira execução<select name="a">${options}</select></label><label>Segunda execução<select name="b">${options}</select></label>`,
      'Comparar registros',
      async (f) => {
        if (f.get('a') === f.get('b')) throw Error('Escolha duas execuções diferentes.');
        const selected = [f.get('a'), f.get('b')].map((id) => runs.find((r) => r.id === id)),
          duration = (r) =>
            r.startedAt && r.finishedAt
              ? Math.max(
                  0,
                  Math.round((Date.parse(r.finishedAt) - Date.parse(r.startedAt)) / 1000),
                ) + ' s'
              : 'Não registrado',
          rows = [
            ['Estado', (r) => status[r.status]],
            ['Executor', (r) => (r.provider ? `${r.provider} · ${r.model || 'padrão'}` : 'Manual')],
            ['Chamadas', (r) => r.calls],
            ['Tokens informados', (r) => r.tokens || 'Não informado'],
            ['Duração da última tentativa', duration],
            [
              'Verificações',
              (r) => `${r.evidence.filter((e) => e.passed).length}/${r.evidence.length} passaram`,
            ],
            ['Rodadas com correção', (r) => Math.max(0, r.calls - 1)],
            [
              'Entrega aprovada',
              (r) =>
                U.state.tasks.find((t) => t.id === r.taskId)?.status === 'done' ? 'Sim' : 'Não',
            ],
          ];
        U.openModal(
          'Comparação de resultados',
          `<div class="company-comparison"><table><thead><tr><th>Registro</th><th>Primeira</th><th>Segunda</th></tr></thead><tbody>${rows.map(([name, value]) => `<tr><th>${esc(name)}</th>${selected.map((r) => `<td>${esc(value(r))}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="detail-note">Os números descrevem estas execuções. Uma verificação de sintaxe não comprova qualidade funcional. A aprovação pertence à tarefa atual; confira os arquivos e o histórico antes de escolher um padrão.</p>`,
          null,
          null,
          true,
        );
      },
    );
  }
  function appearance() {
    const s = data.settings;
    U.openModal(
      'Cenário e acessibilidade',
      `<label class="company-check"><input name="social" type="checkbox" ${s.social ? 'checked' : ''}>Conversas sociais dos personagens</label><label class="company-check"><input name="reducedMotion" type="checkbox" ${s.reducedMotion ? 'checked' : ''}>Reduzir movimentos decorativos</label><label>Detalhes visuais<select name="decoration"><option value="classic">Madeira e verde</option><option value="garden" ${s.decoration === 'garden' ? 'selected' : ''} ${data.unlockedDecorations.includes('garden') ? '' : 'disabled'}>Jardim · primeira aprovação</option><option value="wood" ${s.decoration === 'wood' ? 'selected' : ''} ${data.unlockedDecorations.includes('wood') ? '' : 'disabled'}>Madeira clara · aprovação validada</option></select></label>`,
      'Salvar preferências',
      async (f) => {
        await act('settings', {
          social: f.has('social'),
          reducedMotion: f.has('reducedMotion'),
          decoration: f.get('decoration'),
        });
        renderSelector();
        await open('settings');
      },
    );
  }
  const actions = {
    configure,
    'memory-new': () => memoryForm(),
    'plan-new': newPlan,
    'run-new': newRun,
    checks,
    export: exportAll,
    import: importAll,
    compare,
    diagnostics,
    git: gitPanel,
    'backup-now': async () => {
      const result = await act('backup.now');
      U.toast('Backup verificado no servidor: ' + result.file);
    },
    appearance,
    local: () => window.FirmaAI.open(),
  };
  async function gitPanel() {
    if (current === 'firma') {
      U.toast('Selecione um projeto próprio para usar Git.');
      return;
    }
    const git = await A.company('git.status', { projectId: current });
    U.openModal(
      'Git do projeto',
      git.initialized
        ? '<p>Branch: <b>' +
            esc(git.branch) +
            '</b><br>Commit: ' +
            esc(git.head) +
            '</p><pre>' +
            esc(git.changes || 'Nenhuma alteração pendente.') +
            '</pre><pre>' +
            esc(git.history) +
            '</pre><p>O checkpoint cria um commit dos arquivos permitidos. Arquivos privados ficam fora do histórico criado pela Firma.</p>'
        : '<p>Crie o histórico Git deste projeto. A Firma registra os arquivos de código permitidos em um primeiro commit local.</p>',
      git.initialized ? 'Criar checkpoint Git' : 'Inicializar Git',
      async () => {
        await act(git.initialized ? 'git.checkpoint' : 'git.init', { confirm: true });
        await gitPanel();
      },
    );
  }
  function prepareRelease(id) {
    U.openModal(
      'Preparar pacote local',
      '<p>A entrega precisa estar integrada, verificada e aprovada na gestão. Esta ação gera um arquivo para download; não publica na internet.</p><label>Origem<select name="source"><option value="project">Projeto estático (HTML, CSS e JavaScript)</option><option value="dist">Resultado do build em dist/</option></select></label>',
      'Preparar pacote',
      async (f) => {
        const result = await A.company('release.prepare', {
          runId: id,
          source: f.get('source'),
          confirm: true,
        });
        U.openModal(
          'Pacote preparado',
          '<p>' +
            result.files.length +
            ' arquivos · SHA-256: <code>' +
            esc(result.archiveSha256) +
            '</code></p><a class="primary-button" href="' +
            esc(result.download) +
            '" download>Baixar pacote .tar.gz</a><p>Nenhuma publicação executada.</p>',
          null,
          null,
        );
      },
    );
  }
  document.addEventListener('click', async (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    try {
      if (b.dataset.companyTab) await open(b.dataset.companyTab);
      if (b.hasAttribute('data-company-back')) U.management();
      if (b.dataset.company) await actions[b.dataset.company]?.();
      if (b.dataset.editPlan) editPlan(data.plans.find((p) => p.id === b.dataset.editPlan));
      if (b.dataset.startPlan) {
        await act('plan', { operation: 'start', id: b.dataset.startPlan });
        await open('plans');
      }
      if (b.dataset.approveMemory) {
        await act('memory', { operation: 'approve', id: b.dataset.approveMemory });
        await open('memory');
      }
      if (b.dataset.editMemory)
        memoryForm(data.meta.memory.find((m) => m.id === b.dataset.editMemory));
      if (b.dataset.removeMemory) {
        const item = data.meta.memory.find((m) => m.id === b.dataset.removeMemory);
        U.openModal(
          'Remover registro?',
          '<p>' + esc(item.text) + '</p>',
          'Remover registro',
          async () => {
            await act('memory', { operation: 'remove', id: item.id });
            await open('memory');
          },
        );
      }
      if (b.dataset.companyTask) {
        const task = U.state.tasks.find((t) => t.id === b.dataset.companyTask);
        await select(task.projectId);
        newRun(task.id);
      }
      if (b.dataset.companyRun) await inspectRun(b.dataset.companyRun);
      if (b.dataset.runExecute) {
        const run = data.runs.find((r) => r.id === b.dataset.runExecute);
        await executeRun(run.id, run.mode === 'manual');
      }
      if (b.dataset.runCheck) await executeRun(b.dataset.runCheck, true);
      if (b.dataset.runStage) await stageRun(b.dataset.runStage);
      if (b.dataset.runCheckpoint) {
        await act('run.checkpoint', { runId: b.dataset.runCheckpoint });
        await inspectRun(b.dataset.runCheckpoint);
      }
      if (b.dataset.restoreCheckpoint) {
        await act('run.checkpoint', {
          runId: b.dataset.checkpointRun,
          checkpointId: b.dataset.restoreCheckpoint,
        });
        await inspectRun(b.dataset.checkpointRun);
      }
      if (b.dataset.runCancel) {
        await act('run.cancel', { runId: b.dataset.runCancel });
        await inspectRun(b.dataset.runCancel);
      }
      if (b.dataset.prepareRelease) prepareRelease(b.dataset.prepareRelease);
      if (b.dataset.runIntegrate) {
        const id = b.dataset.runIntegrate;
        U.openModal(
          'Integrar alterações revisadas',
          '<p class="detail-description">As alterações da cópia serão gravadas no projeto principal. Se algum arquivo mudou fora desta execução, a integração será bloqueada para preservar o conflito.</p>',
          'Integrar ao projeto',
          async () => {
            await act('run.integrate', { runId: id, confirm: true });
            await inspectRun(id);
          },
        );
      }
    } catch (error) {
      if ($('modal').open) $('modal-error').textContent = error.message;
      else U.toast(error.message);
    }
  });
  const picker = document.createElement('div');
  picker.className = 'company-picker';
  picker.innerHTML =
    '<select id="company-project" aria-label="Projeto ativo"><option value="firma">Escritório geral</option></select><button type="button" id="company-open" title="Resumo do projeto">Projeto ↗</button>';
  document.querySelector('.game-brand').after(picker);
  $('company-project').onchange = (e) => select(e.target.value).catch((e) => U.toast(e.message));
  $('company-open').onclick = () => open();
  function managementShortcut() {
    const main = document.querySelector('.manage-main');
    if (!main || main.querySelector('.company-context')) return;
    const context = document.createElement('div');
    context.className = 'company-context';
    context.innerHTML =
      '<span>Projeto: <b data-project-name>' +
      esc(data?.projects.find((p) => p.id === current)?.name || 'Escritório geral') +
      '</b></span><button type="button" data-company-tab="summary">Planos, memória e execuções →</button>';
    main.prepend(context);
  }
  new MutationObserver(managementShortcut).observe($('modal-content'), {
    childList: true,
    subtree: true,
  });
  window.FirmaProjects = {
    get current() {
      return current;
    },
    get data() {
      return data;
    },
    select,
    open,
    refresh: read,
  };
  read()
    .then(() =>
      window.dispatchEvent(new CustomEvent('firma-project-changed', { detail: { id: current } })),
    )
    .catch((e) => U.toast(e.message));
  setInterval(async () => {
    if (loading || document.hidden) return;
    loading = true;
    try {
      await read();
      renderDashboard();
      const inspected = document.querySelector('[data-inspected-run]'),
        latest = data.runs.find((r) => r.id === inspected?.dataset.inspectedRun);
      if (latest && latest.status !== inspected.dataset.runStatus) await inspectRun(latest.id);
    } catch {
    } finally {
      loading = false;
    }
  }, 3000);
})();
