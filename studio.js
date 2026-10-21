/* Local development desk. Provider output is always text, never executable markup. */
(() => {
  'use strict';
  const A = window.FirmaAccess,
    U = window.FirmaUI,
    E = window.FirmaEngine;
  if (!A.isAdmin) return;
  const $ = (id) => document.getElementById(id),
    esc = (s) =>
      String(s ?? '').replace(
        /[&<>"']/g,
        (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
      );
  const names = {
    leadership: 'Codex · líder',
    planning: 'Planejamento',
    development: 'Desenvolvimento',
    testing: 'Testes e revisão',
    publishing: 'Conteúdo',
  };
  for (const href of ['studio.css', 'station.css', 'village.css']) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.append(link);
  }
  const dialog = document.createElement('dialog');
  dialog.id = 'studio';
  dialog.className = 'ide-desk';
  dialog.setAttribute('aria-labelledby', 'studio-title');
  dialog.innerHTML = `<div class="st-shell"><header class="st-top"><div class="ide-brand"><span>⌘</span><div><h2 id="studio-title">Sua bancada de programação</h2><p id="st-room-progress">Projetos, código e equipe no mesmo lugar.</p></div></div><div class="st-top-actions"><button type="button" class="st-button" id="st-room-tools">Gestão</button><button type="button" class="st-button" id="st-connections">Conectar IAs</button><button type="button" class="st-button" id="st-close">Voltar ao escritório ×</button></div></header>
  <nav class="st-tabs" aria-label="Áreas da bancada" role="tablist"><button type="button" role="tab" data-pane="home">Início</button><button type="button" role="tab" data-pane="code">Arquivos e código</button><button type="button" role="tab" data-pane="chat">Conversas</button><button type="button" role="tab" data-pane="tasks">Tarefas</button><button type="button" role="tab" data-pane="terminal">Terminal</button><button type="button" role="tab" data-pane="prompts">Meus prompts</button></nav>
  <div class="st-grid st-pane-home" id="st-grid"><aside class="st-files" aria-label="Projetos, arquivos e equipe"><div class="ide-side-heading"><strong>EXPLORADOR</strong><button type="button" id="st-project-new" class="st-button" title="Criar projeto">＋ Projeto</button></div><label class="ide-project-label" for="st-project">Projeto aberto</label><select id="st-project"></select><p id="st-project-path" class="st-note"></p><div class="ide-side-heading"><strong>ARQUIVOS</strong><button type="button" id="st-file-new" class="st-button">＋ Arquivo</button></div><input type="search" id="st-file-search" placeholder="Buscar arquivo…" aria-label="Buscar arquivo"><div id="st-file-list"></div><div class="ide-side-heading"><strong>SUA EQUIPE</strong></div><div id="st-contacts"></div></aside>
  <section class="st-work" aria-label="Área de trabalho"><section id="st-home" class="ide-home"></section>
  <section class="st-editor"><div class="ide-open-tabs" id="st-open-tabs" aria-label="Arquivos abertos"></div><div class="st-editor-head"><select id="st-source" aria-label="O que visualizar"><option value="files">Arquivo do projeto</option><option value="production">Resposta da IA ao vivo</option></select><strong id="st-file-name">Abra um arquivo</strong><small id="st-file-state">SALVO LOCALMENTE</small><button type="button" class="st-button" id="st-file-new-editor">＋ Arquivo</button><button type="button" class="st-button" id="st-copy-file">Copiar</button><button type="button" class="st-button st-primary" id="st-save-file">Salvar · Ctrl+S</button><select id="st-file-select" aria-label="Abrir arquivo" class="st-mobile-file"></select></div><div class="st-code-wrap" tabindex="-1"><pre class="st-lines" id="st-lines" aria-hidden="true">1</pre><textarea id="st-editor-input" aria-label="Editor de código" spellcheck="false" autocapitalize="off" autocomplete="off" wrap="off"></textarea><pre id="st-production"><code id="st-code"></code></pre></div><p class="st-editor-note" id="st-code-note">Alterações são salvas no disco somente ao clicar em Salvar.</p></section>
  <section class="st-task-view" id="st-task-view"><div class="ide-section-title"><div><small>TRABALHO EM ANDAMENTO</small><h3>Da ideia à entrega.</h3></div><button type="button" class="st-button st-primary" id="st-task-new">＋ Nova tarefa</button></div><p class="st-note">Acompanhe o trabalho da equipe. Abra uma entrega para revisar e aprovar.</p><div class="st-task-list" id="st-task-list"></div></section>
  <section id="st-prompts" class="ide-prompts"><div class="ide-section-title"><div><small>BIBLIOTECA PESSOAL</small><h3>Não comece do zero.</h3></div><button type="button" class="st-button st-primary" id="st-prompt-new">＋ Salvar prompt</button></div><p class="st-note">Escolha um modelo, ajuste o texto e envie ao agente que preferir.</p><div id="st-prompt-list"></div></section>
  <section class="st-terminal"><div class="st-terminal-head"><strong>TERMINAL LOCAL</strong><select id="st-command" aria-label="Comando"><option value="syntax">Verificar sintaxe do arquivo</option><option value="tests">Verificações do projeto</option><option value="build">Instalar e compilar projeto</option><option value="lint">Instalar e verificar estilo</option><option value="typecheck">Instalar e verificar tipos</option><option value="status">Git · alterações locais</option><option value="diff">Git · resumo das mudanças</option></select><button type="button" class="st-button st-primary" id="st-run">Executar</button><button type="button" class="st-button" id="st-stop" disabled>Parar</button></div><pre id="st-terminal-output" tabindex="0"></pre></section></section>
  <section class="st-chat" aria-label="Conversar com a equipe"><header class="st-chat-head"><p class="st-caption">CONVERSE COM QUEM VAI FAZER</p><select id="st-role" aria-label="Agente ou canal de conversa"></select><div class="st-chat-meta"><span id="st-model">Verificando conexão…</span><button type="button" class="st-button" id="st-clear">Limpar</button></div></header><div class="st-messages" id="st-messages" role="log" aria-label="Histórico da conversa"></div><div class="ide-prompt-suggestions"><button type="button" data-prompt="planejar">Planejar projeto</button><button type="button" data-prompt="revisar">Revisar código</button><button type="button" data-prompt="explicar">Explicar arquivo</button></div><form class="st-composer" id="st-chat-form"><label for="st-prompt">Seu pedido para <b id="st-recipient">Codex</b></label><textarea id="st-prompt" required maxlength="6000" placeholder="Descreva o que vamos construir…"></textarea><details class="ide-send-options"><summary>Contexto e autorização de envio</summary><label><input id="st-attach" type="checkbox"> Anexar arquivo aberto: <span id="st-attached-name">nenhum</span></label><label><input id="st-consent" type="checkbox" required> Autorizar esta chamada de IA e o envio do histórico desta conversa e do arquivo marcado. Pode consumir créditos da conta conectada.</label></details><div class="st-composer-actions"><button type="button" class="st-button" id="st-cancel-chat" disabled>Parar resposta</button><button type="submit" class="st-button st-primary" id="st-send">Enviar pedido ↑</button></div><p id="st-send-hint" class="st-note"></p></form></section></div>
  <footer><p class="st-error" id="st-error" role="alert"></p><div class="st-footer"><span id="st-usage">Conectando ao servidor local…</span><span id="st-live" role="status">Pronto</span><span id="st-position">Ln 1, Col 1 · UTF-8</span></div></footer></div>`;
  document.querySelector('.office-scene').append(dialog);
  let meta = null,
    data = null,
    files = [],
    selected = '',
    project = window.FirmaProjects?.current || 'firma',
    role = 'leadership',
    contact = 'leadership',
    roomId = 'leadership',
    polling = false,
    lastFiles = 0,
    fileLoading = false,
    source = 'files',
    displayed = '',
    currentPane = 'home',
    signature = '',
    chatSignature = '',
    lastTerminal = '';
  const buffers = new Map(),
    drafts = new Map();
  const templates = {
    planejar:
      'Me ajude a planejar este projeto. Faça perguntas sobre o objetivo, proponha etapas pequenas e indique o primeiro passo.',
    revisar:
      'Revise o código anexado. Identifique problemas concretos, explique o impacto e proponha correções. Diferencie o que foi analisado do que foi testado.',
    explicar:
      'Explique o arquivo anexado em linguagem simples. Mostre como ele funciona e sugira a próxima melhoria.',
  };
  const chatKey = () => (project === 'firma' ? contact : 'project:' + project + ':' + contact);
  const promptKey = () => project + '::' + contact;
  const bufferKey = () => project + '::' + selected,
    buffer = () => buffers.get(bufferKey());
  function error(e) {
    $('st-error').textContent = e?.message || String(e || '');
  }
  function text(tag, value, cls) {
    const el = document.createElement(tag);
    el.textContent = value;
    if (cls) el.className = cls;
    return el;
  }
  function pane(name) {
    if (!['home', 'code', 'chat', 'tasks', 'terminal', 'prompts'].includes(name)) name = 'home';
    currentPane = name;
    $('st-grid').className = 'st-grid st-pane-' + name;
    dialog
      .querySelectorAll('[data-pane]')
      .forEach((b) => b.setAttribute('aria-selected', String(b.dataset.pane === name)));
    if (name === 'home' || name === 'chat') renderHome();
    if (name === 'code') paintEditor();
    layoutDesk();
    rememberDesk();
  }
  function contactInfo(value = contact) {
    if (value.startsWith('agent:')) {
      const a = U.state.agents.find((a) => 'agent:' + a.id === value);
      if (a) return { name: a.name, role: E.departmentOf(a), agentId: a.id, description: a.role };
    }
    return {
      name: names[value] || names.leadership,
      role: Object.hasOwn(names, value) ? value : 'leadership',
      description:
        value === 'leadership' ? 'Coordenação e programação' : 'Canal compartilhado do setor',
    };
  }
  function payload() {
    const c = contactInfo();
    return { role: c.role, project, ...(c.agentId ? { agentId: c.agentId } : {}) };
  }
  function stashPrompt() {
    drafts.set(promptKey(), $('st-prompt').value);
  }
  function chooseContact(value) {
    if (!restoring) stashPrompt();
    contact = value;
    const c = contactInfo();
    role = c.role;
    $('st-role').value = contact;
    $('st-recipient').textContent = c.name;
    $('st-prompt').value = drafts.get(promptKey()) || '';
    $('st-consent').checked = false;
    $('st-attach').checked = false;
    rememberDesk();
    chatSignature = '';
    if (meta && data) renderStatus();
    renderContacts();
  }
  function renderContacts() {
    const options = [
      ['leadership', 'Codex · líder'],
      ...U.state.agents.map((a) => ['agent:' + a.id, a.name + ' · ' + a.role]),
      ...Object.entries(names)
        .filter(([id]) => id !== 'leadership')
        .map(([id, n]) => [id, 'Setor · ' + n]),
    ];
    const key = options.map((x) => x.join(':')).join('|');
    if ($('st-role').dataset.key !== key) {
      $('st-role').innerHTML = options
        .map(([id, name]) => `<option value="${esc(id)}">${esc(name)}</option>`)
        .join('');
      $('st-role').dataset.key = key;
    }
    $('st-role').value = contact;
    const contactStamp = key + contact;
    if ($('st-contacts').dataset.stamp === contactStamp) return;
    $('st-contacts').dataset.stamp = contactStamp;
    $('st-contacts').innerHTML = [
      ['leadership', 'Codex', 'Líder da equipe'],
      ...U.state.agents.map((a) => ['agent:' + a.id, a.name, a.role]),
    ]
      .map(
        ([id, name, description]) =>
          `<button type="button" class="ide-contact" data-contact="${esc(id)}" aria-current="${id === contact}"><span>${esc(name[0])}</span><span><b>${esc(name)}</b><small>${esc(description)}</small></span><i>↗</i></button>`,
      )
      .join('');
  }
  function renderHome() {
    const p = data?.projects.find((p) => p.id === project),
      c = contactInfo(),
      tasks = U.state.tasks.filter(
        (t) => (t.projectId || 'firma') === project && t.status !== 'done',
      );
    $('st-home').innerHTML =
      `<div class="ide-welcome"><span class="ide-eyebrow">${roomId === 'leadership' ? 'SUA CONVERSA COM CODEX' : 'SEU AMBIENTE LOCAL'}</span><h3>${roomId === 'leadership' ? 'Vamos construir o quê?' : 'Seu próximo projeto começa aqui.'}</h3><p>Abra um projeto, escreva seu código e trabalhe com a equipe. Cada agente tem uma conversa própria.</p></div><div class="ide-project-card"><small>PROJETO ABERTO NO COMPUTADOR</small><h4>${esc(p?.name || 'Firma')}</h4><p>${esc(p?.description || 'Seu escritório de IAs em 2D.')}</p><code>${esc(p?.path || '')}</code><div><button type="button" class="st-button st-primary" data-ide-action="files">Abrir arquivos →</button><button type="button" class="st-button" data-ide-action="project">＋ Novo projeto</button></div></div><div class="ide-quick-grid"><button type="button" data-prompt="planejar"><span>01 / PLANEJAR</span><b>Transformar uma ideia em etapas</b><small>Preparar um pedido para ${esc(c.name)} →</small></button><button type="button" data-ide-action="tasks"><span>02 / ACOMPANHAR</span><b>${tasks.length} tarefas em aberto</b><small>${tasks.filter((t) => t.status === 'review').length} aguardando sua revisão →</small></button><button type="button" data-ide-action="prompts"><span>03 / REUTILIZAR</span><b>Prompts para sua rotina</b><small>Planejamento, revisão e explicação →</small></button></div><div class="ide-section-title"><h4>Projetos em andamento</h4></div><div class="ide-projects-list">${(data?.projects || []).map((p) => `<button type="button" data-project="${esc(p.id)}"><span>▱</span><span><b>${esc(p.name)}</b><small>${esc(p.description || 'Projeto local')}</small></span><span>${p.id === project ? 'Aberto' : 'Abrir →'}</span></button>`).join('')}</div>`;
  }
  function renderProjects() {
    const old = $('st-project').value,
      key = JSON.stringify(data.projects.map((p) => [p.id, p.name]));
    if ($('st-project').dataset.key !== key) {
      $('st-project').innerHTML = data.projects
        .map((p) => `<option value="${esc(p.id)}">${esc(p.name)}</option>`)
        .join('');
      $('st-project').dataset.key = key;
    }
    $('st-project').value = project;
    $('st-project-path').textContent = data.projects.find((p) => p.id === project)?.path || '';
    if (old !== project) renderHome();
  }
  function renderFiles() {
    const query = $('st-file-search').value.toLocaleLowerCase('pt-BR'),
      list = $('st-file-list'),
      expanded = new Set([...list.querySelectorAll('details[open]')].map((d) => d.dataset.folder)),
      tree = Object.create(null);
    for (const file of files.filter((f) => f.path.toLocaleLowerCase('pt-BR').includes(query))) {
      let node = tree;
      const pieces = file.path.split('/');
      pieces.forEach((piece, i) => {
        if (i === pieces.length - 1) node[piece] = { file };
        else node = node[piece] ??= Object.create(null);
      });
    }
    function branch(node, prefix = '') {
      return Object.entries(node)
        .sort((a, b) => Number(!!a[1].file) - Number(!!b[1].file) || a[0].localeCompare(b[0]))
        .map(([name, value]) => {
          const full = prefix + name;
          if (value.file)
            return `<button type="button" class="st-file" data-file="${esc(full)}" aria-current="${full === selected}"><small>${/\.(?:js|cjs|ts)$/.test(full) ? 'JS' : /\.html$/.test(full) ? '◇' : '≡'}</small><span>${esc(name)}</span>${buffers.get(project + '::' + full)?.draft !== buffers.get(project + '::' + full)?.text ? '<i>●</i>' : ''}</button>`;
          return `<details class="desk-folder" data-folder="${esc(full)}" ${query || expanded.has(full) || selected.startsWith(full + '/') ? 'open' : ''}><summary>▱ ${esc(name)}</summary><div>${branch(value, full + '/')}</div></details>`;
        })
        .join('');
    }
    list.innerHTML = branch(tree) || '<p class="st-note">Nenhum arquivo encontrado.</p>';
    $('st-file-select').innerHTML = files
      .map((f) => `<option value="${esc(f.path)}">${esc(f.path)}</option>`)
      .join('');
    $('st-file-select').value = selected;
  }
  function lines(value) {
    $('st-lines').textContent = Array.from(
      { length: value.split('\n').length },
      (_, i) => i + 1,
    ).join('\n');
  }
  function paintEditor() {
    const b = buffer();
    if (codeEditor) {
      codeEditor.set({
        key: bufferKey(),
        value: b?.draft || '',
        path: selected,
        readOnly: !b?.editable,
        wrap: deskSettings.wrap,
        visible: source === 'files',
      });
      $('st-lines').hidden = source === 'files';
    }
    $('st-editor-input').hidden = !!codeEditor || source !== 'files';
    $('st-production').hidden = source === 'files';
    $('st-save-file').hidden = source !== 'files';
    $('st-source').value = source;
    if (source === 'production') {
      production();
      return;
    }
    const value = b?.draft || '';
    if ($('st-editor-input').value !== value) $('st-editor-input').value = value;
    displayed = value;
    lines(value);
    $('st-editor-input').readOnly = !b?.editable;
    $('st-save-file').disabled = !b?.editable || b.draft === b.text;
    $('st-file-name').textContent = selected || 'Abra um arquivo';
    $('st-file-state').textContent = !b
      ? 'SEM ARQUIVO'
      : !b.editable
        ? 'SOMENTE LEITURA'
        : b.draft === b.text
          ? 'SALVO NO DISCO'
          : '● ALTERAÇÕES NÃO SALVAS';
    $('st-code-note').textContent = b?.editable
      ? deskSettings.autosave && project !== 'firma'
        ? 'Salvamento automático após 1,5 segundo. Rascunhos de IA e conflitos aguardam sua revisão.'
        : 'Arquivo local · Ctrl+S para salvar · rascunhos recuperados neste computador.'
      : 'Selecione um arquivo no explorador. Arquivos com credenciais ocultadas ficam somente para leitura.';
    $('st-open-tabs').innerHTML = [...buffers]
      .filter(([key]) => key.startsWith(project + '::'))
      .map(
        ([key, b]) =>
          `<div class="desk-tab" data-active="${key === bufferKey()}"><button type="button" data-file="${esc(key.slice(project.length + 2))}" aria-current="${key === bufferKey()}">${esc(key.split('::')[1])}${b.draft !== b.text ? ' ●' : ''}</button><button type="button" data-close-file="${esc(key.slice(project.length + 2))}" aria-label="Fechar ${esc(key.split('::')[1])}">×</button></div>`,
      )
      .join('');
    $('st-attached-name').textContent =
      (selected || 'nenhum') + (b && b.draft !== b.text ? ' · salve antes de anexar' : '');
    $('st-attach').disabled = !selected;
    paintDesk();
  }
  async function loadFiles() {
    const targetProject = project,
      result = await A.studioRead('files?project=' + encodeURIComponent(project));
    if (project !== targetProject) return;
    files = result.files;
    for (const [key, b] of buffers)
      if (key.startsWith(project + '::') && !b.hash && !files.some((f) => f.path === b.path))
        files.push({ path: b.path, size: 0, draft: true });
    lastFiles = Date.now();
    renderFiles();
  }
  async function openFile(name) {
    if (fileLoading) return;
    fileLoading = true;
    const targetProject = project;
    try {
      const key = project + '::' + name,
        existing = buffers.get(key);
      if (existing && !existing.hash) {
        selected = name;
        source = 'files';
        pane('code');
        renderFiles();
        return;
      }
      const result = await A.studioRead(
        'file?project=' + encodeURIComponent(project) + '&path=' + encodeURIComponent(name),
      );
      if (project !== targetProject) return;
      if (!existing || existing.draft === existing.text)
        buffers.set(key, { ...result, draft: result.text });
      else if (existing.hash !== result.hash) {
        existing.conflict = true;
        existing.diskText = result.text;
        existing.diskHash = result.hash;
      }
      selected = name;
      source = 'files';
      pane('code');
      renderFiles();
      paintEditor();
      rememberDesk();
      error('');
    } catch (e) {
      error(e);
    } finally {
      fileLoading = false;
    }
  }
  async function saveFile(automatic = false) {
    automatic = automatic === true;
    const b = buffer();
    if (!b?.editable || b.draft === b.text || saveBusy) return;
    if (b.conflict) {
      if (!automatic) resolveConflict();
      return;
    }
    if (automatic && (b.hold || project === 'firma')) return;
    const key = bufferKey(),
      draft = b.draft,
      targetProject = project,
      targetPath = selected;
    saveBusy = true;
    b.autoError = false;
    try {
      error('');
      $('st-save-file').disabled = true;
      const result = await A.studio('file.save', {
        project: targetProject,
        path: targetPath,
        text: draft,
        hash: b.hash,
        confirm: true,
      });
      buffers.set(key, { ...result, draft: b.draft === draft ? result.text : b.draft });
      paintEditor();
      renderFiles();
      rememberDesk();
      schedulePreview();
      $('st-live').textContent = 'Arquivo salvo no disco.';
      await checkSaved(targetProject, targetPath);
    } catch (e) {
      b.autoError = true;
      error(e);
      if (/mudou no disco/.test(e.message))
        try {
          const disk = await A.studioRead(
            'file?project=' +
              encodeURIComponent(targetProject) +
              '&path=' +
              encodeURIComponent(targetPath),
          );
          b.conflict = true;
          b.diskText = disk.text;
          b.diskHash = disk.hash;
        } catch {}
      paintEditor();
    } finally {
      saveBusy = false;
      if (buffer()?.draft !== buffer()?.text) scheduleAutosave();
    }
  }
  function closeFile(name) {
    const key = project + '::' + name,
      b = buffers.get(key);
    if (b && b.draft !== b.text) {
      U.openModal(
        'Fechar arquivo com alterações?',
        '<p class="detail-description">O rascunho de <b>' +
          esc(name) +
          '</b> tem alterações não salvas. Você pode continuar editando ou descartar somente esse rascunho.</p>',
        'Descartar rascunho e fechar',
        async () => {
          buffers.delete(key);
          files = files.filter((f) => f.path !== name || !f.draft);
          if (selected === name) selected = '';
          renderFiles();
          paintEditor();
          rememberDesk();
        },
      );
      return;
    }
    buffers.delete(key);
    if (selected === name) {
      const other = [...buffers.keys()].filter((k) => k.startsWith(project + '::')).at(-1);
      if (other) {
        openFile(other.slice(project.length + 2));
        return;
      }
      selected = '';
    }
    paintEditor();
    rememberDesk();
  }
  async function chooseProject(id) {
    if (!data.projects.some((p) => p.id === id)) return;
    clearTimeout(autosaveTimer);
    project = id;
    selected = '';
    source = 'files';
    $('st-attach').checked = false;
    $('st-preview').hidden = true;
    previewVersion++;
    renderProjects();
    await loadFiles();
    renderHome();
    pane('home');
    chatSignature = signature = '';
    if (window.FirmaProjects && FirmaProjects.current !== id) await FirmaProjects.select(id);
    rememberDesk();
  }
  function newProject() {
    U.openModal(
      'Novo projeto local',
      '<p class="dialog-intro">O projeto será criado na pasta projects do escritório, no seu computador.</p><label>Nome<input name="name" required maxlength="60" placeholder="Ex.: Meu aplicativo"></label><label>O que vamos construir?<textarea name="description" maxlength="1500" placeholder="Objetivo do projeto"></textarea></label>',
      'Criar projeto',
      async (fields) => {
        const result = await A.studio('project.create', Object.fromEntries(fields));
        await refresh(true);
        await chooseProject(result.project.id);
      },
    );
  }
  function newFile() {
    U.openModal(
      'Novo arquivo',
      '<label>Caminho no projeto<input name="path" required maxlength="200" placeholder="Ex.: src/app.js"></label><p class="detail-note">Crie arquivos de código, texto ou documentação. As pastas são criadas junto com o arquivo.</p>',
      'Criar arquivo',
      async (fields) => {
        const result = await A.studio('file.save', {
          project,
          path: fields.get('path'),
          text: '',
          hash: '',
          confirm: true,
        });
        await loadFiles();
        await openFile(result.path);
      },
    );
  }
  function savePrompt() {
    U.openModal(
      'Salvar prompt',
      '<label>Nome<input name="title" required maxlength="80" placeholder="Ex.: Revisar minha interface"></label><label>Prompt<textarea name="text" required maxlength="6000">' +
        esc($('st-prompt').value) +
        '</textarea></label>',
      'Salvar prompt',
      async (fields) => {
        await A.studio('prompt.save', Object.fromEntries(fields));
        await refresh(true);
        pane('prompts');
      },
    );
  }
  function renderPrompts() {
    const stamp = JSON.stringify(data?.prompts || []);
    if ($('st-prompt-list').dataset.stamp === stamp) return;
    $('st-prompt-list').dataset.stamp = stamp;
    const all = [
      ...Object.entries(templates).map(([id, value]) => ({
        id,
        title: {
          planejar: 'Planejar um projeto',
          revisar: 'Revisar código',
          explicar: 'Explicar um arquivo',
        }[id],
        text: value,
      })),
      ...(data?.prompts || []),
    ];
    $('st-prompt-list').innerHTML = all
      .map(
        (p) =>
          `<article><h4>${esc(p.title)}</h4><p>${esc(p.text)}</p><button type="button" class="st-button" data-use-prompt="${esc(p.id)}">Usar no chat →</button></article>`,
      )
      .join('');
  }
  function usePrompt(value) {
    $('st-prompt').value = value;
    drafts.set(promptKey(), value);
    pane('chat');
    $('st-prompt').focus();
    rememberDesk();
  }
  function production() {
    if (!data || source !== 'production') return;
    const history = data.chats[chatKey()] || [],
      answer = [...history].reverse().find((m) => m.role === 'assistant'),
      live = data.missionLive?.role === role ? data.missionLive : null;
    displayed =
      live?.text ||
      answer?.text ||
      'A resposta da IA aparecerá aqui. Escolha um agente e envie um pedido no chat.';
    const blocks = window.FirmaActivity.codeFrom(displayed);
    if (blocks.length) displayed = blocks.map((b) => b.code).join('\n\n');
    $('st-code').textContent = displayed;
    lines(displayed);
    $('st-file-name').textContent = 'Resposta · ' + contactInfo().name;
    $('st-file-state').textContent =
      live || answer?.status === 'running'
        ? 'RECEBENDO RESPOSTA'
        : 'PROPOSTA · REVISE ANTES DE USAR';
    $('st-code-note').textContent =
      'Resposta da IA. Para usar, copie o código para um arquivo e salve conscientemente.';
  }
  function bodyContent(body, value, reviewable = false) {
    body.replaceChildren();
    const regex = /```[^\n]*\n([\s\S]*?)```/g;
    let index = 0,
      m;
    while ((m = regex.exec(value))) {
      if (m.index > index) body.append(document.createTextNode(value.slice(index, m.index)));
      const pre = text('pre', m[1]);
      body.append(pre);
      const b = text('button', 'Copiar código', 'st-button');
      b.type = 'button';
      const code = m[1];
      b.onclick = () => copy(code);
      body.append(b);
      if (reviewable) {
        const review = text('button', 'Revisar no editor', 'st-button');
        review.type = 'button';
        review.onclick = () => reviewSuggestion(code);
        body.append(review);
      }
      index = regex.lastIndex;
    }
    if (index < value.length) body.append(document.createTextNode(value.slice(index)));
  }
  function renderMessages() {
    const history = data.chats[chatKey()] || [],
      key = contact + JSON.stringify(history);
    if (key === chatSignature) return;
    chatSignature = key;
    const box = $('st-messages'),
      nearEnd = box.scrollHeight - box.scrollTop - box.clientHeight < 100;
    box.replaceChildren();
    if (!history.length) {
      const empty = text('div', '', 'st-empty');
      empty.append(
        text('strong', 'Olá, vamos trabalhar juntos?'),
        text(
          'span',
          'Esta é sua conversa com ' +
            contactInfo().name +
            '. Descreva o objetivo ou escolha uma sugestão abaixo. Só esta conversa e os anexos marcados serão enviados.',
        ),
      );
      box.append(empty);
      return;
    }
    for (const m of history) {
      const article = text('article', '', 'st-message');
      article.dataset.role = m.role;
      article.append(
        text(
          'header',
          m.role === 'user'
            ? 'Você' + (m.file ? ' · ' + m.file : '')
            : contactInfo().name + ' · ' + m.provider,
        ),
      );
      const body = text('div', '', 'st-message-body');
      bodyContent(
        body,
        m.text || (m.status === 'running' ? 'Aguardando a IA…' : 'Sem resposta.'),
        m.role === 'assistant' && m.status === 'completed',
      );
      article.append(body);
      article.append(
        text(
          'p',
          m.error ||
            (m.role === 'user'
              ? ''
              : m.status === 'running'
                ? 'Recebendo resposta…'
                : m.status === 'completed'
                  ? 'Resposta concluída · revise antes de usar'
                  : 'Resposta interrompida'),
          'st-message-status',
        ),
      );
      if (m.role === 'assistant' && m.status === 'completed') {
        const b = text('button', 'Criar tarefa com esta resposta', 'st-button');
        b.type = 'button';
        b.onclick = () => {
          dialog.close();
          U.newTask(
            E.departments[role === 'leadership' ? 'planning' : role].template,
            contactInfo().agentId || '',
          );
          document.querySelector('#modal [name=description]').value = m.text.slice(0, 3000);
        };
        article.append(b);
      }
      box.append(article);
    }
    if (nearEnd || history.at(-1)?.status === 'running') box.scrollTop = box.scrollHeight;
  }
  function renderTasks() {
    const tasks = U.state.tasks.filter((t) => (t.projectId || 'firma') === project),
      key = JSON.stringify(tasks.map((t) => [t.id, t.status, t.progress, t.title, t.agent]));
    if (key === signature) return;
    signature = key;
    const box = $('st-task-list');
    box.replaceChildren();
    for (const t of [...tasks].reverse()) {
      const b = text('button', '', 'ide-task');
      b.type = 'button';
      b.append(
        text('strong', t.title),
        text(
          'small',
          (U.state.agents.find((a) => a.id === t.agent)?.name || 'Equipe') +
            ' · ' +
            E.stages[t.status],
        ),
      );
      b.onclick = () => {
        dialog.close();
        U.taskDetail(t.id);
      };
      box.append(b);
    }
    if (!tasks.length) box.append(text('p', 'Nenhuma tarefa criada ainda.', 'st-note'));
  }
  function renderStatus() {
    const c = contactInfo(),
      config = meta.roles[c.role],
      provider = meta.providers.find((p) => p.id === config.provider),
      busy = !!data.chatRunning || !!meta.running || meta.pending > 0,
      active = (data.chatRunning?.conversation || data.chatRunning?.role) === chatKey();
    $('st-recipient').textContent = c.name;
    $('st-model').textContent =
      config.provider +
      ' · ' +
      (config.model || 'modelo da conta') +
      ' · ' +
      (provider?.connected ? 'conectado' : 'desconectado');
    $('st-usage').textContent =
      meta.usage.used +
      '/' +
      meta.usage.limit +
      ' chamadas hoje · ' +
      (data.projects.find((p) => p.id === project)?.name || 'Projeto local');
    $('st-send').disabled =
      busy || !provider?.connected || meta.usage.used >= meta.usage.limit || !E.officeOpen(U.state);
    $('st-cancel-chat').disabled = !active;
    $('st-clear').disabled = active;
    $('st-send-hint').textContent = !provider?.connected
      ? 'Conecte ' + config.provider + ' em “Conectar IAs” para conversar.'
      : !E.officeOpen(U.state)
        ? 'Abra o escritório para conversar com a equipe.'
        : busy
          ? 'Aguarde a execução atual ou pare a resposta.'
          : 'Ctrl+Enter envia · confira a autorização de envio.';
    $('st-run').disabled = data.terminal.status === 'running';
    for (const option of $('st-command').options) {
      if (['build', 'lint', 'typecheck'].includes(option.value)) {
        option.disabled = data.executor?.mode !== 'docker' || project === 'firma';
        option.title = option.disabled ? 'Configure o executor Docker para esta operação.' : '';
      }
    }
    $('st-stop').disabled = data.terminal.status !== 'running';
    if (lastTerminal !== data.terminal.output) {
      $('st-terminal-output').textContent = data.terminal.output;
      lastTerminal = data.terminal.output;
    }
    $('st-live').textContent = busy
      ? 'IA em execução'
      : data.terminal.status === 'running'
        ? 'Terminal executando'
        : deskSettings.autosave && project !== 'firma'
          ? 'Auto salvar · servidor'
          : 'Salvamento manual · servidor';
    $('st-room-progress').textContent = contactInfo().name + ' · ' + contactInfo().description;
    renderMessages();
    renderTasks();
    renderPrompts();
    paintDesk();
    if (source === 'production') production();
    if (currentPane === 'home') renderHome();
  }
  async function refresh(force = false) {
    if (polling || (!dialog.open && !force) || (document.hidden && !force)) return;
    polling = true;
    try {
      const [next, nextMeta] = await Promise.all([A.studioRead('status'), A.aiStatus()]);
      if (!Array.isArray(next.projects))
        throw Error(
          'Servidor antigo: feche a janela antiga do servidor e abra Iniciar Firma.bat novamente. Depois use Ctrl+F5.',
        );
      data = next;
      meta = nextMeta;
      renderProjects();
      renderContacts();
      renderStatus();
      if (Date.now() - lastFiles > 5000) await loadFiles();
    } catch (e) {
      error(e);
    } finally {
      polling = false;
    }
  }
  async function open(next = 'leadership', tab = 'home') {
    roomId = next;
    contact = next === 'admin' ? 'development' : Object.hasOwn(names, next) ? next : 'leadership';
    role = contact;
    chatSignature = signature = '';
    $('st-prompt').value = drafts.get(promptKey()) || '';
    $('st-consent').checked = false;
    $('studio-title').textContent =
      next === 'leadership'
        ? 'Codex · seu parceiro de projeto'
        : next === 'admin'
          ? 'Sua mesa · ambiente de programação'
          : names[contact] + ' · bancada';
    if ($('modal').open) U.closeModal();
    if (!dialog.open) dialog.showModal();
    document.body.classList.add('studio-open');
    window.dispatchEvent(new Event('firma-studio-open'));
    error('');
    pane(tab);
    await refresh(true);
    await recoverDesk(next === 'admin');
    if (tab === 'code' && !selected && files.length)
      await openFile(files.find((f) => f.path === 'app.js')?.path || files[0].path);
    if (window.FirmaProjects && FirmaProjects.current !== project)
      await FirmaProjects.select(project);
    paintDesk();
  }
  async function openAgent(id) {
    const a = U.state.agents.find((a) => a.id === id);
    if (!a) return;
    await open(E.departmentOf(a), 'chat');
    chooseContact('agent:' + id);
    $('studio-title').textContent = a.name + ' · conversa de trabalho';
  }
  async function copy(value) {
    try {
      await navigator.clipboard.writeText(value);
      $('st-live').textContent = 'Copiado.';
    } catch {
      error('Selecione e copie o texto manualmente.');
    }
  }
  $('st-close').onclick = () => dialog.close();
  dialog.addEventListener('close', () => {
    stashPrompt();
    document.body.classList.remove('studio-open');
    $('office-canvas').focus({ preventScroll: true });
  });
  $('st-room-tools').onclick = () => {
    dialog.close();
    U.management('home');
  };
  $('st-connections').onclick = () => window.FirmaAI.open().catch(error);
  $('st-project-new').onclick = newProject;
  $('st-file-new').onclick = newFile;
  $('st-file-new-editor').onclick = newFile;
  $('st-prompt-new').onclick = savePrompt;
  $('st-project').onchange = (e) => chooseProject(e.target.value).catch(error);
  $('st-role').onchange = (e) => chooseContact(e.target.value);
  $('st-file-search').oninput = renderFiles;
  $('st-file-select').onchange = (e) => openFile(e.target.value);
  $('st-copy-file').onclick = () => copy(displayed);
  $('st-save-file').onclick = saveFile;
  $('st-source').onchange = (e) => {
    source = e.target.value;
    paintEditor();
  };
  $('st-task-new').onclick = () => {
    dialog.close();
    U.newTask(
      E.departments[role === 'leadership' ? 'planning' : role].template,
      contactInfo().agentId || '',
    );
  };
  $('st-editor-input').oninput = (e) => {
    const b = buffer();
    if (!b) return;
    b.draft = e.target.value;
    paintEditor();
  };
  $('st-editor-input').onscroll = (e) => {
    $('st-lines').scrollTop = e.target.scrollTop;
  };
  $('st-editor-input').onkeyup = () => {
    const el = $('st-editor-input'),
      prefix = el.value.slice(0, el.selectionStart);
    $('st-position').textContent =
      'Ln ' +
      prefix.split('\n').length +
      ', Col ' +
      (prefix.length - prefix.lastIndexOf('\n')) +
      ' · UTF-8';
  };
  dialog.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.pane) pane(b.dataset.pane);
    if (b.dataset.file) openFile(b.dataset.file);
    if (b.dataset.closeFile) closeFile(b.dataset.closeFile);
    if (b.dataset.contact) {
      chooseContact(b.dataset.contact);
      pane('chat');
    }
    if (b.dataset.project) chooseProject(b.dataset.project).catch(error);
    if (b.dataset.prompt) usePrompt(templates[b.dataset.prompt]);
    if (b.dataset.usePrompt)
      usePrompt(
        templates[b.dataset.usePrompt] ||
          data.prompts.find((p) => p.id === b.dataset.usePrompt)?.text ||
          '',
      );
    if (b.dataset.ideAction) {
      if (b.dataset.ideAction === 'project') newProject();
      else if (b.dataset.ideAction === 'files') {
        pane('code');
        if (!selected && files.length)
          openFile(files.find((f) => f.path === 'index.html')?.path || files[0].path);
      } else pane(b.dataset.ideAction);
    }
  });
  $('st-chat-form').onsubmit = async (e) => {
    e.preventDefault();
    if (!$('st-consent').checked) {
      $('st-consent').closest('details').open = true;
      error('Autorize o envio antes de conversar com a IA.');
      return;
    }
    try {
      error('');
      if ($('st-attach').checked && buffer()?.draft !== buffer()?.text) {
        error('Salve o arquivo antes de anexar sua versão ao pedido.');
        return;
      }
      await A.studio('chat.send', {
        ...payload(),
        text: $('st-prompt').value,
        project,
        confirm: true,
        ...($('st-attach').checked && selected ? { file: selected } : {}),
      });
      $('st-prompt').value = '';
      drafts.delete(promptKey());
      rememberDesk();
      $('st-consent').checked = false;
      await refresh(true);
    } catch (e) {
      error(e);
    }
  };
  $('st-chat-form').addEventListener(
    'invalid',
    () => {
      $('st-consent').closest('details').open = true;
    },
    true,
  );
  $('st-cancel-chat').onclick = async () => {
    try {
      await A.studio('chat.cancel', payload());
      await refresh(true);
    } catch (e) {
      error(e);
    }
  };
  $('st-clear').onclick = async () => {
    if (!confirm('Apagar o histórico desta conversa?')) return;
    try {
      await A.studio('chat.clear', { ...payload(), confirm: true });
      await refresh(true);
    } catch (e) {
      error(e);
    }
  };
  $('st-run').onclick = async () => {
    if ($('st-command').value === 'syntax' && !selected) {
      error('Abra um arquivo JavaScript para verificar sua sintaxe.');
      return;
    }
    if (buffer()?.draft !== buffer()?.text) {
      error('Salve o arquivo antes de verificar a versão do disco.');
      return;
    }
    if (!confirm('Executar esta verificação no seu computador?')) return;
    try {
      await A.studio('terminal.run', {
        command: $('st-command').value,
        file: selected,
        project,
        confirm: true,
      });
      await refresh(true);
    } catch (e) {
      error(e);
    }
  };
  $('st-stop').onclick = async () => {
    try {
      await A.studio('terminal.cancel');
      await refresh(true);
    } catch (e) {
      error(e);
    }
  };
  document.addEventListener('keydown', (e) => {
    if (!dialog.open || $('modal').open) return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      saveFile();
    }
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && e.target === $('st-prompt')) {
      e.preventDefault();
      $('st-chat-form').requestSubmit();
    }
    if (e.key === 'Tab' && e.target === $('st-editor-input')) {
      e.preventDefault();
      const el = e.target;
      el.setRangeText('  ', el.selectionStart, el.selectionEnd, 'end');
      el.dispatchEvent(new Event('input'));
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      dialog.close();
    }
  });
  window.addEventListener('beforeunload', (e) => {
    if (
      !persisted &&
      ([...buffers.values()].some((b) => b.draft !== b.text) || $('st-prompt').value.trim())
    ) {
      e.preventDefault();
      e.returnValue = '';
    }
  });
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-studio-role],[data-studio-agent]');
    if (b?.dataset.studioAgent) openAgent(b.dataset.studioAgent);
    else if (b) open(b.dataset.studioRole, b.dataset.studioPane || 'home');
  });
  // Workbench preferences and recovery stay on this computer; no provider calls.
  const deskDefaults = {
    autosave: false,
    autocheck: false,
    terminal: false,
    sidebar: true,
    chat: true,
    wrap: false,
  };
  let deskSettings = { ...deskDefaults },
    persistTimer,
    autosaveTimer,
    recovered = false,
    restoring = false,
    persisted = false,
    saveBusy = false,
    persistGeneration = 0,
    settingsStamp = '',
    paletteItems = [],
    paletteIndex = 0,
    paletteMode = 'files',
    previewTimer,
    previewVersion = 0,
    previewBuilding = false;
  try {
    deskSettings = {
      ...deskDefaults,
      ...JSON.parse(localStorage.getItem('firma-desk-preferences') || '{}'),
    };
  } catch {}
  function draftStore() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('firma-desk-recovery', 1);
      req.onupgradeneeded = () => req.result.createObjectStore('desk');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  async function persistDesk() {
    if (restoring) return;
    const generation = ++persistGeneration;
    stashPrompt();
    const dirty = [...buffers]
      .filter(([, b]) => b.draft !== b.text)
      .map(([key, b]) => [
        key,
        {
          path: b.path,
          project: b.project,
          text: b.text,
          draft: b.draft,
          hash: b.hash,
          editable: b.editable,
          hold: b.hold || false,
        },
      ]);
    const session = {
      project,
      selected,
      contact,
      pane: currentPane,
      openFiles: [...buffers.keys()].slice(-30),
      dirty,
      drafts: [...drafts].slice(-30),
      time: Date.now(),
    };
    try {
      const db = await draftStore();
      if (generation !== persistGeneration) {
        db.close();
        return;
      }
      await new Promise((resolve, reject) => {
        const tx = db.transaction('desk', 'readwrite');
        tx.objectStore('desk').put(session, 'session');
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      });
      db.close();
      if (generation === persistGeneration) persisted = true;
    } catch {
      persisted = false;
      $('st-recovery-state').textContent = 'Rascunho somente nesta aba';
    }
  }
  function rememberDesk() {
    if (!recovered || restoring) return;
    persisted = false;
    clearTimeout(persistTimer);
    persistTimer = setTimeout(persistDesk, 220);
  }
  async function recoverDesk(restoreContact = false) {
    if (recovered || !data) return;
    recovered = true;
    restoring = true;
    try {
      const db = await draftStore(),
        saved = await new Promise((resolve, reject) => {
          const tx = db.transaction('desk');
          const req = tx.objectStore('desk').get('session');
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
        });
      db.close();
      if (!saved) return;
      const allowed = new Set(data.projects.map((p) => p.id));
      for (const [key, b] of saved.dirty || [])
        if (allowed.has(key.split('::')[0]) && typeof b.draft === 'string') buffers.set(key, b);
      for (const [key, value] of saved.drafts || [])
        if (typeof value === 'string')
          drafts.set(key.includes('::') ? key : 'firma::' + key, value);
      if (allowed.has(saved.project)) {
        project = saved.project;
        selected = '';
        renderProjects();
        await loadFiles();
        const opened = (saved.openFiles || [])
          .filter((key) => key.startsWith(project + '::'))
          .map((key) => key.slice(project.length + 2))
          .filter((name) => files.some((f) => f.path === name))
          .slice(-8);
        for (const name of opened) await openFile(name);
        if (saved.selected && files.some((f) => f.path === saved.selected))
          await openFile(saved.selected);
      }
      if (
        restoreContact &&
        saved.contact &&
        (Object.hasOwn(names, saved.contact) ||
          U.state.agents.some((a) => 'agent:' + a.id === saved.contact))
      )
        chooseContact(saved.contact);
      $('st-prompt').value = drafts.get(promptKey()) || '';
      if (restoreContact && saved.pane) pane(saved.pane);
      const count = (saved.dirty || []).length;
      if (count) $('st-recovery-state').textContent = count + ' rascunho(s) recuperado(s)';
      persisted = true;
    } catch {
      $('st-recovery-state').textContent = 'Recuperação indisponível nesta aba';
    } finally {
      restoring = false;
    }
  }
  function layoutDesk() {
    dialog.classList.toggle('desk-hide-sidebar', !deskSettings.sidebar);
    dialog.classList.toggle('desk-hide-chat', !deskSettings.chat);
    dialog.classList.toggle(
      'desk-hide-terminal',
      !deskSettings.terminal && currentPane !== 'terminal',
    );
    $('st-editor-input').wrap = deskSettings.wrap ? 'soft' : 'off';
    $('st-wrap').setAttribute('aria-pressed', String(deskSettings.wrap));
    $('st-auto-label').textContent = deskSettings.autosave ? 'Auto salvar' : 'Salvar manualmente';
    $('st-auto-label').dataset.enabled = String(deskSettings.autosave);
    $('st-layout-side').setAttribute('aria-pressed', String(deskSettings.sidebar));
    $('st-layout-chat').setAttribute('aria-pressed', String(deskSettings.chat));
    $('st-layout-terminal').setAttribute('aria-pressed', String(deskSettings.terminal));
    const stamp = JSON.stringify(deskSettings);
    if (stamp !== settingsStamp)
      try {
        localStorage.setItem('firma-desk-preferences', stamp);
        settingsStamp = stamp;
      } catch {}
  }
  function deskOptions() {
    U.openModal(
      'Automatizações da sua mesa',
      `<p class="dialog-intro">Escolha o que a bancada pode cuidar por você. As preferências ficam neste navegador.</p><label class="desk-option"><input type="checkbox" name="autosave" ${deskSettings.autosave ? 'checked' : ''}><span><b>Salvar automaticamente</b><small>Após 1,5 segundo sem digitar, nos seus projetos. O código do escritório Firma continua com salvamento manual.</small></span></label><label class="desk-option"><input type="checkbox" name="autocheck" ${deskSettings.autocheck ? 'checked' : ''}><span><b>Verificar JavaScript ao salvar</b><small>Executa node --check no arquivo salvo e mostra problemas no terminal.</small></span></label><p class="detail-note">Rascunhos e pedidos não enviados são recuperados automaticamente ao reabrir a mesa. Chamadas de IA continuam sendo enviadas pelo botão do chat.</p>`,
      'Aplicar preferências',
      async (fields) => {
        deskSettings.autosave = fields.has('autosave');
        deskSettings.autocheck = fields.has('autocheck');
        layoutDesk();
        scheduleAutosave();
      },
    );
  }
  function scheduleAutosave() {
    clearTimeout(autosaveTimer);
    const b = buffer();
    if (
      !restoring &&
      deskSettings.autosave &&
      project !== 'firma' &&
      b?.editable &&
      b.draft !== b.text &&
      !b.hold &&
      !b.conflict &&
      !b.autoError
    )
      autosaveTimer = setTimeout(() => saveFile(true), 1500);
  }
  async function checkSaved(projectId, name) {
    if (
      !deskSettings.autocheck ||
      !name.match(/\.(?:js|cjs|mjs)$/i) ||
      data?.terminal.status === 'running'
    )
      return;
    try {
      deskSettings.terminal = true;
      layoutDesk();
      await A.studio('terminal.run', {
        command: 'syntax',
        project: projectId,
        file: name,
        confirm: true,
      });
      await refresh(true);
    } catch (e) {
      error(e);
    }
  }
  function paintDesk() {
    const b = buffer(),
      dirty = [...buffers.values()].filter((b) => b.draft !== b.text).length;
    $('st-breadcrumb').textContent =
      (data?.projects.find((p) => p.id === project)?.name || 'Projeto') +
      (selected ? '  /  ' + selected.replaceAll('/', '  /  ') : '');
    $('st-dirty-count').textContent = dirty ? dirty + ' não salvo(s)' : 'Tudo salvo';
    $('st-review-draft').disabled = !b || b.draft === b.text;
    $('st-preview-open').disabled = !files.some((f) => f.path.endsWith('.html'));
    const banner = $('st-draft-banner');
    banner.hidden = !b?.hold && !b?.conflict && !b?.autoError;
    $('st-draft-message').textContent =
      b?.autoError && !b?.conflict
        ? 'O arquivo continua em rascunho. Confira a conexão local e tente salvar novamente.'
        : b?.conflict
          ? 'O arquivo mudou fora da mesa. Compare as versões antes de salvar.'
          : 'Sugestão no rascunho. Revise e salve para aplicar ao arquivo.';
    $('st-draft-undo').hidden = !b?.undo;
    $('st-draft-resolve').hidden = !b?.conflict;
    if (b?.conflict) $('st-file-state').textContent = 'CONFLITO · REVISAR';
    else if (b?.hold) $('st-file-state').textContent = 'SUGESTÃO EM REVISÃO';
    layoutDesk();
  }
  function diffMarkup(before, after) {
    if (window.FirmaCodeEditor) return FirmaCodeEditor.diffMarkup(before, after);
    const left = before.split('\n'),
      right = after.split('\n'),
      rows = Math.max(left.length, right.length),
      limit = Math.min(rows, 2000);
    let a = '',
      b = '';
    for (let i = 0; i < limit; i++) {
      const changed = left[i] !== right[i];
      a += `<span class="${changed ? 'desk-minus' : ''}"><i>${i + 1}</i>${esc(left[i] ?? ' ')}</span>`;
      b += `<span class="${changed ? 'desk-plus' : ''}"><i>${i + 1}</i>${esc(right[i] ?? ' ')}</span>`;
    }
    return `<div class="desk-diff"><section><h4>Antes</h4><pre>${a}</pre></section><section><h4>Depois</h4><pre>${b}</pre></section></div>${rows > limit ? '<p class="detail-note">Comparação limitada às primeiras 2.000 linhas.</p>' : ''}`;
  }
  function reviewDraft() {
    const b = buffer();
    if (!b) return;
    U.openModal(
      'Alterações · ' + selected,
      diffMarkup(b.diskText ?? b.text, b.draft),
      null,
      null,
      true,
    );
  }
  function resolveConflict() {
    const b = buffer();
    if (!b?.conflict) return;
    U.openModal(
      'Comparar com o arquivo do disco',
      `<p class="dialog-intro">O arquivo foi alterado fora desta mesa. Confira o rascunho antes de usá-lo como próxima versão.</p>${diffMarkup(b.diskText, b.draft)}`,
      'Manter meu rascunho para salvar',
      async () => {
        b.text = b.diskText;
        b.hash = b.diskHash;
        b.conflict = false;
        b.hold = true;
        delete b.diskText;
        delete b.diskHash;
        paintEditor();
        rememberDesk();
      },
      true,
    );
  }
  function reviewSuggestion(code) {
    const targetProject = project,
      targetPath = selected,
      current = buffer();
    U.openModal(
      'Revisar sugestão de código',
      `<p class="dialog-intro">Escolha o arquivo que receberá o código. A sugestão será colocada no editor para você revisar.</p><label>Arquivo no projeto<input name="path" id="st-suggestion-path" value="${esc(targetPath || 'src/novo-arquivo.js')}" required maxlength="200" list="st-suggestion-files"><datalist id="st-suggestion-files">${files.map((f) => `<option value="${esc(f.path)}"></option>`).join('')}</datalist></label><div id="st-suggestion-diff">${diffMarkup(current?.draft || '', code)}</div>`,
      'Colocar no editor',
      async (fields) => {
        const name = String(fields.get('path')).trim();
        let b = buffers.get(targetProject + '::' + name);
        if (!b) {
          if (files.some((f) => f.path === name)) {
            const read = await A.studioRead(
              'file?project=' +
                encodeURIComponent(targetProject) +
                '&path=' +
                encodeURIComponent(name),
            );
            b = { ...read, draft: read.text };
          } else {
            if (
              !/^[\w\-./ ]+\.(?:js|cjs|mjs|html|css|json|md|txt|ts|tsx|jsx|py|svg)$/i.test(name) ||
              name
                .split('/')
                .some((part) => !part || part === '.' || part === '..' || part.startsWith('.'))
            )
              throw Error('Use um caminho relativo de código ou documentação.');
            b = {
              path: name,
              project: targetProject,
              text: '',
              draft: '',
              hash: '',
              editable: true,
            };
          }
        }
        if (!b.editable) throw Error('Este arquivo está disponível somente para leitura.');
        b.undo = b.draft;
        b.draft = code;
        b.hold = true;
        buffers.set(targetProject + '::' + name, b);
        project = targetProject;
        selected = name;
        source = 'files';
        if (!files.some((f) => f.path === name)) files.push({ path: name, size: 0, draft: true });
        pane('code');
        renderFiles();
        paintEditor();
        rememberDesk();
      },
      true,
    );
    $('st-suggestion-path').onchange = async (e) => {
      try {
        const name = e.target.value,
          b = buffers.get(targetProject + '::' + name),
          disk = files.some((f) => f.path === name)
            ? await A.studioRead(
                'file?project=' +
                  encodeURIComponent(targetProject) +
                  '&path=' +
                  encodeURIComponent(name),
              )
            : null;
        $('st-suggestion-diff').innerHTML = diffMarkup(b?.draft || disk?.text || '', code);
      } catch (e) {
        $('modal-error').textContent = e.message;
      }
    };
  }
  function findEditor(next = true) {
    const input = $('st-editor-input'),
      needle = $('st-find-input').value;
    if (!needle) {
      $('st-find-count').textContent = '';
      return;
    }
    const all = input.value.split(needle).length - 1;
    let index = input.value.indexOf(needle, next ? input.selectionEnd : 0);
    if (index < 0) index = input.value.indexOf(needle);
    $('st-find-count').textContent = all + ' ocorrência(s)';
    if (index >= 0) {
      if (codeEditor) codeEditor.select(index, index + needle.length);
      else input.focus();
      input.setSelectionRange(index, index + needle.length);
      input.scrollTop = Math.max(0, input.value.slice(0, index).split('\n').length - 5) * 22;
    }
  }
  function showFind() {
    pane('code');
    $('st-findbar').hidden = false;
    $('st-find-input').focus();
  }
  function replaceAll() {
    const b = buffer(),
      needle = $('st-find-input').value;
    if (!b?.editable || !needle) return;
    b.draft = b.draft.split(needle).join($('st-replace-input').value);
    paintEditor();
    rememberDesk();
    scheduleAutosave();
    findEditor(false);
  }
  function formatJSON() {
    const b = buffer();
    if (!b?.editable) return;
    if (!selected.endsWith('.json')) {
      error('A formatação local está disponível para JSON.');
      return;
    }
    try {
      b.draft = JSON.stringify(JSON.parse(b.draft), null, 2) + '\n';
      paintEditor();
      rememberDesk();
      scheduleAutosave();
    } catch (e) {
      error('JSON inválido: ' + e.message);
    }
  }
  function commandEntries() {
    return [
      { label: 'Novo projeto', hint: 'Criar no computador', run: newProject },
      { label: 'Novo arquivo', hint: 'No projeto aberto', run: newFile },
      { label: 'Salvar arquivo', hint: 'Ctrl+S', run: saveFile },
      { label: 'Buscar e substituir', hint: 'Ctrl+F', run: showFind },
      {
        label: 'Abrir prévia do projeto',
        hint: 'HTML, CSS e JavaScript',
        run: () => previewProject(),
      },
      { label: 'Comparar alterações do arquivo', hint: 'Antes e depois', run: reviewDraft },
      { label: 'Formatar JSON', hint: 'Dois espaços', run: formatJSON },
      {
        label: 'Modo foco',
        hint: 'Concentrar no código',
        run: () => {
          deskSettings.sidebar = false;
          deskSettings.chat = false;
          deskSettings.terminal = false;
          pane('code');
          layoutDesk();
        },
      },
      {
        label: 'Restaurar painéis',
        hint: 'Explorador e conversa',
        run: () => {
          deskSettings.sidebar = true;
          deskSettings.chat = true;
          layoutDesk();
        },
      },
      { label: 'Automatizações da mesa', hint: 'Salvar e verificar', run: deskOptions },
      {
        label: 'Conversar com Codex',
        hint: 'Canal do líder',
        run: () => {
          chooseContact('leadership');
          pane('chat');
        },
      },
      { label: 'Ver tarefas da equipe', hint: 'Revisar e acompanhar', run: () => pane('tasks') },
      { label: 'Conectar IAs', hint: 'Codex e Gemini', run: () => window.FirmaAI.open() },
    ];
  }
  function showPalette(mode = 'files') {
    paletteMode = mode;
    paletteIndex = 0;
    const p = $('st-palette');
    p.hidden = false;
    $('st-quick-input').value = '';
    $('st-quick-input').placeholder =
      mode === 'files' ? 'Digite o nome de um arquivo…' : 'O que você quer fazer?';
    $('st-palette-title').textContent = mode === 'files' ? 'Abrir arquivo' : 'Comandos da mesa';
    renderPalette();
    $('st-quick-input').focus();
  }
  function renderPalette() {
    const q = $('st-quick-input').value.toLocaleLowerCase('pt-BR');
    paletteItems = (
      paletteMode === 'files'
        ? files.map((f) => ({
            label: f.path,
            hint: buffers.has(project + '::' + f.path) ? 'Aberto' : 'Arquivo do projeto',
            run: () => openFile(f.path),
          }))
        : commandEntries()
    )
      .filter((item) => item.label.toLocaleLowerCase('pt-BR').includes(q))
      .slice(0, 40);
    paletteIndex = Math.min(paletteIndex, Math.max(0, paletteItems.length - 1));
    $('st-quick-results').innerHTML =
      paletteItems
        .map(
          (item, i) =>
            `<button type="button" role="option" aria-selected="${i === paletteIndex}" id="st-quick-${i}" data-quick="${i}"><span>${esc(item.label)}</span><small>${esc(item.hint)}</small></button>`,
        )
        .join('') || '<p>Nenhum resultado encontrado.</p>';
    $('st-quick-input').setAttribute('aria-activedescendant', 'st-quick-' + paletteIndex);
  }
  function runPalette(index = paletteIndex) {
    const item = paletteItems[index];
    $('st-palette').hidden = true;
    if (item) Promise.resolve(item.run()).catch(error);
  }
  async function previewProject() {
    if (previewBuilding) return;
    previewBuilding = true;
    const version = ++previewVersion,
      targetProject = project;
    try {
      const entry = selected.endsWith('.html')
        ? selected
        : files.find((f) => f.path === 'index.html')?.path ||
          files.find((f) => f.path.endsWith('.html'))?.path;
      if (!entry) throw Error('Crie um arquivo HTML para abrir a prévia.');
      async function contents(name) {
        const b = buffers.get(targetProject + '::' + name);
        return b
          ? b.draft
          : (
              await A.studioRead(
                'file?project=' +
                  encodeURIComponent(targetProject) +
                  '&path=' +
                  encodeURIComponent(name),
              )
            ).text;
      }
      function localPath(url) {
        if (!url || /^(?:[a-z]+:|\/\/|#)/i.test(url)) return null;
        const out = entry.split('/').slice(0, -1);
        for (const piece of url.split(/[?#]/)[0].split('/')) {
          if (piece === '..') {
            if (!out.length) return null;
            out.pop();
          } else if (piece && piece !== '.') out.push(piece);
        }
        const name = out.join('/');
        return files.some((f) => f.path === name) ? name : null;
      }
      const doc = new DOMParser().parseFromString(await contents(entry), 'text/html');
      doc.querySelectorAll('base,meta[http-equiv]').forEach((el) => el.remove());
      for (const link of [...doc.querySelectorAll('link[rel=stylesheet]')]) {
        const name = localPath(link.getAttribute('href'));
        if (name) {
          const style = doc.createElement('style');
          style.textContent = (await contents(name)).replace(/<\/style/gi, '<\\/style');
          link.replaceWith(style);
        } else link.remove();
      }
      for (const script of [...doc.querySelectorAll('script[src]')]) {
        const name = localPath(script.getAttribute('src'));
        if (name) {
          const inline = doc.createElement('script');
          inline.textContent = (await contents(name)).replace(/<\/script/gi, '<\\/script');
          script.replaceWith(inline);
        } else script.remove();
      }
      const csp = doc.createElement('meta');
      csp.httpEquiv = 'Content-Security-Policy';
      csp.content =
        "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; connect-src 'none'; form-action 'none'; base-uri 'none'";
      doc.head.prepend(csp);
      if (version !== previewVersion || targetProject !== project) return;
      const preview = await A.studio('preview.create', {
        html: '<!doctype html>\n' + doc.documentElement.outerHTML,
      });
      if (version !== previewVersion || targetProject !== project) return;
      $('st-preview-frame').removeAttribute('srcdoc');
      $('st-preview-frame').src = preview.url;
      $('st-preview-name').textContent = entry + ' · prévia local';
      $('st-preview').hidden = false;
      pane('code');
    } catch (e) {
      error(e);
    } finally {
      previewBuilding = false;
    }
  }
  function schedulePreview() {
    if ($('st-preview').hidden) return;
    clearTimeout(previewTimer);
    previewTimer = setTimeout(previewProject, 700);
  }
  function initDesk() {
    const toolbar = document.createElement('div');
    toolbar.className = 'desk-toolbar';
    toolbar.innerHTML = `<button type="button" id="st-command-launch" class="desk-command"><span>⌕</span><span>Buscar arquivos ou comandos</span><kbd>Ctrl+P</kbd></button><div class="desk-layout"><button type="button" id="st-layout-side" title="Explorador (Ctrl+B)" aria-label="Alternar explorador">▤</button><button type="button" id="st-layout-terminal" title="Terminal (Ctrl+J)" aria-label="Alternar terminal">▥</button><button type="button" id="st-layout-chat" title="Conversa" aria-label="Alternar conversa">◫</button><button type="button" id="st-auto-label">Salvar manualmente</button><button type="button" id="st-command-list" title="Comandos (Ctrl+Shift+P)">⌘</button></div>`;
    dialog.querySelector('.st-tabs').after(toolbar);
    dialog
      .querySelector('.st-editor-head')
      .insertAdjacentHTML(
        'beforebegin',
        `<div class="desk-breadcrumb"><span id="st-breadcrumb"></span><div><button type="button" id="st-find-open">Buscar</button><button type="button" id="st-review-draft">Comparar</button><button type="button" id="st-preview-open">▶ Prévia</button><button type="button" id="st-wrap" aria-pressed="false" title="Quebrar linhas">↵</button></div></div><div id="st-findbar" class="desk-find" hidden><input id="st-find-input" aria-label="Buscar no arquivo" placeholder="Buscar no arquivo"><input id="st-replace-input" aria-label="Substituir por" placeholder="Substituir por"><button type="button" id="st-find-next">Próxima</button><button type="button" id="st-replace-all">Substituir todas</button><small id="st-find-count"></small><button type="button" id="st-find-close" aria-label="Fechar busca">×</button></div><div id="st-draft-banner" class="desk-draft-banner" hidden><span id="st-draft-message"></span><button type="button" id="st-draft-undo">Desfazer sugestão</button><button type="button" id="st-draft-resolve">Comparar versões</button></div>`,
      );
    const preview = document.createElement('section');
    preview.id = 'st-preview';
    preview.className = 'desk-preview';
    preview.hidden = true;
    preview.innerHTML =
      '<header><strong id="st-preview-name">Prévia local</strong><div><button type="button" id="st-preview-refresh">↻ Atualizar</button><button type="button" id="st-preview-close" aria-label="Fechar prévia">×</button></div></header><iframe id="st-preview-frame" title="Prévia isolada do projeto" sandbox="allow-scripts" referrerpolicy="no-referrer"></iframe>';
    dialog.querySelector('.st-editor').append(preview);
    const palette = document.createElement('section');
    palette.id = 'st-palette';
    palette.className = 'desk-palette';
    palette.hidden = true;
    palette.setAttribute('aria-label', 'Acesso rápido');
    palette.innerHTML =
      '<header><strong id="st-palette-title">Abrir arquivo</strong><button type="button" id="st-quick-close" aria-label="Fechar acesso rápido">×</button></header><input id="st-quick-input" role="combobox" aria-expanded="true" aria-controls="st-quick-results" aria-autocomplete="list" autocomplete="off"><div id="st-quick-results" role="listbox"></div><footer>↑ ↓ navegar · Enter abrir · Esc fechar</footer>';
    dialog.querySelector('.st-shell').append(palette);
    $('st-live').insertAdjacentHTML(
      'afterend',
      '<span id="st-recovery-state">Rascunhos neste computador</span><span id="st-dirty-count"></span>',
    );
    $('st-command-launch').onclick = () => showPalette();
    $('st-command-list').onclick = () => showPalette('commands');
    $('st-auto-label').onclick = deskOptions;
    for (const [id, key] of [
      ['st-layout-side', 'sidebar'],
      ['st-layout-chat', 'chat'],
      ['st-layout-terminal', 'terminal'],
    ])
      $(id).onclick = () => {
        deskSettings[key] = !deskSettings[key];
        layoutDesk();
      };
    $('st-wrap').onclick = () => {
      deskSettings.wrap = !deskSettings.wrap;
      layoutDesk();
    };
    $('st-review-draft').onclick = reviewDraft;
    $('st-find-open').onclick = showFind;
    $('st-find-next').onclick = () => findEditor();
    $('st-find-input').oninput = () => findEditor(false);
    $('st-replace-all').onclick = replaceAll;
    $('st-find-close').onclick = () => {
      $('st-findbar').hidden = true;
    };
    $('st-draft-undo').onclick = () => {
      const b = buffer();
      if (!b || b.undo === undefined) return;
      b.draft = b.undo;
      delete b.undo;
      b.hold = false;
      paintEditor();
      rememberDesk();
    };
    $('st-draft-resolve').onclick = resolveConflict;
    $('st-preview-open').onclick = () => previewProject();
    $('st-preview-refresh').onclick = () => previewProject();
    $('st-preview-close').onclick = () => {
      previewVersion++;
      $('st-preview').hidden = true;
      $('st-preview-frame').removeAttribute('src');
    };
    $('st-quick-input').oninput = () => {
      paletteIndex = 0;
      renderPalette();
    };
    $('st-quick-results').onclick = (e) => {
      const b = e.target.closest('[data-quick]');
      if (b) runPalette(Number(b.dataset.quick));
    };
    $('st-quick-close').onclick = () => {
      $('st-palette').hidden = true;
    };
    dialog.addEventListener('input', (e) => {
      if (e.target.id === 'st-editor-input') {
        rememberDesk();
        scheduleAutosave();
        schedulePreview();
      }
      if (e.target.id === 'st-prompt') rememberDesk();
    });
    dialog.addEventListener('keydown', (e) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!$('st-palette').hidden) {
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopImmediatePropagation();
          $('st-palette').hidden = true;
          return;
        }
        if (['ArrowDown', 'ArrowUp', 'Enter'].includes(e.key)) {
          e.preventDefault();
          e.stopPropagation();
          if (e.key === 'Enter') runPalette();
          else {
            paletteIndex = Math.max(
              0,
              Math.min(paletteItems.length - 1, paletteIndex + (e.key === 'ArrowDown' ? 1 : -1)),
            );
            renderPalette();
            $('st-quick-' + paletteIndex)?.scrollIntoView({ block: 'nearest' });
          }
          return;
        }
      }
      if (mod && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        e.stopPropagation();
        showPalette(e.shiftKey ? 'commands' : 'files');
      }
      if (mod && e.key.toLowerCase() === 'f' && currentPane === 'code') {
        e.preventDefault();
        showFind();
      }
      if (mod && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        deskSettings.sidebar = !deskSettings.sidebar;
        layoutDesk();
      }
      if (mod && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        deskSettings.terminal = !deskSettings.terminal;
        layoutDesk();
      }
      if (e.key === 'Escape' && !$('st-findbar').hidden) {
        e.preventDefault();
        e.stopImmediatePropagation();
        $('st-findbar').hidden = true;
      }
    });
    dialog.addEventListener('cancel', (e) => {
      if (!$('st-palette').hidden) {
        e.preventDefault();
        $('st-palette').hidden = true;
      }
    });
    dialog.addEventListener('close', () => {
      clearTimeout(autosaveTimer);
      persistDesk();
    });
    window.addEventListener('pagehide', () => persistDesk());
    layoutDesk();
  }
  window.addEventListener('firma-project-changed', (e) => {
    if (e.detail.id === project) return;
    if (dialog.open) chooseProject(e.detail.id).catch(error);
    else {
      project = e.detail.id;
      selected = '';
      lastFiles = 0;
    }
  });
  let codeEditor = null;
  if (window.FirmaCodeEditor) {
    codeEditor = FirmaCodeEditor.create($('st-editor-input'), (line, col) => {
      if ($('st-position'))
        $('st-position').textContent = 'Ln ' + line + ', Col ' + col + ' ? UTF-8';
    });
    dialog.classList.add('cm-ready');
    window.FirmaEditor = codeEditor;
  }
  initDesk();
  const importButton = text('button', 'Importar GitHub', 'st-button');
  importButton.type = 'button';
  importButton.id = 'st-project-import';
  $('st-project-new').after(importButton);
  importButton.onclick = () =>
    U.openModal(
      'Importar repositório público',
      '<label>URL do GitHub<input name="url" type="url" required placeholder="https://github.com/equipe/projeto"></label><p>Importa código permitido para um novo projeto local. Credenciais, dependências e histórico remoto não são copiados. Nenhuma alteração ? enviada ao GitHub.</p>',
      'Importar projeto',
      async (f) => {
        const result = await A.company('git.import', { url: f.get('url'), confirm: true });
        await refresh(true);
        await chooseProject(result.project.id);
        pane('code');
      },
    );
  window.FirmaStudio = {
    open,
    openAgent,
    close: () => dialog.close(),
    get isOpen() {
      return dialog.open;
    },
    get role() {
      return role;
    },
    get room() {
      return roomId;
    },
    get live() {
      return data || {};
    },
    get project() {
      return project;
    },
  };
  setInterval(refresh, 1200);
})();
