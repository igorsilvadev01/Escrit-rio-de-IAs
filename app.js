(() => {
  'use strict';
  const ui = window.FirmaUI,
    state = ui.state,
    W = window.FirmaWorld,
    $ = (id) => document.getElementById(id),
    agentDetail = ui.agentDetail,
    roleLabel = window.FirmaAccess.isAdmin ? 'Fundador' : 'Visitante';
  const scenePrefs = () => window.FirmaSceneUI.prefs,
    sceneOptions = () => ({
      admin: window.FirmaAccess.isAdmin,
      projectId: window.FirmaProjects?.current || 'firma',
    });
  let sceneOrder = [],
    zoom = scenePrefs().zoom,
    hitItems = [],
    hovered = null,
    pointer = null,
    frameSamples = 0,
    frameTotal = 0,
    lastRenderMs = 0;
  const camera = { x: 500, y: 330 },
    viewport = { width: 1000, height: 660, scale: 1, dpr: 1 };
  function setZoom(value) {
    zoom = Math.min(2.4, Math.max(0.8, value));
    $('zoom-value').textContent = Math.round(zoom * 100) + '%';
    window.FirmaSceneUI.set({ zoom });
  }
  $('zoom-in').onclick = () => setZoom(zoom + 0.1);
  $('zoom-out').onclick = () => setZoom(zoom - 0.1);
  // The scene uses integer-aligned shapes, entirely drawn locally without external assets.
  const canvas = $('office-canvas'),
    ctx = canvas.getContext('2d');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let sectorActivity = {},
    sectorGuideKey = '';
  const readout = document.createElement('div');
  readout.className = 'scene-selection';
  readout.hidden = true;
  readout.innerHTML = '<strong></strong><small></small><button type="button">Abrir</button>';
  document.querySelector('.office-scene').append(readout);
  readout.querySelector('button').onclick = () => activateHit(hovered);
  function activateHit(item) {
    if (!item) return;
    const task = item.taskId && window.FirmaScene.resolveTask(state, item.taskId, sceneOptions());
    if (task) {
      clearMovement();
      ui.taskDetail(task.id);
    } else if (item.target?.seat) goTo(item.target);
    else openRemote(item.target);
  }
  function pick(x, y) {
    const blockers = [
        ...W.workDesks.map((d, i) => ({
          id: 'solid-desk:' + i,
          y: d.y + d.h + 8,
          area: { x: d.x, y: d.y - 12, w: d.w, h: d.h + 21 },
        })),
        ...W.scenery.trees.map((t, i) => ({
          id: 'solid-tree:' + i,
          y: t.y + 15,
          area: { x: t.x - 27, y: t.y - 43, w: 54, h: 60 },
        })),
      ],
      item = window.FirmaScene.hit([...blockers, ...hitItems], x, y);
    return item?.target ? item : null;
  }
  canvas.addEventListener('pointermove', (e) => {
    pointer = { x: e.clientX, y: e.clientY };
  });
  canvas.addEventListener('pointerleave', () => {
    pointer = null;
  });
  window.addEventListener('firma-scene-change', () => {
    zoom = scenePrefs().zoom;
    $('zoom-value').textContent = Math.round(zoom * 100) + '%';
    sectorGuideKey = '';
  });
  if (window.FirmaAccess.isAdmin) {
    const guide = document.createElement('div');
    guide.className = 'sector-computer-guide';
    guide.id = 'sector-guide';
    guide.setAttribute('aria-live', 'polite');
    guide.innerHTML =
      '<strong id="sector-guide-title">Computadores dentro das salas</strong><span id="sector-guide-state">Aproxime-se de um terminal e aperte E.</span><small id="sector-guide-metric"></small><div class="sector-meter"><i id="sector-guide-meter"></i></div>';
    document.querySelector('.office-scene').append(guide);
  }
  function resize() {
    const bounds = canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    viewport.width = bounds.width;
    viewport.height = bounds.height;
    viewport.dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(bounds.width * viewport.dpr);
    canvas.height = Math.round(bounds.height * viewport.dpr);
  }
  new ResizeObserver(resize).observe(canvas);
  resize();
  const rect = (x, y, w, h, c) => {
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
  };
  function line(x1, y1, x2, y2, color, width = 1) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  function text(s, x, y, color = '#b7c1ab', size = 10) {
    ctx.fillStyle = color;
    ctx.font = `${size}px monospace`;
    ctx.textAlign = 'left';
    ctx.fillText(s, x, y);
  }
  const positions = new Map();
  const keys = new Set(),
    directions = {
      w: [0, -1],
      arrowup: [0, -1],
      s: [0, 1],
      arrowdown: [0, 1],
      a: [-1, 0],
      arrowleft: [-1, 0],
      d: [1, 0],
      arrowright: [1, 0],
    };
  let route = [],
    pending = null,
    nearby = null,
    walking = false,
    facing = 'down',
    lastPlayer = state.player,
    hudKey = '',
    touchDirection = null,
    seated = '';
  function safePlayer() {
    if (!W.walkable(state.player.x, state.player.y)) Object.assign(state.player, W.spawn);
  }
  safePlayer();
  function syncMode() {
    state.player.immersive = true;
    document.body.classList.add('playing');
    $('player-name').textContent = state.player.name + ' · ' + roleLabel;
    hudKey = '';
  }
  function clearMovement() {
    keys.clear();
    touchDirection = null;
    route = [];
    pending = null;
    walking = false;
  }
  window.addEventListener('firma-player-changed', () => {
    safePlayer();
    syncMode();
  });
  window.addEventListener('blur', clearMovement);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clearMovement();
  });
  document.addEventListener('keydown', (e) => {
    if (
      e.ctrlKey ||
      e.metaKey ||
      e.altKey ||
      $('modal').open ||
      $('studio')?.open ||
      ui.view !== 'office' ||
      e.target.closest('input,textarea,select,button,summary,a,[contenteditable]')
    )
      return;
    if (document.activeElement !== canvas && !state.player.immersive) return;
    const key = e.key.toLowerCase();
    if (directions[key]) {
      e.preventDefault();
      keys.add(key);
      route = [];
      pending = null;
    }
    if (key === 'e' && !e.repeat) {
      e.preventDefault();
      interactNearby();
    }
    if (key === 'escape') {
      clearMovement();
      $('route-status').textContent = 'Destino cancelado. Clique para andar.';
    }
  });
  document.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
  window.addEventListener('firma-studio-open', clearMovement);
  $('modal').addEventListener('close', () => {
    keys.clear();
    touchDirection = null;
    if (state.player.immersive) canvas.focus({ preventScroll: true });
  });
  new MutationObserver(() => {
    if ($('modal').open) clearMovement();
  }).observe($('modal'), { attributes: true, attributeFilter: ['open'] });
  for (const button of document.querySelectorAll('[data-move]')) {
    button.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      button.setPointerCapture(e.pointerId);
      keys.clear();
      route = [];
      pending = null;
      touchDirection = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[
        button.dataset.move
      ];
    });
    for (const event of ['pointerup', 'pointercancel', 'lostpointercapture'])
      button.addEventListener(event, () => {
        touchDirection = null;
      });
    button.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const [x, y] = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[
          button.dataset.move
        ];
        stand();
        Object.assign(state.player, W.move(state.player, x * 20, y * 20));
      }
    });
  }
  $('world-destinations').replaceChildren(
    ...W.stations.map((station) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.destination = station.id;
      const icon = document.createElement('span');
      icon.textContent = station.icon;
      icon.setAttribute('aria-hidden', 'true');
      button.append(icon, document.createTextNode(station.name));
      button.onclick = () => {
        openRemote(station);
        button.closest('details').open = false;
      };
      return button;
    }),
  );
  function stand() {
    seated = '';
    hudKey = '';
  }
  function sit(kind) {
    goTo(W.playerSeats[kind]);
  }
  function goTo(target) {
    stand();
    const destination = target.agent ? positions.get(target.agent) : target;
    if (!destination) return;
    const end = target.agent ? W.nearest(destination) : { x: target.x, y: target.y };
    route = W.path(state.player, end);
    pending = target;
    if (!route.length) {
      pending = null;
      ui.toast('Não há passagem até esse ponto. Escolha um ponto livre no chão.');
      return;
    }
    $('route-status').textContent = 'Indo para ' + target.name + ' · Esc cancela';
    canvas.focus({ preventScroll: true });
  }
  function markVisited(target) {
    if (!target.id || state.player.visited.includes(target.id)) return;
    state.player.visited.push(target.id);
    ui.save();
  }
  function activate(target) {
    if (!target) return;
    clearMovement();
    if (target.seat) {
      seated = target.seat;
      facing = 'down';
      markVisited(target);
      ui.toast('Sentado. Use WASD ou clique no chão para levantar.');
      return;
    }
    markVisited(target);
    openRemote(target);
  }
  function openRemote(target, tab = 'code') {
    if (!target) return;
    clearMovement();
    if (target.seat) {
      goTo(target);
      return;
    }
    if (target.agent) {
      agentDetail(target.agent);
      return;
    }
    if (
      window.FirmaAccess.isAdmin &&
      window.FirmaStudio &&
      (target.id === 'admin' || window.FirmaActivity.roles.includes(target.id))
    )
      window.FirmaStudio.open(target.id, target.id === 'leadership' ? 'chat' : tab);
    else ui.interact(target);
  }
  function closestInteraction() {
    const p = state.player,
      candidates = [...Object.values(W.playerSeats), ...W.stations].map((s) => ({
        ...s,
        distance: Math.hypot(p.x - s.x, p.y - s.y),
      }));
    for (const a of state.agents) {
      const pos = positions.get(a.id);
      if (pos && pos.visible !== false)
        candidates.push({
          agent: a.id,
          name: a.name,
          verb: 'Conversar com ' + a.name,
          distance: Math.hypot(p.x - pos.x, p.y - pos.y),
        });
    }
    return (
      candidates.filter((s) => s.distance <= 57).sort((a, b) => a.distance - b.distance)[0] || null
    );
  }
  function interactNearby() {
    if (seated) {
      stand();
      return;
    }
    activate(closestInteraction());
  }
  $('interact-button').onclick = interactNearby;
  function updatePlayer(dt) {
    if (lastPlayer !== state.player) {
      lastPlayer = state.player;
      safePlayer();
      clearMovement();
      syncMode();
    }
    walking = false;
    if ($('modal').open || ui.view !== 'office' || document.hidden) return;
    const p = state.player,
      before = { x: p.x, y: p.y };
    let dx = touchDirection?.[0] || 0,
      dy = touchDirection?.[1] || 0;
    for (const key of keys) {
      const direction = directions[key];
      if (direction) {
        dx += direction[0];
        dy += direction[1];
      }
    }
    if (dx || dy) {
      stand();
      const length = Math.hypot(dx, dy);
      Object.assign(p, W.move(p, (dx / length) * 175 * dt, (dy / length) * 175 * dt));
    } else if (route.length) {
      let budget = 175 * dt;
      while (route.length && budget > 0.01) {
        const next = route[0],
          length = Math.hypot(next.x - p.x, next.y - p.y);
        if (length < 0.1) {
          route.shift();
          continue;
        }
        const amount = Math.min(length, budget),
          moved = W.move(p, ((next.x - p.x) / length) * amount, ((next.y - p.y) / length) * amount);
        if (Math.hypot(moved.x - p.x, moved.y - p.y) < Math.min(0.0001, amount * 0.1)) {
          route = [];
          pending = null;
          $('route-status').textContent = 'Caminho interrompido. Escolha outro destino.';
          break;
        }
        Object.assign(p, moved);
        budget -= amount;
        if (amount >= length - 0.01) route.shift();
      }
      if (!route.length && pending) {
        const target = pending;
        pending = null;
        if (target.agent) {
          const at = positions.get(target.agent);
          if (at && Math.hypot(at.x - p.x, at.y - p.y) > 65) {
            goTo(target);
            return;
          }
        }
        activate(target);
      }
    }
    const mx = p.x - before.x,
      my = p.y - before.y;
    walking = Math.hypot(mx, my) > 0.05;
    if (walking)
      facing = Math.abs(mx) > Math.abs(my) ? (mx > 0 ? 'right' : 'left') : my > 0 ? 'down' : 'up';
  }
  function updateHUD() {
    nearby = closestInteraction();
    const p = state.player,
      visited = W.stations.filter((s) => p.visited.includes(s.id)).length;
    const key = [
      p.name,
      visited,
      nearby?.name,
      ui.paused,
      seated,
      W.roomAt(p.x, p.y)?.id,
      state.tasks.filter((t) => t.status === 'review').length,
    ].join('|');
    if (key === hudKey) return;
    hudKey = key;
    $('player-name').textContent = p.name + ' · ' + roleLabel;
    $('interact-button').disabled = !nearby && !seated;
    $('interact-button').textContent = seated
      ? 'E · Levantar'
      : nearby
        ? 'E · ' + (window.FirmaAccess.isAdmin ? nearby.verb : 'Conhecer ' + nearby.name)
        : 'Chegue perto de um objeto ou colega';
    $('exploration-progress').textContent =
      visited + ' / ' + W.stations.length + ' computadores visitados';
    $('exploration-status').textContent =
      visited === W.stations.length
        ? 'Você conhece todos os computadores!'
        : 'Visite as salas e converse com Codex';
    $('player-location').textContent = W.roomAt(p.x, p.y)?.name || 'Espaço aberto';
    if (!route.length)
      $('route-status').textContent = seated
        ? 'Sentado · E, WASD ou clique para levantar'
        : nearby
          ? 'E · ' + nearby.verb
          : 'Clique para andar · E para interagir';
  }
  function drawStationMarkers() {
    for (const s of W.stations) {
      const room = W.roomForStation(s.id),
        selected = nearby?.id === s.id || pending?.id === s.id,
        x = s.marker.x,
        y = s.marker.y;
      if (scenePrefs().mode === 'ambient' && !selected && hovered?.target?.id !== s.id) continue;
      const count = state.tasks.filter(
        (t) =>
          (!sceneOptions().admin || (t.projectId || 'firma') === sceneOptions().projectId) &&
          t.status === 'review' &&
          (s.id === 'leadership' || window.FirmaEngine.taskDepartment(t) === s.id),
      ).length;
      rect(x - 13, y - 17, 27, 25, selected ? room.color : '#5c4434');
      ctx.strokeStyle = room.color;
      ctx.lineWidth = 1;
      ctx.strokeRect(x - 13, y - 17, 27, 25);
      text(s.icon, x - 8, y + 1, selected ? '#203323' : room.color, 16);
      if (count) {
        rect(x + 7, y - 25, 18, 14, '#e8c987');
        text(String(count), x + 11, y - 14, '#45381e', 9);
      }
      if (selected) {
        ctx.font = '10px monospace';
        const label = s.id === 'leadership' ? 'CODEX · LÍDER' : s.name.toUpperCase(),
          width = ctx.measureText(label).width;
        rect(x - width / 2 - 7, y - 39, width + 14, 16, '#efce96');
        text(label, x - width / 2, y - 27, room.color, 10);
      }
    }
    if (route.length) {
      ctx.save();
      ctx.globalAlpha = 0.7;
      ctx.setLineDash([3, 8]);
      ctx.strokeStyle = '#f5dfa5';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(state.player.x, state.player.y + 12);
      for (const p of route) ctx.lineTo(p.x, p.y + 12);
      ctx.stroke();
      ctx.restore();
      const end = route[route.length - 1];
      ctx.strokeStyle = '#f3dfab';
      ctx.beginPath();
      ctx.ellipse(end.x, end.y + 12, 11, 5, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  function drawPlayer(time) {
    const p = state.player;
    ctx.save();
    ctx.translate(Math.round(p.x), Math.round(p.y));
    window.FirmaVillage.sprite(ctx, {
      name: p.name,
      shirt: p.color,
      skin: p.skin,
      hair: p.hair,
      walking,
      time,
      sitting: !!seated,
      facing,
      player: true,
      animation: seated === 'rest' ? 'coffee' : 'idle',
    });
    ctx.restore();
  }
  syncMode();
  function homeFor(a) {
    if (a.id === 'codex-leader') return W.leaderHome;
    const department = window.FirmaEngine.departmentOf(a),
      members = state.agents.filter(
        (agent) => window.FirmaEngine.departmentOf(agent) === department,
      );
    return W.agentSeat(
      { ...a, department },
      members.findIndex((agent) => agent.id === a.id),
    );
  }
  function targetFor(a) {
    const mode = window.FirmaEngine.routine(state, a);
    if (mode === 'leaving' || mode === 'outside') return W.exit;
    if (mode === 'rest')
      return W.lounge.seats[
        state.agents.filter((a) => a.rest).findIndex((other) => other.id === a.id) %
          W.lounge.seats.length
      ];
    if (mode === 'coffee') {
      const first = Math.floor((state.office?.clock || 0) / 60) % state.agents.length;
      return W.lounge.chat[state.agents.indexOf(a) === first ? 0 : 1];
    }
    return homeFor(a);
  }
  function character(x, y, a, time, walking = false, sitting = false, p = {}) {
    const phase = Array.from(a.id).reduce((sum, c) => sum + c.charCodeAt(0), 0),
      status = window.FirmaScene.indicator(state, a.id, sceneOptions()),
      animation = p.mode === 'rest' ? 'coffee' : p.mode === 'coffee' ? 'talking' : status.animation;
    window.FirmaVillage.sprite(ctx, {
      name: a.id === 'codex-leader' ? 'Codex' : a.name,
      shirt: a.color,
      skin: ['#dfba92', '#c49373', '#efd0a5', '#ad7d60'][phase % 4],
      hair: ['#534033', '#775340', '#9b633e', '#403037'][phase % 4],
      phase,
      walking,
      time,
      sitting,
      facing: p.facing || (sitting && p.mode === 'desk' ? 'down' : 'down'),
      animation,
    });
  }
  const leader = {
    id: 'codex-leader',
    name: 'Codex',
    role: 'Líder da Firma',
    color: '#ffd15c',
    rest: false,
    meetingUntil: 0,
  };
  function sectorEffects(time) {
    if (scenePrefs().mode === 'work')
      for (const room of W.rooms) {
        const activity = sectorActivity[room.id];
        if (!activity) continue;
        const barWidth = room.w - 18;
        rect(room.x + 9, room.y + room.h - 4, barWidth, 2, '#a27f57');
        rect(room.x + 9, room.y + room.h - 4, (barWidth * activity.percent) / 100, 2, room.color);
      }
    const guide = $('sector-guide');
    if (!guide) return;
    const role = window.FirmaStudio?.isOpen
        ? window.FirmaStudio.room === 'admin'
          ? 'development'
          : window.FirmaStudio.role
        : W.roomAt(state.player.x, state.player.y)?.id,
      activity = sectorActivity[role];
    const projectTasks = state.tasks.filter(
        (t) => !sceneOptions().admin || (t.projectId || 'firma') === sceneOptions().projectId,
      ),
      ready = projectTasks.filter((t) => ['review', 'done'].includes(t.status)).length,
      total = projectTasks.length,
      percent = total ? Math.round((ready / total) * 100) : 0;
    const values = activity
      ? [
          window.FirmaStudio?.isOpen && window.FirmaStudio.room === 'admin'
            ? 'Administrador'
            : W.rooms.find((r) => r.id === role).name,
          activity.label,
          activity.metric,
          activity.percent,
          activity.active,
        ]
      : [
          'Computadores dentro das salas',
          'Clique no computador ou aproxime-se e aperte E.',
          ready + '/' + total + ' entregas prontas · ' + percent + '%',
          percent,
          false,
        ];
    const key = JSON.stringify(values);
    if (key !== sectorGuideKey) {
      sectorGuideKey = key;
      $('sector-guide-title').textContent = values[0];
      $('sector-guide-state').textContent = values[1];
      $('sector-guide-state').dataset.live = String(values[4]);
      $('sector-guide-metric').textContent = values[2];
      $('sector-guide-meter').style.width = values[3] + '%';
    }
  }
  function workGesture(a, time, moving) {
    const role = a.id === 'codex-leader' ? 'leadership' : window.FirmaEngine.departmentOf(a),
      activity = sectorActivity[role];
    if (!activity?.active || moving || a.rest) return;
    const assigned =
      a.id === 'codex-leader' ||
      state.tasks.some(
        (t) =>
          t.agent === a.id &&
          t.status === 'working' &&
          (t.execution?.kind !== 'real' || t.execution.status === 'running'),
      ) ||
      window.FirmaStudio?.live.chatRunning?.role === role;
    if (!assigned) return;
    const step = reducedMotion.matches ? 0 : Math.floor(time * 4) % 2;
    rect(-13, -10 + step * 2, 5, 8, '#efc4a4');
    rect(11, -8 - step * 2, 5, 8, '#efc4a4');
    rect(-12, -58, 35, 17, '#49382d');
    text(
      {
        planning: 'PLANO',
        development: '{ }',
        testing: 'TESTE',
        publishing: 'POST',
        leadership: 'FLUXO',
      }[role],
      -8,
      -46,
      '#eff6ff',
      8,
    );
  }
  function drawOffice() {
    window.FirmaVillage.ground(ctx, W, state, animationTime, scenePrefs());
  }
  function project(point) {
    const bounds = canvas.getBoundingClientRect();
    return {
      x: bounds.left + viewport.width / 2 + (point.x - camera.x) * viewport.scale,
      y: bounds.top + viewport.height / 2 + (point.y - camera.y) * viewport.scale,
    };
  }
  let lastFrame = 0,
    animationTime = 0;
  function draw(timestamp) {
    const frameStart = performance.now(),
      dt = lastFrame ? Math.min((timestamp - lastFrame) / 1000, 0.05) : 0;
    lastFrame = timestamp;
    const motionOff =
      reducedMotion.matches || state.preferences?.reducedMotion || scenePrefs().reduceMotion;
    if (!ui.paused && !motionOff) animationTime += dt * state.speed;
    const visualTime = motionOff ? 0 : timestamp / 1000;
    const scopedState = sceneOptions().admin
      ? {
          ...state,
          tasks: state.tasks.filter((t) => (t.projectId || 'firma') === sceneOptions().projectId),
        }
      : state;
    sectorActivity = window.FirmaActivity.all(
      scopedState,
      window.FirmaStudio?.live || {},
      ui.paused,
    );
    updatePlayer(dt);
    updateHUD();
    viewport.scale =
      (viewport.width <= 540
        ? Math.max(viewport.width / W.width, viewport.height / 1000)
        : Math.min(viewport.width / W.width, viewport.height / W.height)) * zoom;
    const halfX = viewport.width / (2 * viewport.scale),
      halfY = viewport.height / (2 * viewport.scale);
    camera.x =
      halfX >= W.width / 2
        ? W.width / 2
        : Math.max(halfX, Math.min(W.width - halfX, state.player.x));
    camera.y =
      halfY >= W.height / 2
        ? W.height / 2
        : Math.max(halfY, Math.min(W.height - halfY, state.player.y));
    if (scenePrefs().camera === 'overview') {
      camera.x = W.width / 2;
      camera.y = W.height / 2;
      viewport.scale = Math.min(viewport.width / W.width, viewport.height / W.height) * zoom;
    }
    if (scenePrefs().camera === 'desk') {
      camera.x = 500;
      camera.y = 245;
      viewport.scale = Math.min(viewport.width / 340, viewport.height / 320) * zoom;
    }
    if (window.FirmaStudio?.isOpen) {
      const room = W.roomForStation(window.FirmaStudio.room || window.FirmaStudio.role),
        screen = $('studio').getBoundingClientRect();
      if (viewport.width > 900) {
        const visible = Math.max(100, viewport.width - screen.width - 28);
        viewport.scale = Math.max(viewport.scale, visible / (room.w + 50));
        camera.x = room.x + room.w / 2 + (viewport.width / 2 - visible / 2) / viewport.scale;
        camera.y =
          room.y +
          room.h / 2 +
          (room.id === 'leadership' ? 0 : (viewport.height * 0.2) / viewport.scale);
      } else {
        camera.x = room.x + room.w / 2;
        camera.y = room.y + room.h / 2 + (viewport.height / 2 - 48) / viewport.scale;
      }
    }
    ctx.setTransform(viewport.dpr, 0, 0, viewport.dpr, 0, 0);
    ctx.clearRect(0, 0, viewport.width, viewport.height);
    ctx.imageSmoothingEnabled = false;
    const pixelScale = Math.floor(viewport.scale * viewport.dpr);
    if (
      pixelScale >= 1 &&
      scenePrefs().camera === 'overview' &&
      Math.abs(viewport.scale * viewport.dpr - Math.round(viewport.scale * viewport.dpr)) < 0.09
    )
      viewport.scale = Math.round(viewport.scale * viewport.dpr) / viewport.dpr;
    ctx.save();
    ctx.translate(
      Math.round(viewport.width / 2 - camera.x * viewport.scale),
      Math.round(viewport.height / 2 - camera.y * viewport.scale),
    );
    ctx.scale(viewport.scale, viewport.scale);
    drawOffice();
    sectorEffects(visualTime);
    function advanceActor(a, target) {
      const mode = window.FirmaEngine.routine(state, a),
        presence = window.FirmaEngine.presence(state, a.id),
        targetKey = target.x + ',' + target.y;
      let p = positions.get(a.id);
      if (!p) {
        p = { ...homeFor(a), route: [], targetKey: '', presence: 'inside' };
        positions.set(a.id, p);
        if (presence === 'entering') Object.assign(p, W.exit);
        if (['entering', 'leaving'].includes(presence) && state.office.progress) {
          const travel = W.path(p, target);
          let prior = { x: p.x, y: p.y },
            length = 0;
          for (const n of travel) {
            length += Math.hypot(n.x - prior.x, n.y - prior.y);
            prior = n;
          }
          let remaining = (length * state.office.progress) / window.FirmaEngine.shiftSeconds;
          for (const n of travel) {
            const d = Math.hypot(n.x - p.x, n.y - p.y);
            if (remaining >= d) {
              Object.assign(p, n);
              remaining -= d;
            } else {
              if (d)
                Object.assign(p, {
                  x: p.x + ((n.x - p.x) * remaining) / d,
                  y: p.y + ((n.y - p.y) * remaining) / d,
                });
              break;
            }
          }
        }
      }
      if (p.presence === 'outside' && presence === 'entering') {
        Object.assign(p, W.exit);
        p.targetKey = '';
      }
      p.presence = presence;
      p.visible = presence !== 'outside';
      p.mode = mode;
      if (!p.visible) {
        p.route = [];
        p.targetKey = '';
        return { a, p, moving: false, sitting: false, hidden: true };
      }
      if (targetKey !== p.targetKey) {
        p.route = W.path(p, target);
        p.targetKey = targetKey;
      }
      if (p.route.length) {
        let budget = (['entering', 'leaving'].includes(presence) ? 180 : 70) * dt;
        while (p.route.length && budget > 0.01) {
          const point = p.route[0],
            distance = Math.hypot(point.x - p.x, point.y - p.y);
          if (distance < 0.1) {
            p.route.shift();
            continue;
          }
          const amount = Math.min(distance, budget),
            mx = ((point.x - p.x) / distance) * amount,
            my = ((point.y - p.y) / distance) * amount,
            moved = W.move(p, mx, my);
          p.facing =
            Math.abs(mx) > Math.abs(my) ? (mx > 0 ? 'right' : 'left') : my > 0 ? 'down' : 'up';
          if (Math.hypot(moved.x - p.x, moved.y - p.y) < 0.0001) {
            p.targetKey = '';
            p.route = [];
            break;
          }
          Object.assign(p, moved);
          budget -= amount;
          if (amount >= distance - 0.01) p.route.shift();
        }
      }
      const moving = !!p.route.length,
        sitting =
          !moving &&
          Math.hypot(p.x - target.x, p.y - target.y) < 1 &&
          (mode === 'desk' || mode === 'rest');
      p.sitting = sitting;
      return { a, p, moving, sitting };
    }
    for (const id of positions.keys())
      if (id !== leader.id && !state.agents.some((a) => a.id === id)) positions.delete(id);
    const renderAgents = state.agents
      .map((a) => advanceActor(a, targetFor(a)))
      .filter((actor) => !actor.hidden);
    const codex = advanceActor(leader, targetFor(leader));
    if (!codex.hidden) renderAgents.push(codex);
    renderAgents.sort((a, b) => a.p.y - b.p.y);
    const objects = window.FirmaVillage.objects(W, state, scenePrefs()),
      drawables = [
        ...objects,
        { id: 'player', y: state.player.y + 10, draw: () => drawPlayer(visualTime) },
      ];
    hitItems = [...Object.values(W.playerSeats), ...W.stations].map((s) => ({
      id: 'station:' + s.id,
      y: s.area.y + s.area.h + 6,
      area: s.area,
      target: s,
    }));
    for (const { a, p, moving, sitting } of renderAgents) {
      drawables.push({
        id: 'actor:' + a.id,
        y: p.y + 10,
        layer: 1,
        draw: () => {
          ctx.save();
          ctx.translate(Math.round(p.x), Math.round(p.y));
          const scale = W.layoutScale * (a.id === 'codex-leader' ? 1 : 0.85);
          ctx.scale(scale, scale);
          character(0, 0, a, animationTime, moving, sitting, {
            ...p,
            facing: !moving && sitting ? 'down' : p.facing,
          });
          ctx.restore();
        },
      });
      hitItems.push({
        id: 'actor:' + a.id,
        y: p.y + 10,
        area: { x: p.x - 13, y: p.y - 35, w: 26, h: 49 },
        target:
          a.id === 'codex-leader'
            ? W.stations.find((s) => s.id === 'leadership')
            : { agent: a.id, name: a.name, verb: 'Conversar com ' + a.name },
      });
    }
    const ordered = window.FirmaScene.depth(drawables);
    sceneOrder = ordered.map((item) => item.id);
    for (const item of ordered) item.draw(ctx);
    window.FirmaVillage.lighting(ctx, W, state, scenePrefs());
    drawStationMarkers();
    const placed = [];
    function nameplate(name, x, y, force = false) {
      const width = Math.min(name.length, 17) * 4.3 + 10;
      for (let attempt = 0; attempt < 3; attempt++) {
        const bounds = { x: x - width / 2, y: y + attempt * 12, w: width, h: 11 };
        if (
          !placed.some(
            (b) =>
              b.x < bounds.x + bounds.w &&
              b.x + b.w > bounds.x &&
              b.y < bounds.y + bounds.h &&
              b.y + b.h > bounds.y,
          )
        ) {
          placed.push(bounds);
          rect(bounds.x, bounds.y, bounds.w, 11, '#453c32');
          rect(bounds.x + 1, bounds.y + 1, bounds.w - 2, 9, '#f0dfb8');
          text(name.slice(0, 17), bounds.x + 4, bounds.y + 8, '#544635', 7);
          return;
        }
      }
    }
    for (const { a, p } of renderAgents) {
      const status = window.FirmaScene.indicator(state, a.id, sceneOptions()),
        selected =
          hovered?.target?.agent === a.id ||
          (hovered?.target?.id === 'leadership' && a.id === leader.id);
      if (scenePrefs().mode === 'work' || selected) nameplate(a.name, p.x, p.y + 19);
      if (status.symbol && (scenePrefs().mode === 'work' || selected)) {
        const x = p.x + 8,
          y = p.y - 49;
        rect(x, y, 14, 12, status.kind === 'error' ? '#9b5843' : '#756c46');
        text(status.symbol, x + 3, y + 9, '#fff0c9', 9);
        hitItems.push({
          id: 'badge:' + a.id,
          y: p.y + 100,
          area: { x, y, w: 14, h: 12 },
          target: { agent: a.id, name: a.name, verb: status.label },
          taskId: status.taskId,
        });
      }
    }
    nameplate(state.player.name, state.player.x, state.player.y + 20, true);
    for (const speech of window.FirmaEngine.dialogue(state)) {
      if (speech.taskId && !window.FirmaScene.resolveTask(state, speech.taskId, sceneOptions()))
        continue;
      const p = positions.get(speech.id);
      if (!p || !p.visible) continue;
      const message = speech.text,
        words = message.split(' '),
        lines = [];
      let row = '';
      for (const word of words) {
        if ((row + ' ' + word).trim().length > 23) {
          lines.push(row);
          row = word;
        } else row = (row + ' ' + word).trim();
      }
      if (row) lines.push(row);
      const width = Math.max(...lines.map((s) => s.length)) * 4.7 + 14,
        height = lines.length * 10 + 10,
        x = Math.max(8, Math.min(W.width - width - 8, p.x - width / 2)),
        y = Math.max(8, p.y - 56 - height);
      rect(x, y, width, height, '#67553c');
      rect(x + 2, y + 2, width - 4, height - 4, '#fff0c9');
      rect(p.x - 2, y + height, 4, 4, '#67553c');
      lines.forEach((s, i) => text(s, x + 7, y + 12 + i * 10, '#6c5436', 8));
    }
    if (pointer && !$('modal').open && !window.FirmaStudio?.isOpen) {
      const b = canvas.getBoundingClientRect();
      hovered = pick(
        (pointer.x - b.left - viewport.width / 2) / viewport.scale + camera.x,
        (pointer.y - b.top - viewport.height / 2) / viewport.scale + camera.y,
      );
    }
    if (hovered && !$('modal').open && !window.FirmaStudio?.isOpen) {
      const b = hovered.area;
      ctx.strokeStyle = '#fff0bd';
      ctx.lineWidth = 1;
      ctx.strokeRect(b.x - 2, b.y - 2, b.w + 4, b.h + 4);
      const name = hovered.target.name || 'Objeto';
      readout.hidden = false;
      readout.querySelector('strong').textContent = name;
      readout.querySelector('small').textContent = hovered.target.verb || 'Abrir';
      readout.querySelector('button').textContent = hovered.taskId
        ? 'Ver tarefa'
        : hovered.target.seat
          ? 'Sentar'
          : 'Abrir';
      canvas.style.cursor = 'pointer';
    } else {
      readout.hidden = true;
      canvas.style.cursor = 'default';
    }
    ctx.restore();
    lastRenderMs = performance.now() - frameStart;
    frameSamples++;
    frameTotal += lastRenderMs;
    requestAnimationFrame(draw);
  }
  canvas.onclick = (e) => {
    if ($('modal').open) return;
    const bounds = canvas.getBoundingClientRect(),
      x = (e.clientX - bounds.left - viewport.width / 2) / viewport.scale + camera.x,
      y = (e.clientY - bounds.top - viewport.height / 2) / viewport.scale + camera.y;
    if (window.FirmaStudio?.isOpen) window.FirmaStudio.close();
    if (x < W.bounds.left || x > W.bounds.right || y < W.bounds.top || y > W.bounds.bottom) return;
    const picked = pick(x, y);
    if (picked) {
      activateHit(picked);
      return;
    }
    stand();
    pending = null;
    route = W.path(state.player, { x, y });
    if (route.length) {
      $('route-status').textContent = 'Caminhando · Esc cancela';
      canvas.focus({ preventScroll: true });
    }
  };
  window.FirmaGame = {
    get player() {
      return state.player;
    },
    get moving() {
      return walking || route.length > 0;
    },
    get destination() {
      return pending?.id || pending?.agent || null;
    },
    get seated() {
      return seated;
    },
    get leaderPosition() {
      const p = positions.get(leader.id);
      return p && p.visible !== false ? { x: p.x, y: p.y, moving: !!p.route.length } : null;
    },
    get agentPositions() {
      return [...positions]
        .filter(([id, p]) => id !== leader.id && p.visible !== false)
        .map(([id, p]) => ({
          id,
          x: p.x,
          y: p.y,
          mode: p.mode,
          sitting: !!p.sitting,
          moving: !!p.route.length,
        }));
    },
    sit,
    stand,
    goTo,
    project,
    interact: interactNearby,
  };
  Object.defineProperty(window.FirmaGame, 'sectorActivity', { get: () => sectorActivity });
  window.FirmaGame.setCamera = (mode) => {
    zoom = scenePrefs().zoom;
    if (!['overview', 'follow', 'desk'].includes(mode)) return;
    window.FirmaSceneUI.set({ camera: mode });
  };
  Object.defineProperty(window.FirmaGame, 'sceneDebug', {
    get: () => ({
      camera: { ...camera, mode: scenePrefs().camera },
      scale: viewport.scale,
      animationTime,
      averageRenderMs: frameTotal / Math.max(frameSamples, 1),
      lastRenderMs,
      hitIds: hitItems.map((i) => i.id),
      drawOrder: sceneOrder,
    }),
  });
  window.FirmaGame.openStation = (id, tab = 'code') =>
    openRemote(typeof id === 'string' ? W.stations.find((s) => s.id === id) : id, tab);
  setZoom(zoom);
  requestAnimationFrame(draw);
})();
