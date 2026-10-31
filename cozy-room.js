/* The reference room is the playable entrance. Original departmental tools stay available. */
(() => {
  'use strict';
  const M = window.FirmaCozyModel,
    U = window.FirmaUI,
    $ = (id) => document.getElementById(id),
    scene = document.querySelector('.office-scene');
  const background = new Image();
  let active = false,
    loaded = false,
    zoom = 1,
    last = 0,
    time = 0;
  const player = { ...M.spawn, facing: 'down', route: [] },
    keys = new Set(),
    guests = new Map();
  const canvas = document.createElement('canvas');
  canvas.className = 'cozy-room-canvas';
  canvas.tabIndex = 0;
  canvas.setAttribute(
    'aria-label',
    'Sala principal em pixel art: janelas ao fundo, sofá à direita, mesa do Igor à esquerda e mesa do Codex à direita. Clique no chão ou use WASD e setas para caminhar; E para interagir.',
  );
  canvas.hidden = true;
  scene.append(canvas);
  const ctx = canvas.getContext('2d');
  const tabs = document.createElement('div');
  tabs.className = 'cozy-room-tabs';
  tabs.setAttribute('aria-label', 'Ambientes do escritório');
  tabs.innerHTML =
    '<button type="button" data-room-mode="home" aria-pressed="true">Sala principal</button><button type="button" data-room-mode="sectors" aria-pressed="false">Setores e equipe</button>';
  scene.append(tabs);
  const bar = document.createElement('nav');
  bar.className = 'cozy-room-stations';
  bar.setAttribute('aria-label', 'Computadores dos setores');
  bar.innerHTML =
    '<span>Acessar setor</span>' +
    [
      ['planning', '◇', 'Planejar'],
      ['development', '⌘', 'Desenvolver'],
      ['testing', '✓', 'Testar'],
      ['publishing', '↗', 'Publicar'],
    ]
      .map(
        ([id, icon, label]) =>
          '<button type="button" data-cozy-station="' +
          id +
          '"><b aria-hidden="true">' +
          icon +
          '</b>' +
          label +
          '</button>',
      )
      .join('');
  scene.append(bar);
  const caption = document.createElement('div');
  caption.className = 'cozy-room-caption';
  caption.setAttribute('role', 'log');
  caption.setAttribute('aria-live', 'off');
  caption.hidden = true;
  scene.append(caption);
  const view = { w: 1, h: 1, scale: 1, x: 0, y: 0, dpr: 1 };
  function resize() {
    const b = canvas.getBoundingClientRect();
    if (!b.width || !b.height) return;
    view.w = b.width;
    view.h = b.height;
    view.dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(b.width * view.dpr);
    canvas.height = Math.round(b.height * view.dpr);
  }
  new ResizeObserver(resize).observe(canvas);
  resize();
  function setMode(value) {
    active = value === 'home' && loaded;
    document.body.classList.toggle('cozy-room-active', active);
    canvas.hidden = !active;
    resize();
    caption.hidden = true;
    keys.clear();
    player.route = [];
    if (!active) window.dispatchEvent(new Event('firma-player-changed'));
    window.dispatchEvent(new Event('blur'));
    for (const b of tabs.querySelectorAll('button'))
      b.setAttribute('aria-pressed', String((b.dataset.roomMode === 'home') === active));
    if (active) canvas.focus({ preventScroll: true });
  }
  tabs.onclick = (e) => {
    const b = e.target.closest('[data-room-mode]');
    if (b) setMode(b.dataset.roomMode);
  };
  bar.onclick = (e) => {
    const b = e.target.closest('[data-cozy-station]');
    if (b) {
      keys.clear();
      openStation(b.dataset.cozyStation);
    }
  };
  function modalOpen() {
    return !!document.querySelector('dialog[open]');
  }
  function facing(dx, dy) {
    return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
  }
  function advanceActor(p, dt, speed) {
    let moving = false,
      budget = speed * dt;
    while (p.route.length && budget > 0) {
      const q = p.route[0],
        d = Math.hypot(q.x - p.x, q.y - p.y);
      if (d < 0.1) {
        p.route.shift();
        continue;
      }
      const n = Math.min(d, budget),
        dx = ((q.x - p.x) * n) / d,
        dy = ((q.y - p.y) * n) / d,
        next = M.move(p, dx, dy);
      if (Math.hypot(next.x - p.x, next.y - p.y) < 0.001) {
        p.route = [];
        break;
      }
      p.facing = facing(dx, dy);
      Object.assign(p, next);
      budget -= n;
      moving = true;
      if (n >= d - 0.01) p.route.shift();
    }
    return moving;
  }
  function moveTo(point) {
    const end = M.nearest(point);
    if (!end) return;
    const route = M.path(player, end);
    if (!route.length) {
      U.toast('Escolha um ponto livre no piso.');
      return;
    }
    player.route = route;
    canvas.focus({ preventScroll: true });
  }
  function actorAppearance(a) {
    return (
      window.FirmaLife?.appearance(U.state, a) || {
        color: a.color,
        skin: '#dfb087',
        hair: '#1e2338',
        pants: '#263b59',
        shoes: '#172134',
      }
    );
  }
  const hosts = [
    {
      id: 'igor-host',
      name: 'Igor',
      x: 185,
      y: 490,
      facing: 'up',
      role: 'Anfitrião',
      color: '#eff0ef',
    },
    {
      id: 'codex-leader',
      name: 'Codex',
      x: 783,
      y: 527,
      facing: 'up',
      role: 'Assistente',
      color: '#a5bdd1',
    },
  ];
  function openStation(id) {
    if (window.FirmaAccess.isAdmin) setMode('sectors');
    window.FirmaGame.openStation(id);
  }
  function openActor(id) {
    if (id === 'codex-leader') openStation('leadership');
    else U.agentDetail(id);
  }
  function hit(point) {
    for (const a of [...hosts, ...guests.values()])
      if (Math.abs(point.x - a.x) < 45 && point.y > a.y - 115 && point.y < a.y + 15)
        return { type: 'actor', id: a.id, name: a.name };
    if (point.x > 70 && point.x < 285 && point.y > 300)
      return { type: 'actor', id: 'igor-host', name: 'Igor' };
    if (point.x > 630 && point.x < 935 && point.y > 345)
      return { type: 'actor', id: 'codex-leader', name: 'Codex' };
    if (point.x > 690 && point.x < 885 && point.y > 205 && point.y < 340)
      return { type: 'conversation', name: 'Equipe e conversas' };
    if (point.y < 185) return { type: 'management', name: 'Gestão do escritório' };
    return null;
  }
  function activate(item) {
    keys.clear();
    if (!item) return;
    if (item.type === 'actor') openActor(item.id);
    else if (item.type === 'conversation') $('office-life-button').click();
    else if (item.type === 'management') $('management-button').click();
  }
  function near() {
    const list = [...hosts, ...guests.values()]
      .map((a) => ({ ...a, d: Math.hypot(a.x - player.x, a.y - player.y) }))
      .sort((a, b) => a.d - b.d);
    return list[0]?.d < (hosts.some((h) => h.id === list[0]?.id) ? 205 : 145)
      ? { type: 'actor', id: list[0].id, name: list[0].name }
      : null;
  }
  canvas.addEventListener('pointerup', (e) => {
    if (!active || modalOpen()) return;
    const b = canvas.getBoundingClientRect(),
      p = {
        x: (e.clientX - b.left - view.x) / view.scale,
        y: (e.clientY - b.top - view.y) / view.scale,
      };
    if (p.x < 0 || p.x > M.width || p.y < 0 || p.y > M.height) return;
    const item = hit(p);
    if (item) activate(item);
    else moveTo(p);
  });
  canvas.addEventListener(
    'wheel',
    (e) => {
      if (!active) return;
      e.preventDefault();
      zoom = Math.min(2.4, Math.max(1, zoom + (e.deltaY < 0 ? 0.1 : -0.1)));
    },
    { passive: false },
  );
  const dirs = {
    w: [0, -1],
    arrowup: [0, -1],
    s: [0, 1],
    arrowdown: [0, 1],
    a: [-1, 0],
    arrowleft: [-1, 0],
    d: [1, 0],
    arrowright: [1, 0],
  };
  document.addEventListener(
    'keydown',
    (e) => {
      if (
        !active ||
        modalOpen() ||
        e.ctrlKey ||
        e.metaKey ||
        e.altKey ||
        e.target.closest('input,select,textarea,button,summary,a,[contenteditable]')
      )
        return;
      const k = e.key.toLowerCase();
      if (dirs[k]) {
        e.preventDefault();
        e.stopImmediatePropagation();
        keys.add(k);
        player.route = [];
      } else if (k === 'e') {
        e.preventDefault();
        e.stopImmediatePropagation();
        activate(near());
      } else if (k === 'escape') {
        keys.clear();
        player.route = [];
      }
    },
    true,
  );
  document.addEventListener(
    'keyup',
    (e) => {
      if (active) {
        keys.delete(e.key.toLowerCase());
      }
    },
    true,
  );
  window.addEventListener('blur', () => keys.clear());
  $('interact-button').addEventListener(
    'click',
    (e) => {
      if (active) {
        e.preventDefault();
        e.stopImmediatePropagation();
        activate(near());
      }
    },
    true,
  );
  for (const [id, delta] of [
    ['zoom-in', 0.15],
    ['zoom-out', -0.15],
  ])
    $(id)?.addEventListener(
      'click',
      (e) => {
        if (active) {
          e.preventDefault();
          e.stopImmediatePropagation();
          zoom = Math.min(2.4, Math.max(1, zoom + delta));
        }
      },
      true,
    );
  $('world-destinations')?.addEventListener(
    'click',
    (e) => {
      const b = e.target.closest('[data-destination]');
      if (active && b) {
        e.preventDefault();
        e.stopImmediatePropagation();
        openStation(b.dataset.destination);
      }
    },
    true,
  );
  function renderActor(a, moving = false, h = 104, appearance = null) {
    ctx.save();
    ctx.translate(a.x, a.y - (12 * h) / 62);
    ctx.scale(h / 62, h / 62);
    window.FirmaChibi.draw(ctx, {
      colleagueAppearance: appearance || actorAppearance(a),
      name: a.name,
      time,
      phase: String(a.id)
        .split('')
        .reduce((n, c) => n + c.charCodeAt(0), 0),
      facing: a.facing || 'down',
      walking: moving,
      sitting: !!a.sitting,
      animation: a.sitting ? 'typing' : 'idle',
      workReduced:
        window.FirmaSceneUI?.prefs.reduceMotion ||
        matchMedia('(prefers-reduced-motion: reduce)').matches,
    });
    ctx.restore();
  }
  function nameplate(a) {
    ctx.font = '600 14px monospace';
    ctx.textAlign = 'center';
    const w = ctx.measureText(a.name).width + 16;
    ctx.fillStyle = '#23354bdc';
    ctx.fillRect(a.x - w / 2, a.y + 5, w, 22);
    ctx.fillStyle = '#f4efe4';
    ctx.fillText(a.name, a.x, a.y + 21);
  }
  function draw(timestamp) {
    const dt = last ? Math.min(0.05, (timestamp - last) / 1000) : 0;
    last = timestamp;
    requestAnimationFrame(draw);
    if (!active || !loaded) return;
    const reduced =
        window.FirmaSceneUI?.prefs.reduceMotion ||
        U.state.preferences?.reducedMotion ||
        matchMedia('(prefers-reduced-motion: reduce)').matches,
      paused = U.paused || document.hidden;
    const amount = paused ? 0 : dt;
    if (!reduced) time += amount;
    if (modalOpen()) keys.clear();
    let walking = false;
    if (!modalOpen() && amount) {
      let dx = 0,
        dy = 0;
      for (const k of keys) {
        dx += dirs[k]?.[0] || 0;
        dy += dirs[k]?.[1] || 0;
      }
      if (dx || dy) {
        const len = Math.hypot(dx, dy),
          next = M.move(player, (dx / len) * 155 * amount, (dy / len) * 155 * amount);
        walking = Math.hypot(next.x - player.x, next.y - player.y) > 0.01;
        player.facing = facing(dx, dy);
        Object.assign(player, next);
      } else walking = advanceActor(player, amount, 150);
    }
    const life = window.FirmaLife,
      { story, phase } = life.current(),
      roster = life.roster(U.state),
      ids = story.ids;
    for (const id of guests.keys()) if (!ids.includes(id)) guests.delete(id);
    for (let side = 0; side < ids.length; side++) {
      const id = ids[side],
        a = roster.find((a) => a.id === id);
      if (!a) continue;
      let guest = guests.get(id);
      if (!guest) {
        guest = { ...a, x: side ? 650 : 360, y: 205, facing: 'down', route: [], target: '' };
        guests.set(id, guest);
      }
      const target = phase < 68 ? { x: side ? 540 : 470, y: 265 } : { x: side ? 650 : 360, y: 200 },
        key = target.x + ',' + target.y;
      if (guest.target !== key) {
        guest.route = M.path(guest, target);
        guest.target = key;
      }
      guest.moving = !reduced && advanceActor(guest, amount, 95);
      guest.visible = phase < 78 || guest.route.length > 0;
      if (!guest.route.length && phase < 68) guest.facing = side ? 'left' : 'right';
    }
    const positions = new Map(
      [...guests].map(([id, p]) => [id, { ...p, visible: p.visible, route: p.route }]),
    );
    life.record(U.state, positions);
    const speech = life.speech(U.state, positions)[0];
    caption.hidden = !speech;
    if (speech) caption.textContent = speech.name + ': ' + speech.text;
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    ctx.clearRect(0, 0, view.w, view.h);
    ctx.imageSmoothingEnabled = false;
    view.scale = Math.min(view.w / M.width, view.h / M.height) * zoom;
    view.x = (view.w - M.width * view.scale) / 2;
    view.y = (view.h - M.height * view.scale) / 2;
    if (zoom > 1) {
      view.x = Math.min(
        0,
        Math.max(view.w - M.width * view.scale, view.w / 2 - player.x * view.scale),
      );
      view.y = Math.min(
        0,
        Math.max(view.h - M.height * view.scale, view.h / 2 - player.y * view.scale),
      );
    }
    ctx.save();
    ctx.translate(view.x, view.y);
    ctx.scale(view.scale, view.scale);
    ctx.drawImage(background, 0, 0, M.width, M.height);
    for (const [host, screen] of [
      [hosts[0], { x: 148, y: 317, w: 75, h: 36 }],
      [hosts[1], { x: 739, y: 362, w: 83, h: 44 }],
    ]) {
      ctx.save();
      ctx.translate(screen.x, screen.y);
      ctx.scale(screen.w / 21, screen.h / 12);
      window.FirmaWorkAnimation.screen(
        ctx,
        { x: 0, y: 0, w: 21, h: 12 },
        'development',
        time,
        String(host.id).length,
        reduced,
      );
      ctx.restore();
    }
    const actors = [
      ...hosts.map((a) => ({ ...a, sitting: true })),
      ...[...guests.values()].filter((a) => a.visible),
      {
        id: 'visitor',
        name: window.FirmaAvatar?.get().name || 'Visitante',
        ...player,
        visitor: true,
        moving: walking,
      },
    ].sort((a, b) => a.y - b.y);
    for (const a of actors) {
      const appearance = a.visitor
        ? window.FirmaAvatar.get()
        : a.id === 'igor-host'
          ? { ...actorAppearance(a), color: '#f0f1f4', shirtStyle: 'plain', hair: '#202438' }
          : a.id === 'codex-leader'
            ? { ...actorAppearance(a), color: '#a4bbce', hair: '#2a3143' }
            : null;
      renderActor(a, a.moving, a.visitor ? 126 : 104, appearance);
      if (a.id === 'igor-host' || a.id === 'codex-leader') nameplate(a);
    }
    ctx.restore();
    $('player-location').textContent = 'Sala principal';
    $('route-status').textContent = 'Clique para caminhar · E para conversar';
    const item = near();
    $('interact-button').disabled = !item;
    $('interact-button').textContent = item
      ? 'E · Conversar com ' + item.name
      : 'Explore a sala ou clique nos computadores';
    $('player-name').textContent = (window.FirmaAvatar?.get().name || 'Visitante') + ' · Visitante';
  }
  window.FirmaRoom = {
    get active() {
      return active;
    },
    setMode,
  };
  background.onload = () => {
    window.FirmaChibi.loaded
      .then(() => {
        loaded = true;
        setMode('home');
      })
      .catch((error) => U.toast(error.message));
  };
  background.onerror = () => {
    tabs.hidden = true;
    U.toast('A arte da sala não carregou. Os setores continuam disponíveis.');
  };
  background.src = 'public-art/cozy-room.png?v=cozy-1';
  requestAnimationFrame(draw);
})();
