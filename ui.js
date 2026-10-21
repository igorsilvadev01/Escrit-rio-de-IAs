(() => {
  'use strict';
  const A = window.FirmaAccess,
    E = window.FirmaEngine,
    $ = (id) => document.getElementById(id),
    esc = (s) =>
      String(s ?? '').replace(
        /[&<>"']/g,
        (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
      );
  let state = E.migrate(A.initial.state),
    storageAvailable = true,
    paused = A.initial.paused,
    view = 'office',
    onSubmit = null,
    toastTimer,
    search = '',
    filter = 'all',
    selectedTemplate = 'research',
    dirty = true,
    scenePanel = '',
    selectedDepartment = 'planning',
    roomFilter = 'all',
    boardDepartment = 'all';
  let lastRevision = A.initial.revision,
    lastSavedPlayer = '',
    syncing = false;
  if (!A.isAdmin)
    state.player = {
      ...state.player,
      name: 'Você',
      color: '#a8cceb',
      ...E.officeLayout.spawn,
      visited: [],
      immersive: true,
    };
  const save = () => {
    if (!A.isAdmin) return;
    const player = JSON.stringify(state.player);
    if (player === lastSavedPlayer) return;
    lastSavedPlayer = player;
    A.command('player', JSON.parse(player)).catch((error) => {
      lastSavedPlayer = '';
      storageAvailable = false;
      toast(error.message);
    });
  };
  function requireAdmin() {
    if (A.isAdmin) return true;
    toast('A visita é somente leitura. Faça login para administrar.');
    return false;
  }
  function applyRemote(data, replacePlayer = false) {
    if (data.revision < lastRevision) return;
    lastRevision = data.revision;
    const player = state.player;
    Object.assign(state, E.migrate(data.state));
    if (!replacePlayer) state.player = player;
    paused = data.paused;
    if ($('pause-button')) {
      $('pause-button').textContent = paused ? 'Retomar produção' : 'Pausar produção';
      $('pause-button').title = $('pause-button').textContent;
    }
    if ($('speed-button')) $('speed-button').textContent = state.speed + '×';
    storageAvailable = true;
    dirty = true;
    render(true);
    updateTime();
  }
  async function mutate(action, payload = {}, replacePlayer = false) {
    if (!requireAdmin()) throw Error('Ação reservada ao administrador.');
    applyRemote(await A.command(action, payload), replacePlayer);
  }
  function toast(message) {
    $('toast').textContent = message;
    $('toast').classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $('toast').classList.remove('visible'), 4000);
  }
  function officeToggle() {
    if (!requireAdmin()) return;
    const opening = state.office.status === 'closed';
    openModal(
      opening ? 'Abrir o escritório' : 'Encerrar o expediente',
      opening
        ? '<p class="detail-description">Codex abre a porta e os funcionarios voltam um por um para suas mesas. As tarefas permanecem salvas.</p>'
        : '<p class="detail-description">A equipe vai se despedir e sair um por um. As tarefas ficam aguardando o próximo expediente.</p><p class="detail-note">Uma resposta de IA em andamento precisa terminar antes de fechar. Ordens ainda na fila ficam suspensas e exigem nova autorização.</p>',
      opening ? 'Abrir e receber equipe' : 'Fechar e liberar equipe',
      async () => {
        await mutate(opening ? 'office.open' : 'office.close');
        toast(opening ? 'A equipe está chegando.' : 'Até amanhã! A equipe está saindo.');
      },
    );
  }
  $('office-toggle').onclick = officeToggle;
  function smallTalk(id) {
    const a = agent(id);
    if (!a) return;
    const greetings = E.officeOpen(state)
      ? 'Oi! Bom te ver por aqui. Entre uma tarefa e outra, uma boa conversa ajuda.'
      : 'O expediente esta encerrado. A gente continua quando o escritório abrir.';
    openModal(
      'Conversa com ' + a.name,
      '<p class="detail-note">Conversa do jogo: falas simuladas, sem chamadas de IA.</p>' +
        avatar(a, 'detail-avatar') +
        '<div class="smalltalk-log" id="smalltalk-log" aria-live="polite"><p><b>' +
        esc(a.name) +
        ':</b> ' +
        greetings +
        '</p></div><div class="detail-tabs"><button type="button" data-smalltalk="status" data-colleague="' +
        esc(id) +
        '">Como você está?</button><button type="button" data-smalltalk="work" data-colleague="' +
        esc(id) +
        '">Como vai o trabalho?</button><button type="button" data-smalltalk="coffee" data-colleague="' +
        esc(id) +
        '">Vamos tomar um café?</button></div>',
      null,
      null,
    );
  }
  function avatar(a, extra = '') {
    return `<span class="avatar ${extra}" style="background:${a.color}22;color:${a.color}">${esc(Array.from(a.name)[0]?.toUpperCase() || 'A')}</span>`;
  }
  const agent = (id) => state.agents.find((a) => a.id === id),
    task = (id) => state.tasks.find((t) => t.id === id);
  function today() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  function isOverdue(t) {
    return t.due && t.due < today() && t.status !== 'done';
  }
  function statusText(a) {
    return E.agentStatus(state, a);
  }
  function teamRows(department = '') {
    return state.agents
      .filter((a) =>
        department === 'rest' ? a.rest : !department || E.departmentOf(a) === department,
      )
      .map((a) => {
        const st = statusText(a),
          tasks = state.tasks.filter(
            (t) => t.agent === a.id && !['done', 'review'].includes(t.status),
          );
        return `<button class="team-row" data-agent="${esc(a.id)}">${avatar(a)}<span class="agent-info"><b>${esc(a.name)} <span class="agent-level">N${1 + Math.floor(a.xp / 100)}</span></b><small>${esc(a.role)}</small><span class="energy-track" title="Energia simulada ${Math.floor(a.energy)}%"><i style="width:${a.energy}%;background:${a.energy < 30 ? '#d7ad75' : a.color}"></i></span></span><span class="agent-status ${st.key}" title="${tasks.length} tarefa(s) na fila"><i></i>${st.label}</span></button>`;
      })
      .join('');
  }
  function visibleTasks() {
    return state.tasks.filter(
      (t) =>
        (filter === 'all' || (filter === 'overdue' && isOverdue(t)) || filter === t.status) &&
        (t.title + ' ' + t.description + ' ' + agent(t.agent)?.name)
          .toLocaleLowerCase('pt-BR')
          .includes(search.toLocaleLowerCase('pt-BR')),
    );
  }
  function taskCard(t) {
    const a = agent(t.agent),
      dep = task(t.dependency);
    return `<article class="task-card" tabindex="0" role="button" data-task="${esc(t.id)}" aria-label="${esc(t.title)}, ${E.stages[t.status]}"><div class="task-top"><span class="task-category">${esc(t.category)} · ${t.workRunId ? 'CÓPIA DE TRABALHO' : t.execution?.kind === 'real' ? 'IA REAL' : 'SIMULAÇÃO'}</span><span class="priority ${t.priority}">${{ high: '↑ Alta', normal: '→ Normal', low: '↓ Baixa' }[t.priority]}</span></div><h3>${esc(t.title)}</h3><p>${esc(t.description)}</p>${dep && t.status === 'blocked' ? `<div class="dependency-note">⌁ Aguarda: ${esc(dep.title)}</div>` : ''}<div class="task-flags"><span class="status-badge ${t.status}">${E.stages[t.status]}</span>${t.due ? `<span class="due ${isOverdue(t) ? 'overdue' : ''}">${isOverdue(t) ? 'Atrasada · ' : ''}${esc(t.due.split('-').reverse().join('/'))}</span>` : ''}</div><div class="task-bottom">${avatar(a)}<span>${esc(a.name)}</span><span class="task-progress"><span class="progress-track"><i style="width:${t.progress}%"></i></span>${Math.floor(t.progress)}%</span></div></article>`;
  }
  function eventRows(limit) {
    return (
      state.events
        .slice(0, limit)
        .map(
          (e) =>
            `<div class="activity-row"><span class="activity-symbol">↗</span><div><p><b>${esc(e.name)}</b> ${esc(e.text)}</p><small>${state.seconds - e.time < 60 ? 'agora' : `há ${Math.floor((state.seconds - e.time) / 60)} min simulados`}</small></div></div>`,
        )
        .join('') || '<p class="empty-state">As decisões da equipe aparecerão aqui.</p>'
    );
  }
  function overview() {
    const reviews = projectTasks().filter((t) => t.status === 'review').length;
    $('review-count').textContent = reviews;
    $('management-count').textContent = reviews;
    $('management-count').hidden = !reviews;
    $('working-label').textContent =
      state.tasks.filter((t) => t.status === 'working').length + ' produzindo';
    $('company-name').textContent = state.company;
    const o = state.office,
      labels = {
        open: 'Expediente aberto',
        closed: 'Escritório fechado',
        closing: 'Equipe saindo',
        opening: 'Equipe chegando',
      };
    $('office-status').textContent =
      labels[o.status] +
      (['closing', 'opening'].includes(o.status) ? ' ' + o.cursor + '/' + o.order.length : '');
    $('office-status').dataset.state = o.status;
    const toggle = $('office-toggle');
    toggle.hidden = !A.isAdmin;
    toggle.disabled = ['closing', 'opening'].includes(o.status);
    toggle.textContent =
      o.status === 'closed'
        ? 'Abrir escritório'
        : o.status === 'closing'
          ? 'Fechando...'
          : o.status === 'opening'
            ? 'Abrindo...'
            : 'Fechar escritório';
    $('working-label').textContent = E.officeOpen(state)
      ? state.tasks.filter((t) => t.status === 'working').length + ' produzindo'
      : 'Fora do expediente';
  }
  function render() {
    overview();
    dirty = false;
  }
  function changeView(next) {
    if (next === 'office') {
      $('office-canvas').focus({ preventScroll: true });
      return;
    }
    openScenePanel(next);
  }
  function openModal(title, content, submitLabel, callback, wide = false) {
    managementActive = false;
    $('modal').classList.remove('management-dialog');
    $('cancel-modal').textContent = 'Fechar';
    scenePanel = '';
    $('modal').classList.toggle('wide-modal', wide);
    $('modal-title').textContent = title;
    $('modal-content').innerHTML =
      (managementContext && !content.includes('manage-back') && !content.includes('manage-shell')
        ? managementBack()
        : '') + content;
    $('modal-error').textContent = '';
    $('modal-submit').disabled = false;
    $('modal-submit').hidden = !submitLabel;
    $('modal-submit').textContent = submitLabel || 'Salvar';
    onSubmit = callback;
    if (!$('modal').open) $('modal').showModal();
    $('modal').scrollTop = 0;
    $('modal-content').scrollTop = 0;
  }
  function closeModal() {
    managementActive = false;
    managementContext = false;
    scenePanel = '';
    $('modal').close();
  }
  function refresh() {
    dirty = true;
    render(true);
  }
  function download(name, text, type = 'text/markdown;charset=utf-8') {
    const url = URL.createObjectURL(new Blob([text], { type })),
      a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  // One management destination; advanced tools stay available on request.
  let managementActive = false,
    managementContext = false,
    managementTab = 'home',
    managementQuery = '',
    managementFilter = 'open',
    managementDepartment = 'all';
  const manageLabels = {
    home: 'Visão geral',
    tasks: 'Tarefas',
    reviews: 'Para revisar',
    team: 'Equipe',
    tools: 'Ajustes e IAs',
  };
  function management(tab = 'home') {
    if (!manageLabels[tab] || (!A.isAdmin && tab === 'tools')) tab = 'home';
    managementTab = tab;
    managementContext = true;
    const headings = {
      home: [
        'O que precisa da sua atenção?',
        'Crie uma tarefa, acompanhe a equipe e aprove o que ficou pronto.',
      ],
      tasks: [
        'Todo o trabalho, em um lugar.',
        'Abra uma tarefa para acompanhar o progresso ou conferir a entrega.',
      ],
      reviews: [
        'Sua próxima decisão.',
        'Confira as entregas. Aprove para concluir ou descreva os ajustes.',
      ],
      team: [
        'Quem faz o quê.',
        'Escolha uma pessoa para delegar uma tarefa ou organizar seu trabalho.',
      ],
      tools: [
        'Seu escritório, do seu jeito.',
        'Conexões, contexto e ferramentas ficam aqui quando você precisar.',
      ],
    };
    openModal(
      'Gestão da Firma',
      `<div class="manage-shell"><nav class="manage-nav" aria-label="Gestão do escritório">${Object.entries(
        manageLabels,
      )
        .filter(([key]) => A.isAdmin || key !== 'tools')
        .map(
          ([key, label]) =>
            `<button type="button" data-manage="${key}" aria-current="${key === tab ? 'page' : 'false'}"><span>${label}</span>${key === 'reviews' ? '<b data-manage-reviews></b>' : ''}</button>`,
        )
        .join(
          '',
        )}<button type="button" class="manage-map" data-manage-close>← Voltar ao escritório</button></nav><section class="manage-main" aria-label="${manageLabels[tab]}"><header class="manage-heading"><div><small>ESCRITÓRIO / ${manageLabels[tab].toLocaleUpperCase('pt-BR')}</small><h3>${headings[tab][0]}</h3><p>${headings[tab][1]}</p></div>${A.isAdmin && tab !== 'tools' ? '<button type="button" class="primary-button" data-manage-new>＋ Nova tarefa</button>' : ''}</header>${!A.isAdmin ? '<p class="visitor-note">Visita em tempo real · somente leitura.</p>' : ''}${
        ['tasks', 'reviews', 'team'].includes(tab)
          ? `<div class="manage-toolbar"><label class="manage-search">Buscar ${tab === 'team' ? 'pessoa' : 'tarefa'}<input id="manage-search" type="search" value="${esc(managementQuery)}" placeholder="${tab === 'team' ? 'Nome ou especialidade' : 'Título ou responsável'}" autocomplete="off"></label><label>Setor<select id="manage-department"><option value="all">Todos os setores</option>${Object.entries(
              E.departments,
            )
              .map(
                ([id, d]) =>
                  `<option value="${id}" ${managementDepartment === id ? 'selected' : ''}>${d.name}</option>`,
              )
              .join('')}</select></label>${
              tab === 'tasks'
                ? `<label>Situação<select id="manage-filter">${[
                    ['open', 'Em aberto'],
                    ['all', 'Todas'],
                    ['queued', 'Na fila'],
                    ['working', 'Em andamento'],
                    ['blocked', 'Aguardando outra tarefa'],
                    ['review', 'Para revisar'],
                    ['done', 'Concluídas'],
                    ['overdue', 'Atrasadas'],
                  ]
                    .map(
                      ([id, label]) =>
                        `<option value="${id}" ${managementFilter === id ? 'selected' : ''}>${label}</option>`,
                    )
                    .join('')}</select></label>`
                : ''
            }</div>`
          : ''
      }<div id="manage-live" aria-live="polite"></div></section></div>`,
      null,
      null,
      true,
    );
    managementActive = true;
    $('modal').classList.add('management-dialog');
    $('cancel-modal').textContent = 'Voltar ao escritório';
    renderManagement();
  }
  function managementEmpty(title, description, create = false) {
    return `<div class="manage-empty"><span aria-hidden="true">◇</span><h4>${title}</h4><p>${description}</p>${create && A.isAdmin ? '<button type="button" class="secondary-button" data-manage-new>Criar uma tarefa</button>' : ''}</div>`;
  }
  function managementRows(tasks) {
    return tasks
      .map((t) => {
        const a = agent(t.agent),
          dep = task(t.dependency),
          real = t.execution?.kind === 'real',
          error = t.execution?.status === 'error' || !!t.execution?.error;
        return `<button type="button" class="manage-task" data-task="${esc(t.id)}"><span class="manage-task-mark ${t.status}" aria-hidden="true">${t.status === 'done' ? '✓' : t.status === 'review' ? '!' : '·'}</span><span class="manage-task-name"><b>${esc(t.title)}</b><small>${esc(a?.name || 'Sem responsável')} · ${esc(E.departments[E.taskDepartment(t)].name)} · ${t.workRunId ? 'Cópia de trabalho' : real ? 'IA real' : 'Simulação'}${t.status === 'blocked' && dep ? ' · Aguarda: ' + esc(dep.title) : ''}${error ? ' · Falha na execução' : ''}</small></span><span class="manage-task-end"><span class="status-badge ${t.status}">${t.status === 'blocked' ? 'Aguardando etapa' : t.status === 'done' ? 'Concluída' : t.status === 'review' ? 'Para revisar' : E.stages[t.status]}</span>${t.due ? `<small class="${isOverdue(t) ? 'manage-overdue' : ''}">${isOverdue(t) ? 'Atrasada · ' : ''}${esc(t.due.split('-').reverse().join('/'))}</small>` : `<small>${real ? (t.execution.status === 'running' ? 'IA gerando entrega' : t.status === 'done' ? 'Entrega aprovada' : t.status === 'review' ? 'Entrega pronta' : 'Aguardando execução') : Math.floor(t.progress) + '% concluído'}</small>`}</span><span aria-hidden="true">→</span></button>`;
      })
      .join('');
  }
  function projectTasks() {
    const project = window.FirmaProjects?.current || 'firma';
    return state.tasks.filter((t) => (t.projectId || 'firma') === project);
  }
  function renderManagement() {
    if (!managementActive || !$('modal').open || !$('manage-live')) return;
    const review = projectTasks().filter((t) => t.status === 'review'),
      open = projectTasks().filter((t) => !['done', 'review'].includes(t.status)),
      done = projectTasks().filter((t) => t.status === 'done'),
      working = projectTasks().filter((t) => t.status === 'working');
    const focus = document.activeElement,
      focusedTask = focus?.dataset?.task,
      focusedAgent = focus?.dataset?.agent;
    document.querySelectorAll('[data-manage-reviews]').forEach((el) => {
      el.textContent = review.length;
      el.hidden = !review.length;
    });
    let html = '';
    if (managementTab === 'home') {
      const officeLabels = {
        open: paused ? 'Produção pausada' : 'Equipe trabalhando',
        closed: 'Escritório fechado',
        closing: 'Equipe saindo',
        opening: 'Equipe chegando',
      };
      html = `<div class="manage-summary"><button type="button" data-manage="reviews"><b>${review.length}</b><span>Para revisar</span></button><button type="button" data-manage="tasks" data-manage-scope="open"><b>${open.length}</b><span>Em aberto</span></button><button type="button" data-manage="tasks" data-manage-scope="done"><b>${done.length}</b><span>Concluídas</span></button></div><section class="manage-next"><div><small>PRÓXIMO PASSO</small><h4>${review.length ? 'Confira o que a equipe entregou.' : state.office.status === 'closed' ? 'Abra o escritório para continuar.' : open.length ? 'A equipe já tem trabalho na fila.' : 'Comece com uma tarefa simples.'}</h4><p>${review.length ? 'Sua aprovação conclui a tarefa e libera as próximas etapas.' : state.office.status === 'closed' ? 'As tarefas estão salvas e aguardam o próximo expediente.' : open.length ? working.length + ' tarefa(s) em andamento. Você pode acompanhar os detalhes a qualquer momento.' : 'Descreva o objetivo e escolha um responsável. O restante é opcional.'}</p></div><button type="button" class="secondary-button" ${review.length ? 'data-manage="reviews"' : state.office.status === 'closed' && A.isAdmin ? 'data-action="office-toggle"' : open.length ? 'data-manage="tasks"' : 'data-manage-new'}>${review.length ? 'Revisar entregas' : state.office.status === 'closed' && A.isAdmin ? 'Abrir escritório' : open.length ? 'Ver tarefas' : 'Criar tarefa'} →</button></section><div class="manage-section-heading"><h4>${review.length ? 'Esperando por você' : 'Acompanhe agora'}</h4><button type="button" data-manage="tasks" class="text-button">Ver todas →</button></div><div class="manage-list">${managementRows((review.length ? review : open).slice(0, 4)) || managementEmpty('Sua fila está livre.', 'As próximas tarefas aparecerão aqui.', true)}</div><div class="manage-office"><span class="status-dot"></span><span>${officeLabels[state.office.status]} · ${state.agents.length} pessoas na equipe</span>${A.isAdmin && E.officeOpen(state) ? `<button type="button" class="text-button" data-action="pause">${paused ? 'Retomar produção' : 'Pausar produção'}</button>` : ''}</div>`;
    } else if (managementTab === 'tasks' || managementTab === 'reviews') {
      const query = managementQuery.toLocaleLowerCase('pt-BR');
      const tasks = projectTasks()
        .filter(
          (t) =>
            (managementTab !== 'reviews' || t.status === 'review') &&
            (managementTab === 'reviews' ||
              managementFilter === 'all' ||
              (managementFilter === 'open' && t.status !== 'done') ||
              (managementFilter === 'overdue' && isOverdue(t)) ||
              t.status === managementFilter) &&
            (managementDepartment === 'all' || E.taskDepartment(t) === managementDepartment) &&
            (t.title + ' ' + agent(t.agent)?.name).toLocaleLowerCase('pt-BR').includes(query),
        )
        .sort((a, b) => (a.status === 'review' ? -1 : 0) - (b.status === 'review' ? -1 : 0));
      html = `<div class="manage-section-heading"><h4>${tasks.length} ${tasks.length === 1 ? 'tarefa' : 'tarefas'}</h4>${managementTab === 'tasks' ? '<span>Criar → Acompanhar → Revisar → Concluir</span>' : '<span>Abra uma entrega para decidir.</span>'}</div><div class="manage-list">${managementRows(tasks) || managementEmpty(managementTab === 'reviews' ? 'Nenhuma revisão pendente.' : 'Nenhuma tarefa encontrada.', managementQuery || managementDepartment !== 'all' ? 'Tente outra busca ou selecione todos os setores.' : managementTab === 'reviews' ? 'Quando uma entrega ficar pronta, ela aparecerá aqui.' : 'Crie uma tarefa ou altere a situação selecionada.', managementTab === 'tasks')}</div>`;
    } else if (managementTab === 'team') {
      const members = state.agents.filter(
        (a) =>
          (managementDepartment === 'all' || a.department === managementDepartment) &&
          (a.name + ' ' + a.role)
            .toLocaleLowerCase('pt-BR')
            .includes(managementQuery.toLocaleLowerCase('pt-BR')),
      );
      html = `${A.isAdmin && managementDepartment === 'all' && (!managementQuery || 'codex'.includes(managementQuery.toLowerCase())) ? `<button type="button" class="manage-person manage-codex" data-studio-role="leadership" data-studio-pane="home"><span class="avatar">C</span><span><b>Codex</b><small>Líder da equipe · projetos e programação</small><span class="agent-status">Abrir bancada e conversar</span></span><span>↗</span></button>` : ''}<div class="manage-section-heading"><h4>${members.length} pessoas</h4>${A.isAdmin ? '<button type="button" class="secondary-button" data-action="hire">＋ Contratar</button>' : ''}</div><div class="manage-people">${members.map((a) => `<button type="button" class="manage-person" data-agent="${esc(a.id)}">${avatar(a)}<span><b>${esc(a.name)}</b><small>${esc(a.role)} · ${esc(E.departments[a.department].name)}</small><span class="agent-status ${statusText(a).key}">${esc(statusText(a).label)} · ${projectTasks().filter((t) => t.agent === a.id && t.status !== 'done').length} em aberto</span></span><span aria-hidden="true">→</span></button>`).join('') || managementEmpty('Nenhuma pessoa encontrada.', 'Tente outro nome ou setor.')}</div>`;
    } else {
      html = `<div class="manage-tools"><section><h4>IAs e automações</h4><p>Configure os executores e escolha quando usar IA real.</p><button type="button" data-action="ai-connections">Conectar ou configurar IAs <span>→</span></button><button type="button" data-action="ai-order">Dar uma ordem ao líder Codex <span>→</span></button><button type="button" data-action="ai-flow">Planejar com IAs reais <span>→</span></button></section><section><h4>Projeto e escritório</h4><p>Informações compartilhadas e preferências da simulação.</p><button type="button" data-action="memory">Contexto do projeto <span>→</span></button><button type="button" data-action="meeting">Criar plano de quatro etapas (simulação) <span>→</span></button><button type="button" data-action="settings">Nome, velocidade e backups <span>→</span></button><button type="button" data-action="character">Meu personagem <span>→</span></button><button type="button" data-manage-history>Histórico de decisões <span>→</span></button></section></div><p class="detail-note">Criar tarefas no modo simulado não consome IA. Cada execução real exige sua confirmação antes do envio.</p>`;
    }
    $('manage-live').innerHTML = html;
    if (focusedTask || focusedAgent)
      [...$('manage-live').querySelectorAll('[data-task],[data-agent]')]
        .find((el) =>
          focusedTask ? el.dataset.task === focusedTask : el.dataset.agent === focusedAgent,
        )
        ?.focus({ preventScroll: true });
  }
  function managementBack() {
    return managementContext
      ? '<button type="button" class="text-button manage-back" data-manage="' +
          managementTab +
          '">← Voltar à gestão</button>'
      : '';
  }
  $('management-button').onclick = () => {
    managementQuery = '';
    managementDepartment = 'all';
    management('home');
  };
  document.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.manage) {
      if (b.dataset.manageScope) managementFilter = b.dataset.manageScope;
      managementQuery = '';
      managementDepartment = 'all';
      management(b.dataset.manage);
    }
    if (b.hasAttribute('data-manage-new')) {
      if (A.isAdmin)
        newTask(
          managementDepartment === 'all'
            ? 'research'
            : E.departments[managementDepartment].template,
        );
    }
    if (b.hasAttribute('data-manage-close')) closeModal();
    if (b.hasAttribute('data-manage-history'))
      openModal('Histórico de decisões', managementBack() + eventRows(40), null, null, true);
  });
  $('modal-content').addEventListener('input', (e) => {
    if (e.target.id === 'manage-search') {
      managementQuery = e.target.value;
      renderManagement();
    }
  });
  $('modal-content').addEventListener('change', (e) => {
    if (e.target.id === 'manage-filter') managementFilter = e.target.value;
    else if (e.target.id === 'manage-department') managementDepartment = e.target.value;
    else return;
    renderManagement();
  });

  function newTask(key = 'research', assigned = '') {
    if (!requireAdmin()) return;
    const taskProject = window.FirmaProjects?.current || 'firma';
    selectedTemplate = Object.hasOwn(E.templates, key) ? key : 'research';
    const p = E.templates[selectedTemplate];
    openModal(
      'Nova tarefa',
      managementBack() +
        `<p class="dialog-intro">Diga o que precisa ser feito. Nós sugerimos quem pode cuidar disso.</p><div class="form-grid"><label>Tipo de trabalho<select name="template" id="quick-template">${Object.entries(
          E.templates,
        )
          .map(
            ([id, t]) =>
              `<option value="${id}" ${id === selectedTemplate ? 'selected' : ''}>${esc(t.name)}</option>`,
          )
          .join(
            '',
          )}</select></label><label>Responsável<select name="agent" id="quick-agent"></select></label></div><label>O que você precisa?<input name="title" required maxlength="100" placeholder="Ex.: Pesquisar ideias para meu novo aplicativo"></label><label>Explique a tarefa<textarea name="description" required maxlength="3000" placeholder="Qual é o objetivo? O que você espera receber? Inclua links e informações úteis."></textarea></label><label>Como executar?<select name="executionMode"><option value="simulation">Simulação local · sem consumo de IA</option><option value="real">IA real · confirmar conexão e envio depois</option></select></label><details class="manage-advanced"><summary>Prazo, prioridade e detalhes da entrega</summary><div class="form-grid"><label>Prioridade<select name="priority"><option value="normal">Normal</option><option value="high">Alta</option><option value="low">Baixa</option></select></label><label>Prazo (opcional)<input type="date" name="due"></label></div><label>Aguardar outra tarefa<select name="dependency"><option value="">Não depende de outra tarefa</option>${projectTasks()
          .map((t) => `<option value="${esc(t.id)}">${esc(t.title)}</option>`)
          .join(
            '',
          )}</select></label><label>Entrega esperada<textarea name="output" maxlength="1500">${esc(p.output)}</textarea></label><label>Critérios para aprovar<textarea name="criteria" maxlength="2000">${esc(p.criteria)}</textarea></label></details><p class="detail-note">A tarefa só termina quando você aprovar a entrega em <b>Para revisar</b>.</p>`,
      'Criar tarefa',
      async (data) => {
        const before = new Set(state.tasks.map((t) => t.id));
        await mutate('task.create', {
          ...Object.fromEntries(data),
          projectId: taskProject,
          template: selectedTemplate,
        });
        const created = state.tasks.find((t) => !before.has(t.id));
        if (data.get('executionMode') === 'real') {
          await window.FirmaAI.queue(created.id);
          return;
        }
        managementFilter = 'open';
        managementQuery = '';
        managementDepartment = 'all';
        management('tasks');
        toast('Tarefa criada. Acompanhe por aqui.');
      },
      true,
    );
    function updateAssignee(preferred = '') {
      const template = E.templates[selectedTemplate],
        recommended = E.recommend(state, selectedTemplate),
        members = state.agents.filter((a) => E.departmentOf(a) === template.department);
      $('quick-agent').innerHTML =
        members
          .map(
            (a) =>
              `<option value="${esc(a.id)}" ${a.id === (preferred || recommended?.id) ? 'selected' : ''}>${esc(a.name)}${a.id === recommended?.id ? ' · sugerido' : ''}</option>`,
          )
          .join('') || '<option value="">Contrate alguém neste setor</option>';
      $('quick-agent').required = true;
      $('modal-submit').disabled = !members.length;
    }
    updateAssignee(assigned);
    $('quick-template').onchange = (e) => {
      const previous = E.templates[selectedTemplate];
      selectedTemplate = e.target.value;
      const next = E.templates[selectedTemplate];
      for (const field of ['output', 'criteria']) {
        const input = $('modal-form').elements[field];
        if (input.value === previous[field]) input.value = next[field];
      }
      updateAssignee();
    };
  }

  function taskDetail(id) {
    const t = task(id);
    if (!t) return;
    if (!A.isAdmin) {
      visitorTask(t);
      return;
    }
    const a = agent(t.agent),
      dep = task(t.dependency),
      review = t.status === 'review',
      real = t.execution?.kind === 'real';
    openModal(
      t.title,
      managementBack() +
        `${window.FirmaProjects && t.projectId !== 'firma' ? `<div class="detail-tabs"><button type="button" class="secondary-button" ${t.workRunId ? 'data-company-run="' + esc(t.workRunId) + '"' : 'data-company-task="' + esc(t.id) + '"'}>Abrir cópia de trabalho</button></div>` : ''}<div class="task-detail-meta"><span class="status-badge ${t.status}">${review ? 'Para revisar' : E.stages[t.status]}</span><span>${esc(a?.name)}${real ? '' : ' · ' + Math.floor(t.progress) + '%'}</span><span>${t.workRunId ? 'Cópia de trabalho' : real ? 'IA real' : 'Simulação local'}</span></div>${t.status === 'blocked' ? `<p class="detail-note">Aguarda sua aprovação em <b>${esc(dep?.title || 'uma tarefa anterior')}</b>.</p>` : ''}${t.result ? `<section class="manage-delivery"><h3>Entrega ${t.workRunId ? 'da cópia' : real ? 'da IA' : 'simulada'}</h3><p>${t.workRunId ? 'Confira os arquivos integrados e as evidências na execução antes de aprovar.' : real ? 'Confira o conteúdo antes de aprovar. Código e testes propostos não foram executados.' : 'Este conteúdo foi criado pelo simulador local.'}</p><pre>${esc(t.result)}</pre><button type="button" class="text-button" data-download="${esc(id)}">↓ Baixar entrega (.md)</button></section>` : `<p class="detail-description">${esc(t.description)}</p><p class="detail-note">${t.status === 'done' ? 'Tarefa concluída.' : 'A entrega aparecerá aqui quando o trabalho ficar pronto.'}</p>`}${review ? `<div class="review-box"><h3>Está tudo certo com a entrega?</h3><p>Aprove no botão abaixo ou descreva o que precisa mudar.</p><details class="manage-advanced"><summary>Pedir ajustes à equipe</summary><label>O que precisa mudar?<textarea id="revision-feedback" maxlength="2000" placeholder="Descreva o ajuste com clareza."></textarea></label><button type="button" class="secondary-button" data-revise="${esc(id)}">Enviar pedido de ajustes</button></details></div>` : ''}<details class="manage-advanced"><summary>Briefing e critérios de aprovação</summary><p class="detail-description">${esc(t.description)}</p><h3 class="detail-subtitle">Entrega esperada</h3><p>${esc(t.output)}</p><h3 class="detail-subtitle">Critérios para aprovar</h3><p>${esc(t.criteria)}</p><h3 class="detail-subtitle">Contexto</h3><p>${esc(t.context || 'Sem contexto adicional.')}</p><div class="workflow-steps">${t.steps.map((s, i) => `<div class="workflow-step"><span>${i + 1}</span>${esc(s)}</div>`).join('')}</div><button type="button" class="text-button" data-contract="${esc(id)}">↓ Exportar briefing (.json)</button></details>${!['done', 'review'].includes(t.status) ? `<details class="manage-advanced"><summary>Responsável e prioridade</summary>${assignmentFields(t)}</details><details class="manage-advanced"><summary>Executar com IA real</summary><p>${real ? 'Estado: ' + esc(t.execution.status) : 'Você confirma a conexão, a ordem e o possível consumo antes do envio.'}</p>${t.execution?.error ? `<p role="alert">${esc(t.execution.error)}</p>` : ''}<button type="button" class="secondary-button" data-ai-task="${esc(id)}">${['running', 'pending', 'ready'].includes(t.execution?.status) ? 'Acompanhar ou cancelar execução' : 'Preparar envio à IA'}</button></details>` : ''}`,
      review ? 'Aprovar entrega' : t.status === 'done' ? null : 'Salvar alterações',
      async (data) => {
        if (review) {
          await mutate('task.approve', { id });
          toast('Entrega aprovada.');
          if (managementContext) management('reviews');
        } else {
          await mutate('task.assign', {
            id,
            agent: data.get('agent'),
            priority: data.get('priority'),
          });
          toast('Tarefa atualizada.');
          if (managementContext) management('tasks');
        }
      },
      true,
    );
  }
  function assignmentFields(t) {
    return `<div class="form-grid"><label>Responsável<select name="agent">${state.agents
      .filter((a) => E.departmentOf(a) === E.taskDepartment(t) || a.id === t.agent)
      .map(
        (a) =>
          `<option value="${esc(a.id)}" ${a.id === t.agent ? 'selected' : ''}>${esc(a.name)}</option>`,
      )
      .join('')}</select></label><label>Prioridade<select name="priority">${[
      ['high', 'Alta'],
      ['normal', 'Normal'],
      ['low', 'Baixa'],
    ]
      .map(([v, n]) => `<option value="${v}" ${t.priority === v ? 'selected' : ''}>${n}</option>`)
      .join('')}</select></label></div>`;
  }

  function agentDetail(id) {
    const a = agent(id);
    if (!a) return;
    if (!A.isAdmin) {
      visitorAgent(a);
      return;
    }
    const st = statusText(a),
      tasks = projectTasks().filter((t) => t.agent === id && t.status !== 'done');
    openModal(
      a.name,
      managementBack() +
        `<div class="agent-detail-head">${avatar(a, 'detail-avatar')}<div><b>${esc(a.role)}</b><p>${esc(E.departments[a.department].name)} · ${st.label} · Energia ${Math.floor(a.energy)}%</p></div></div><div class="detail-tabs"><button type="button" class="primary-button" data-studio-agent="${esc(id)}">Abrir conversa de trabalho ↗</button><button type="button" data-assign="${esc(id)}">＋ Nova tarefa para ${esc(a.name)}</button><button type="button" data-agent-smalltalk="${esc(id)}">Conversar com o colega</button></div><h3 class="detail-subtitle">Tarefas em aberto (${tasks.length})</h3><div class="manage-list">${managementRows(tasks) || '<p class="dialog-intro">Pronto para receber uma nova tarefa.</p>'}</div><details class="manage-advanced"><summary>Especialidade e instruções de trabalho</summary><label>Setor<select id="agent-department">${Object.entries(
          E.departments,
        )
          .map(
            ([key, d]) =>
              `<option value="${key}" ${key === a.department ? 'selected' : ''}>${d.name}</option>`,
          )
          .join(
            '',
          )}</select></label><label>Instruções<textarea id="agent-instructions" maxlength="2000">${esc(a.instructions)}</textarea></label><button type="button" class="secondary-button" data-save-instructions="${esc(id)}">Salvar instruções</button><button type="button" class="text-button" data-agent-chat="${esc(id)}">Dar uma ordem à IA real</button></details>`,
      a.rest ? 'Retomar trabalho' : 'Fazer uma pausa',
      async () => {
        await mutate('agent.pause', { id });
        if (managementContext) management('team');
      },
    );
  }

  function templateChooser() {
    if (!requireAdmin()) return;
    openModal(
      'Nova missão · ' + E.departments[selectedDepartment].name,
      `<p class="dialog-intro">Escolha o trabalho desta sala. A fila respeita a capacidade dos agentes.</p><div class="template-grid">${Object.entries(
        E.templates,
      )
        .filter(([, template]) => template.department === selectedDepartment)
        .map(
          ([key, p]) =>
            `<button type="button" class="template-option" data-template="${key}"><span>${p.icon}</span><b>${p.name}</b><small>${esc(p.output)}</small></button>`,
        )
        .join('')}</div>`,
      null,
      null,
      true,
    );
  }
  function hire() {
    if (!requireAdmin()) return;
    if (state.agents.length >= 24) {
      toast('O escritório comporta até 24 agentes nesta versão.');
      return;
    }
    openModal(
      'Um novo especialista na equipe',
      `<label>Nome<input name="name" required maxlength="25" placeholder="Como ele vai se chamar?"></label><label>Especialidade<input name="role" required maxlength="60" placeholder="Ex.: Pesquisador de mercado"></label><label>Sala de trabalho<select name="department">${Object.entries(
        E.departments,
      )
        .map(
          ([id, d]) =>
            `<option value="${id}" ${id === selectedDepartment ? 'selected' : ''}>${d.number} · ${d.name}</option>`,
        )
        .join(
          '',
        )}</select></label><label>Instruções de trabalho<textarea name="instructions" maxlength="2000">Trabalhe com clareza, registre limitações e peça revisão antes de encerrar.</textarea></label><p class="detail-note">Este funcionário usa o simulador local. As instruções ficam registradas para uma futura conexão com um executor de IA.</p>`,
      'Contratar',
      async (data) => {
        await mutate('agent.hire', Object.fromEntries(data));
        toast(data.get('name').trim() + ' chegou ao escritório.');
      },
    );
  }
  function meeting() {
    if (!requireAdmin()) return;
    if (window.FirmaProjects) return FirmaProjects.open('plans');
    openModal(
      'Codex · planejar uma entrega',
      `<p class="dialog-intro">Dê um objetivo ao líder. O plano vira quatro missões, com responsáveis por sala e aprovação humana entre as etapas.</p><label>O que vamos construir e divulgar?<textarea name="goal" required maxlength="200" placeholder="Ex.: Criar e apresentar uma plataforma de estudos acessível"></textarea></label><div class="workflow-road"><span>01 Planejar</span><span>02 Desenvolver</span><span>03 Testar</span><span>04 Postar</span></div><p class="detail-note">Codex é o líder representado no jogo. A coordenação usa regras locais; nenhum modelo de IA, teste real ou postagem em rede social é executado nesta versão.</p>`,
      'Criar fluxo de quatro etapas',
      async (data) => {
        await mutate('meeting', { goal: data.get('goal') });
        openScenePanel('tasks');
        toast('Plano distribuído entre as quatro salas.');
      },
      true,
    );
  }
  function memory() {
    if (!requireAdmin()) return;
    if (window.FirmaProjects) return FirmaProjects.open('memory');
    openModal(
      'O contexto que acompanha a equipe',
      `<label>Sobre a empresa e o projeto<textarea name="memory" class="large-textarea" maxlength="12000" placeholder="Objetivos, público, tom de voz, restrições e decisões aprovadas…">${esc(state.memory)}</textarea></label><p class="detail-note">Este texto será copiado para novas tarefas. As tarefas já criadas preservam o contexto do momento da delegação.</p>`,
      'Salvar contexto',
      async (data) => {
        await mutate('memory', { memory: data.get('memory') });
        toast('Contexto atualizado para as próximas missões.');
      },
      true,
    );
  }
  function chat(id) {
    if (requireAdmin()) return window.FirmaAI.agentOrder(id);
  }
  function help() {
    openModal(
      'Sua Firma, dentro do jogo',
      `<div class="guide-steps"><div><b>01</b><span><strong>Abra a Gestão</strong><p>Use o botão Gestão no topo para criar tarefas, acompanhar a equipe e revisar entregas. Clique nos computadores para abrir cada função sem caminhar. WASD/setas e clique no chão continuam disponíveis para explorar.</p></span></div><div><b>02</b><span><strong>Use os terminais</strong><p>Aproxime-se e aperte E. Cada sala reúne seu trabalho e seus especialistas.</p></span></div><div><b>03</b><span><strong>Converse com Codex</strong><p>Clique no Codex para abrir o chat. Sua mesa fica na mesma sala do Codex, ao lado da dele, com as ferramentas de desenvolvimento.</p></span></div><div><b>04</b><span><strong>Revise cada entrega</strong><p>Uma etapa só libera a próxima depois da sua aprovação. A coordenação, os testes e as postagens são simulados.</p></span></div></div><div class="shortcut-list"><span><kbd>WASD</kbd> Andar</span><span><kbd>E</kbd> Interagir</span><span><kbd>1–5</kbd> Visitar sala</span><span><kbd>?</kbd> Guia</span></div>`,
      A.isAdmin ? 'Entrar na Firma' : null,
      A.isAdmin
        ? async () => {
            await mutate('onboard');
          }
        : null,
      true,
    );
  }
  function settings() {
    if (!requireAdmin()) return;
    openModal(
      'Preferências e dados do escritório',
      `<label>Nome do escritório<input name="company" required maxlength="40" value="${esc(state.company)}"></label><label>Velocidade<select name="speed">${[1, 2, 4].map((n) => `<option value="${n}" ${state.speed === n ? 'selected' : ''}>${n}×</option>`).join('')}</select></label><div class="detail-tabs"><button type="button" data-action="backup">↓ Exportar backup</button><button type="button" data-action="import">↑ Restaurar backup</button></div><p class="detail-note">${storageAvailable ? 'Salvamento no servidor.' : 'Conexão indisponível: tente novamente antes de alterar os dados.'} Ao restaurar um backup, você verá um resumo antes de substituir os dados. A equipe avança enquanto o servidor está ligado, mesmo sem abas abertas.</p>`,
      'Salvar preferências',
      async (data) => {
        await mutate('settings', {
          company: data.get('company'),
          speed: Number(data.get('speed')),
        });
        toast('Preferências salvas.');
      },
    );
  }
  function commands() {
    openModal(
      'Mapa do escritório',
      `<p class="dialog-intro">Escolha uma sala para caminhar até o terminal.</p><div class="command-list">${window.FirmaWorld.rooms.map((room) => `<button type="button" data-room-hop="${room.id}"><span>${room.number} · ${room.name}</span><span>→</span></button>`).join('')}</div>`,
      null,
      null,
    );
  }
  function customize() {
    if (!requireAdmin()) return;
    const p = state.player;
    openModal(
      'Seu personagem na Firma',
      `<p class="dialog-intro">Você também faz parte do escritório. Escolha como quer aparecer no jogo.</p><div class="avatar-preview" aria-hidden="true"><span class="pixel-avatar" style="--shirt:${p.color};--skin:${p.skin};--hair:${p.hair}"><i></i></span><span>FUNDADOR · PERSONAGEM JOGÁVEL</span></div><label>Seu nome<input name="playerName" maxlength="20" required value="${esc(p.name)}" placeholder="Como quer ser chamado?"></label><div class="appearance-options"><label>Camiseta<input type="color" name="playerColor" value="${p.color}"></label><label>Tom de pele<input type="color" name="playerSkin" value="${p.skin}"></label><label>Cabelo<input type="color" name="playerHair" value="${p.hair}"></label></div><p class="detail-note">Ande com WASD ou setas. Clique no chão para caminhar até um ponto. Aproxime-se dos objetos ou agentes e aperte E para interagir.</p>`,
      'Entrar com este personagem',
      async (data) => {
        const name = data.get('playerName').trim();
        if (!name) throw Error('Digite um nome para seu personagem.');
        await mutate(
          'player',
          {
            ...state.player,
            name,
            color: data.get('playerColor'),
            skin: data.get('playerSkin'),
            hair: data.get('playerHair'),
          },
          true,
        );
        window.dispatchEvent(new Event('firma-player-changed'));
        toast('Personagem atualizado. Bem-vindo à Firma!');
      },
    );
  }
  function visitorHelp() {
    openModal(
      'Bem-vindo à Firma',
      `<p class="visitor-note">Você está visitando o escritório em modo somente leitura. Acompanhe os agentes e as missões públicas; a administração fica com o proprietário.</p><p class="dialog-intro">Ande com WASD/setas ou clique no chão. Aperte E perto de um colega ou objeto. As informações são atualizadas pelo servidor.</p><div class="command-list"><button type="button" data-scene-panel="tasks">▤ Acompanhar produção</button><button type="button" data-scene-panel="team">☕ Conhecer a equipe</button><button type="button" data-action="login">↗ Login do administrador</button></div>`,
      null,
      null,
      true,
    );
  }
  function visitorAgent(a) {
    const status = statusText(a);
    openModal(
      a.name,
      `<div class="agent-detail-head">${avatar(a, 'detail-avatar')}<div><b>${esc(a.role)}</b><p>${esc(status.label)}</p></div></div><div class="agent-metrics"><span>Energia <b>${Math.floor(a.energy)}%</b></span><span>Experiência <b>${a.xp} XP</b></span><span>Executor <b>Simulado</b></span></div><p class="visitor-note">Visita em tempo real. Instruções, conversas e decisões são reservadas ao administrador.</p>${state.tasks
        .filter((t) => t.agent === a.id)
        .map(
          (t) =>
            `<button type="button" class="task-link" data-task="${esc(t.id)}">${esc(t.title)} <span>${E.stages[t.status]} ↗</span></button>`,
        )
        .join('')}`,
      null,
      null,
      true,
    );
  }
  function visitorTask(t) {
    openModal(
      t.title,
      `<div class="task-detail-meta"><span class="status-badge ${t.status}">${E.stages[t.status]}</span><span>${esc(agent(t.agent)?.name)} · ${Math.floor(t.progress)}%</span></div><p class="visitor-note">Você pode acompanhar o andamento desta missão. O briefing, os documentos e as ações de revisão pertencem ao administrador.</p><div class="workflow-steps">${t.steps.map((step, i) => `<div class="workflow-step ${t.progress >= ((i + 1) / t.steps.length) * 100 ? 'complete' : ''}"><span>${i + 1}</span>${esc(step)}</div>`).join('')}</div>`,
      null,
      null,
      true,
    );
  }
  function roomTasks(department) {
    return state.tasks.filter(
      (t) =>
        E.taskDepartment(t) === department &&
        (roomFilter === 'all' ||
          (roomFilter === 'open' && t.status !== 'done') ||
          t.status === roomFilter),
    );
  }
  function sceneContent(kind) {
    if (kind === 'admin')
      return A.isAdmin
        ? `<div class="room-intro"><div><h3>Sua mesa junto ao Codex</h3><p>Uma mesa exclusiva, conectada às mesmas ferramentas e ao Codex de desenvolvimento. Clique para usar sem deslocar seu personagem.</p></div><span class="room-number">07</span></div><div class="scene-board-actions"><button type="button" class="primary-button" data-studio-role="admin" data-studio-pane="code">⌘ Abrir minha mesa · código ao vivo</button><button type="button" class="secondary-button" data-studio-role="admin" data-studio-pane="chat">Chat de desenvolvimento · Codex</button><button type="button" class="secondary-button" data-studio-role="admin" data-studio-pane="tasks">Encaminhar funções</button><button type="button" class="secondary-button" data-studio-role="admin" data-studio-pane="terminal">Terminal local</button><button type="button" class="secondary-button" data-studio-role="leadership" data-studio-pane="chat">Dar uma função ao líder Codex</button><button type="button" class="secondary-button" data-action="ai-connections">Conectar IAs reais</button><button type="button" class="secondary-button" data-action="memory">Contexto do projeto</button></div><p class="detail-note">O mesmo histórico de desenvolvimento, as mesmas missões e os mesmos limites. Nenhuma chamada de IA acontece apenas por abrir a mesa.</p>`
        : '<p class="visitor-note">Mesa compartilhada com Codex. Chat, arquivos, missões e terminal são reservados ao proprietário.</p>';
    if (kind === 'leadership' || kind === 'owner') return ''; // Routed to management above.

    if (E.departments[kind]) {
      const department = E.departments[kind],
        members = state.agents.filter((a) => a.department === kind),
        tasks = roomTasks(kind),
        all = state.tasks.filter((t) => E.taskDepartment(t) === kind);
      return `<div class="room-intro" style="--room-accent:${department.color}"><div><h3>Sala de ${department.name}</h3><p>${department.description}</p></div><span class="room-number">${department.number}</span></div><div class="room-capacity"><span>${members.length} especialistas</span><span>${all.filter((t) => t.status === 'working').length} produzindo</span><span>${all.filter((t) => t.status === 'review').length} para revisar</span></div>${A.isAdmin ? `<div class="scene-board-actions"><button type="button" class="primary-button" data-template="${department.template}">＋ ${kind === 'publishing' ? 'Preparar postagem' : 'Nova missão'}</button>${kind === 'planning' ? '<button type="button" class="secondary-button" data-action="memory">Contexto do projeto</button>' : ''}<button type="button" class="secondary-button" data-room-hop="leadership">Conversar com Codex →</button></div>` : '<p class="visitor-note">Acompanhamento público · somente leitura. Briefings e documentos são privados.</p>'}<div class="room-filter">${[
        ['all', 'Todas'],
        ['open', 'Em aberto'],
        ['review', 'Para revisar'],
        ['done', 'Aprovadas'],
      ]
        .map(
          ([key, label]) =>
            `<button type="button" data-room-filter="${key}" class="${roomFilter === key ? 'active' : ''}">${label}</button>`,
        )
        .join(
          '',
        )}</div><div class="room-task-list">${tasks.map(taskCard).join('') || '<p class="empty-state">Ainda não há missões nesta seleção. Os trabalhos desta etapa aparecerão aqui.</p>'}</div><h3 class="room-subtitle">Especialistas desta sala</h3><div class="room-team">${members.length ? teamRows(kind) : '<p class="empty-state">Sala pronta para receber um especialista. Contrate na sala do líder.</p>'}</div>`;
    }
    if (kind === 'memory')
      return A.isAdmin
        ? `<div class="memory-content"><pre>${esc(state.memory)}</pre><button type="button" class="primary-button" data-action="memory">Editar contexto</button></div>`
        : '<p class="visitor-note">O contexto é reservado ao administrador.</p>';
    if (kind === 'rest')
      return (
        '<div class="room-intro"><div><h3>Cantinho do café</h3><p>Um pequeno lugar para recuperar energia e conversar.</p></div></div><p class="detail-note">As conversas e as rotinas dos personagens são simuladas. Nenhuma chamada de IA é feita aqui.</p><button type="button" class="primary-button" data-action="rest-sit">Sentar no meu banco</button><h3 class="room-subtitle">Colegas em pausa</h3>' +
        teamRows('rest')
      );
    if (kind === 'team')
      return `<p class="dialog-intro">Especialistas distribuídos por sala. Selecione um colega para acompanhar ou organizar seu trabalho.</p>${Object.entries(
        E.departments,
      )
        .map(([id, d]) => `<h3 class="room-subtitle">${d.number} · ${d.name}</h3>${teamRows(id)}`)
        .join(
          '',
        )}${A.isAdmin ? '<button type="button" class="primary-button" data-action="hire">＋ Contratar especialista</button>' : ''}`;
    if (kind === 'activity')
      return A.isAdmin
        ? `<div class="scene-history">${eventRows(40)}</div>`
        : '<p class="visitor-note">O histórico detalhado é reservado ao administrador. Acompanhe o estado público nas salas.</p>';
    const tasks = state.tasks.filter(
      (t) =>
        (kind !== 'reviews' || t.status === 'review') &&
        (boardDepartment === 'all' || E.taskDepartment(t) === boardDepartment),
    );
    return `<p class="dialog-intro">${kind === 'reviews' ? 'A revisão humana libera a próxima etapa.' : 'Planejar → Desenvolver → Testar → Postar. Cada sala tem sua fila e seus responsáveis.'}</p><div class="room-filter">${[['all', 'Todas as salas'], ...Object.entries(E.departments).map(([id, d]) => [id, d.name])].map(([id, name]) => `<button type="button" data-board-filter="${id}" class="${boardDepartment === id ? 'active' : ''}">${name}</button>`).join('')}</div><div class="room-task-list">${tasks.map(taskCard).join('') || '<p class="empty-state">Nenhuma missão nesta seleção.</p>'}</div>`;
  }
  function openScenePanel(kind) {
    if (E.departments[kind]) {
      selectedDepartment = kind;
      managementDepartment = kind;
      managementQuery = '';
      managementFilter = 'open';
      management('tasks');
      return;
    }
    const destinations = {
      leadership: 'home',
      owner: 'home',
      tasks: 'tasks',
      reviews: 'reviews',
      team: 'team',
    };
    if (destinations[kind]) {
      management(destinations[kind]);
      return;
    }
    const names = {
      rest: 'Cantinho do café',
      admin: 'Sua mesa junto ao Codex',
      tasks: 'Fluxo de trabalho',
      reviews: 'Entregas para revisão',
      team: 'Equipe da Firma',
      memory: 'Contexto compartilhado',
      activity: 'Histórico de decisões',
      owner: 'Codex · líder da Firma',
      leadership: 'Codex · líder da Firma',
      ...Object.fromEntries(
        Object.entries(E.departments).map(([id, d]) => [id, 'Sala de ' + d.name]),
      ),
    };
    if (!names[kind]) return;
    if (E.departments[kind]) selectedDepartment = kind;
    roomFilter = 'all';
    openModal(names[kind], sceneContent(kind), null, null, true);
    scenePanel = kind;
  }
  function renderScene() {
    if (managementActive) {
      renderManagement();
      return;
    }
    if (!scenePanel || !$('modal').open) return;
    const expanded = $('modal-content').querySelector('[data-leader-settings]')?.open,
      focus = document.activeElement,
      id = focus?.dataset?.task || focus?.dataset?.agent;
    $('modal-content').innerHTML = sceneContent(scenePanel);
    if (expanded)
      $('modal-content').querySelector('[data-leader-settings]')?.setAttribute('open', '');
    if (id)
      [...$('modal-content').querySelectorAll('[data-task],[data-agent]')]
        .find((el) => el.dataset.task === id || el.dataset.agent === id)
        ?.focus({ preventScroll: true });
  }
  function interact(station) {
    openScenePanel(station.id);
  }
  const actions = {
    'office-toggle': officeToggle,
    'rest-sit': () => {
      closeModal();
      window.FirmaGame.sit('rest');
    },
    'ai-connections': () => window.FirmaAI.open(),
    'ai-order': () => window.FirmaAI.order(),
    'ai-flow': () => window.FirmaAI.flow(),
    'new-task': () => newTask(E.departments[selectedDepartment].template),
    meeting,
    memory,
    help,
    commands,
    settings,
    hire,
    character: customize,
    login: () => A.login(),
    pause: async () => {
      await mutate('simulation', { paused: !paused });
      renderScene();
    },
    speed: async () => {
      await mutate('settings', {
        company: state.company,
        speed: state.speed === 1 ? 2 : state.speed === 2 ? 4 : 1,
      });
      renderScene();
    },
    reviews: () => openScenePanel('reviews'),
    backup: async () => {
      if (!requireAdmin()) return;
      const backup = await A.backup();
      download(
        'firma-backup-' + today() + '.json',
        JSON.stringify(backup, null, 2),
        'application/json',
      );
      toast('Backup exportado. Guarde-o para restaurar depois.');
    },
    import: () => {
      if (requireAdmin()) $('import-file').click();
    },
  };
  document.addEventListener('click', (e) => {
    const button = e.target.closest('button');
    if (!button) return;
    if (button.dataset.scenePanel) openScenePanel(button.dataset.scenePanel);
    if (button.dataset.roomHop) {
      closeModal();
      window.FirmaGame.openStation(button.dataset.roomHop);
    }
    if (button.dataset.roomFilter) {
      roomFilter = button.dataset.roomFilter;
      renderScene();
    }
    if (button.dataset.boardFilter) {
      boardDepartment = button.dataset.boardFilter;
      renderScene();
    }
  });
  $('modal-content').addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.task-card')) {
      e.preventDefault();
      taskDetail(e.target.dataset.task);
    }
  });
  document.addEventListener('click', async (e) => {
    const b = e.target.closest('button, [data-task]');
    if (!b) return;
    try {
      if (b.dataset.view) {
        if (b.dataset.close) closeModal();
        changeView(b.dataset.view);
      }
      if (b.dataset.action) await actions[b.dataset.action]?.();
      if (b.dataset.template) newTask(b.dataset.template);
      if (b.dataset.agent) agentDetail(b.dataset.agent);
      if (b.dataset.task) taskDetail(b.dataset.task);
      if (b.dataset.agentSmalltalk) smallTalk(b.dataset.agentSmalltalk);
      if (b.dataset.smalltalk) {
        const a = agent(b.dataset.colleague),
          answers = {
            status:
              'Estou com ' +
              Math.floor(a.energy) +
              '% de energia. Gosto de fazer uma pausa curta e voltar com a cabeça fresca.',
            work:
              'Minha especialidade é ' +
              a.role +
              '. Tenho ' +
              state.tasks.filter((t) => t.agent === a.id && !['done', 'review'].includes(t.status))
                .length +
              ' tarefas em aberto. Vamos por partes!',
            coffee: 'Boa ideia! O cantinho do café esta logo ali. Ate uma pausa pequena faz bem.',
          };
        const p = document.createElement('p');
        p.textContent = a.name + ': ' + answers[b.dataset.smalltalk];
        $('smalltalk-log').append(p);
      }
      if (b.dataset.agentChat) await chat(b.dataset.agentChat);
      if (b.dataset.assign) {
        const member = agent(b.dataset.assign);
        newTask(E.departments[member.department].template, member.id);
      }
      if (b.dataset.saveInstructions) {
        await mutate('agent.instructions', {
          id: b.dataset.saveInstructions,
          instructions: $('agent-instructions').value,
          department: $('agent-department').value,
        });
        toast('Instruções salvas.');
      }
      if (b.dataset.chatPrompt) {
        $('chat-message').value = b.dataset.chatPrompt;
        $('modal-form').requestSubmit();
      }
      if (b.dataset.download && requireAdmin())
        download('firma-entrega.md', task(b.dataset.download).result);
      if (b.dataset.contract && requireAdmin())
        download(
          'firma-briefing.json',
          JSON.stringify(E.contract(state, task(b.dataset.contract)), null, 2),
          'application/json',
        );
      if (b.dataset.revise) {
        await mutate('task.revise', {
          id: b.dataset.revise,
          feedback: $('revision-feedback').value,
        });
        if (managementContext) management('reviews');
        else closeModal();
        toast('Feedback registrado. A missão voltou à produção.');
      }
    } catch (err) {
      if ($('modal').open) $('modal-error').textContent = err.message;
      else toast(err.message);
    }
  });
  let submitting = false;
  $('modal-form').onsubmit = async (e) => {
    e.preventDefault();
    if (!onSubmit || submitting) return;
    submitting = true;
    $('modal-submit').disabled = true;
    $('modal-error').textContent = '';
    try {
      const submitted = onSubmit;
      if (submitted && (await submitted(new FormData(e.target))) === false) return;
      if (onSubmit === submitted) closeModal();
    } catch (err) {
      $('modal-error').textContent = err.message;
    } finally {
      submitting = false;
      $('modal-submit').disabled = false;
    }
  };
  $('close-modal').onclick = $('cancel-modal').onclick = closeModal;
  $('modal').addEventListener('click', (e) => {
    if (e.target === $('modal')) {
      const r = $('modal').getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)
        closeModal();
    }
  });
  $('import-file').onchange = async (e) => {
    if (!requireAdmin()) return;
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      if (file.size > 3_000_000) throw Error('Use um backup de até 3 MB.');
      const imported = E.migrate(JSON.parse(await file.text()));
      openModal(
        'Restaurar este escritório?',
        `<p class="detail-description"><b>${esc(imported.company)}</b><br>${imported.agents.length} agentes · ${imported.tasks.length} tarefas · ${imported.tasks.filter((t) => t.status === 'done').length} aprovadas.</p><p class="detail-note">A restauração substitui os dados compartilhados deste escritório. Exporte seu escritório atual antes de continuar se quiser preservá-lo.</p><button type="button" class="secondary-button" data-action="backup">Exportar escritório atual</button>`,
        'Restaurar backup',
        async () => {
          await mutate('restore', { state: imported }, true);
          window.dispatchEvent(new Event('firma-player-changed'));
          toast('Escritório restaurado.');
        },
      );
    } catch (err) {
      toast('Não foi possível importar: ' + err.message);
    }
  };
  document.addEventListener('keydown', (e) => {
    const editing = e.target.closest('input,textarea,select,[contenteditable]');
    if (editing || $('modal').open || $('studio')?.open || e.altKey) return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      commands();
      return;
    }
    if (e.ctrlKey || e.metaKey) return;
    if (e.key === '?') {
      e.preventDefault();
      help();
    }
    const index = Number(e.key) - 1;
    if (Number.isInteger(index) && index >= 0 && index < 5) {
      e.preventDefault();
      window.FirmaGame.goTo(window.FirmaWorld.stations[index]);
    }
  });
  function updateTime() {
    const min = Math.floor(state.seconds / 60),
      sec = Math.floor(state.seconds % 60);
    $('stat-time').textContent = String(min).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
  }
  setInterval(async () => {
    if (syncing) return;
    syncing = true;
    try {
      applyRemote(await A.read());
      $('connection-label').textContent = 'Ao vivo';
      $('save-status').textContent = A.isAdmin
        ? 'Salvamento no servidor'
        : 'Visita em tempo real · somente leitura';
      if (A.isAdmin && Math.floor(Date.now() / 1000) % 5 === 0) save();
    } catch (error) {
      storageAvailable = false;
      $('connection-label').textContent = 'Reconectando';
      $('save-status').textContent = 'Conexão interrompida · tentando reconectar';
    } finally {
      syncing = false;
    }
  }, 1000);

  window.addEventListener('pagehide', save);
  window.FirmaUI = {
    state,
    get paused() {
      return paused;
    },
    get view() {
      return view;
    },
    openModal,
    closeModal,
    applyRemote,
    management,
    newTask,
    taskDetail,
    refreshScene: renderScene,
    agentDetail,
    smallTalk,
    officeToggle,
    meeting,
    changeView,
    templateChooser,
    interact,
    customize,
    toast,
    save,
    refresh,
    sync: async () => applyRemote(await A.read()),
    status: (a) => E.agentStatus(state, a),
  };
  $('modal').addEventListener('close', () => {
    if (!$('modal').open) {
      scenePanel = '';
      managementActive = false;
      managementContext = false;
    }
  });
  $('modal-content').addEventListener('input', () => {
    const p = document.querySelector('.pixel-avatar');
    if (!p) return;
    for (const [name, variable] of [
      ['playerColor', '--shirt'],
      ['playerSkin', '--skin'],
      ['playerHair', '--hair'],
    ]) {
      const input = $('modal-content').querySelector(`[name="${name}"]`);
      if (input) p.style.setProperty(variable, input.value);
    }
  });
  window.addEventListener('firma-project-changed', () => {
    render();
    renderScene();
  });
  setInterval(renderScene, 3000);
  render(true);
  updateTime();
  if (!state.onboarded)
    setTimeout(() => {
      if (!$('studio')?.open) help();
    }, 650);
})();
