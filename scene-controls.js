/* Local scene controls and opt-in synthesized audio. No provider or network calls. */
(() => {
  'use strict';
  const U = window.FirmaUI,
    M = window.FirmaScene,
    $ = (id) => document.getElementById(id),
    esc = (s) =>
      String(s ?? '').replace(
        /[&<>"']/g,
        (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
      );
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem('firma-scene-v1') || '{}');
  } catch {}
  let prefs = M.preferences({
      camera: matchMedia('(max-width:540px)').matches ? 'follow' : 'overview',
      zoom: matchMedia('(max-width:540px)').matches ? 1.7 : 1,
      ...saved,
    }),
    audio = null,
    gain = null,
    source = null,
    soundTimer = null,
    teamKey = '';
  function set(change) {
    prefs = M.preferences({ ...prefs, ...change });
    try {
      localStorage.setItem('firma-scene-v1', JSON.stringify(prefs));
    } catch {}
    render();
    window.dispatchEvent(new Event('firma-scene-change'));
    return prefs;
  }
  function render() {
    document.body.dataset.sceneMode = prefs.mode;
    document
      .querySelectorAll('button[data-scene-mode]')
      .forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.sceneMode === prefs.mode)));
    document
      .querySelectorAll('[data-scene-camera]')
      .forEach((b) =>
        b.setAttribute('aria-pressed', String(b.dataset.sceneCamera === prefs.camera)),
      );
    if (gain) gain.gain.value = document.hidden ? 0 : (prefs.volume / 100) * 0.045;
  }
  async function sound(enable) {
    if (!enable) {
      clearInterval(soundTimer);
      soundTimer = null;
      if (audio) await audio.suspend();
      return;
    }
    if (!audio) {
      const Constructor = window.AudioContext || window.webkitAudioContext;
      if (!Constructor) throw Error('Áudio indisponível neste navegador.');
      audio = new Constructor();
      gain = audio.createGain();
      gain.connect(audio.destination);
      const buffer = audio.createBuffer(1, audio.sampleRate * 2, audio.sampleRate),
        samples = buffer.getChannelData(0);
      let prior = 0;
      for (let i = 0; i < samples.length; i++) {
        prior = (prior + Math.random() * 0.03 - 0.015) / 1.02;
        samples[i] = prior;
      }
      source = audio.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      const filter = audio.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 750;
      source.connect(filter);
      filter.connect(gain);
      source.start();
    }
    await audio.resume();
    clearInterval(soundTimer);
    soundTimer = setInterval(() => {
      if (document.hidden || audio.state !== 'running' || U.state.office.status !== 'open') return;
      const tone = audio.createOscillator(),
        envelope = audio.createGain(),
        start = audio.currentTime;
      tone.type = 'sine';
      tone.frequency.setValueAtTime(1100, start);
      tone.frequency.exponentialRampToValueAtTime(1650, start + 0.09);
      envelope.gain.setValueAtTime(0, start);
      envelope.gain.linearRampToValueAtTime(0.08, start + 0.03);
      envelope.gain.exponentialRampToValueAtTime(0.001, start + 0.22);
      tone.connect(envelope);
      envelope.connect(gain);
      tone.start(start);
      tone.stop(start + 0.24);
    }, 5800);
    render();
  }
  document.addEventListener('visibilitychange', () => {
    if (!audio) return;
    if (document.hidden) audio.suspend();
    else if (prefs.sound) audio.resume().catch(() => {});
    render();
  });
  window.addEventListener('pagehide', () => {
    clearInterval(soundTimer);
    audio?.close();
  });
  function configure() {
    const p = prefs;
    U.openModal(
      'Seu cenário',
      `<p class="detail-note">Preferências deste navegador. Decoração e encontros são parte da simulação.</p><div class="form-grid"><label>Madeira das mesas<select name="material">${[
        ['oak', 'Carvalho'],
        ['walnut', 'Nogueira'],
        ['cream', 'Madeira clara'],
      ]
        .map(([v, n]) => `<option value="${v}" ${p.material === v ? 'selected' : ''}>${n}</option>`)
        .join('')}</select></label><label>Tapete da sua mesa<select name="rug">${[
        ['sage', 'Verde sálvia'],
        ['clay', 'Terracota'],
        ['straw', 'Palha'],
      ]
        .map(([v, n]) => `<option value="${v}" ${p.rug === v ? 'selected' : ''}>${n}</option>`)
        .join('')}</select></label></div><label>Iluminação<select name="lighting">${[
        ['auto', 'Conforme o expediente'],
        ['day', 'Dia'],
        ['evening', 'Fim de tarde'],
      ]
        .map(([v, n]) => `<option value="${v}" ${p.lighting === v ? 'selected' : ''}>${n}</option>`)
        .join(
          '',
        )}</select></label><label class="company-check"><input name="plant" type="checkbox" ${p.plant ? 'checked' : ''}>Plantas nas mesas principais</label><label class="company-check"><input name="lamp" type="checkbox" ${p.lamp ? 'checked' : ''}>Luminárias e luz quente</label><label class="company-check"><input name="reduceMotion" type="checkbox" ${p.reduceMotion ? 'checked' : ''}>Reduzir animações decorativas neste navegador</label><label class="company-check"><input name="sound" type="checkbox" ${p.sound ? 'checked' : ''}>Som ambiente suave (vento e pássaros sintetizados)</label><label>Volume do ambiente<input name="volume" type="range" min="0" max="100" value="${p.volume}"></label><p class="detail-note">O som começa somente após esta ação. A opção de movimento reduzido da empresa e a preferência do sistema também são respeitadas.</p>`,
      'Aplicar ao cenário',
      async (form) => {
        const next = {
          ...Object.fromEntries(form),
          plant: form.has('plant'),
          lamp: form.has('lamp'),
          reduceMotion: form.has('reduceMotion'),
          sound: form.has('sound'),
          volume: Number(form.get('volume')),
        };
        try {
          await sound(next.sound);
        } catch (error) {
          next.sound = false;
          U.toast(error.message);
        }
        set(next);
      },
    );
  }
  const toolbar = document.createElement('nav');
  toolbar.className = 'scene-view-toolbar';
  toolbar.setAttribute('aria-label', 'Visualização do escritório');
  toolbar.innerHTML =
    '<div><button type="button" data-scene-mode="ambient" aria-pressed="true">Ambiente</button><button type="button" data-scene-mode="work" aria-pressed="false">Trabalho</button></div><div><button type="button" data-scene-camera="overview" title="Enquadrar todo o escritório">Ver tudo</button><button type="button" data-scene-camera="follow" title="Acompanhar seu personagem">Seguir</button><button type="button" data-scene-camera="desk">Minha mesa</button></div>';
  document.querySelector('.office-scene').append(toolbar);
  const tools = document.createElement('details');
  tools.className = 'scene-tools';
  tools.innerHTML =
    '<summary>Cenário e equipe</summary><div class="scene-tools-popover"><button type="button" id="scene-customize">Personalizar cenário</button><button type="button" id="scene-audio">Ativar som ambiente</button><h3>Escolher um colega</h3><p>Abra a conversa ou veja uma pendência do projeto ativo.</p><div id="scene-team"></div></div>';
  document
    .querySelector('.game-controls')
    .insertBefore(tools, document.querySelector('.office-destinations'));
  $('scene-customize').onclick = () => {
    tools.open = false;
    configure();
  };
  $('scene-audio').onclick = async () => {
    try {
      const enable = !audio || audio.state !== 'running';
      await sound(enable);
      set({ sound: enable });
      $('scene-audio').textContent = enable ? 'Silenciar ambiente' : 'Ativar som ambiente';
    } catch (error) {
      U.toast(error.message);
    }
  };
  document.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.sceneMode) set({ mode: b.dataset.sceneMode });
    if (b.dataset.sceneCamera) {
      set({
        camera: b.dataset.sceneCamera,
        zoom: b.dataset.sceneCamera === 'overview' ? 1 : prefs.zoom,
      });
      window.FirmaGame?.setCamera(b.dataset.sceneCamera);
    }
    if (b.dataset.sceneAgent) {
      tools.open = false;
      U.agentDetail(b.dataset.sceneAgent);
    }
    if (b.dataset.sceneTask) {
      const options = {
          admin: window.FirmaAccess.isAdmin,
          projectId: window.FirmaProjects?.current || 'firma',
        },
        task = M.resolveTask(U.state, b.dataset.sceneTask, options);
      if (task) {
        tools.open = false;
        U.taskDetail(task.id);
      }
    }
  });
  function renderTeam() {
    const options = {
        admin: window.FirmaAccess.isAdmin,
        projectId: window.FirmaProjects?.current || 'firma',
      },
      rows = U.state.agents.map((a) => ({
        id: a.id,
        name: a.name,
        role: a.role,
        indicator: M.indicator(U.state, a.id, options),
      })),
      key = JSON.stringify(rows);
    if (key === teamKey) return;
    teamKey = key;
    $('scene-team').innerHTML = rows
      .map(
        (a) =>
          `<div><button type="button" data-scene-agent="${esc(a.id)}"><b>${esc(a.name)}</b><small>${esc(a.role)} · ${esc(a.indicator.label)}</small></button>${a.indicator.taskId ? `<button type="button" data-scene-task="${esc(a.indicator.taskId)}" aria-label="Abrir pendência de ${esc(a.name)}">${esc(a.indicator.symbol)} Ver tarefa</button>` : ''}</div>`,
      )
      .join('');
  }
  window.FirmaSceneUI = {
    get prefs() {
      return prefs;
    },
    set,
    configure,
    get audioState() {
      return audio?.state || 'off';
    },
  };
  render();
  renderTeam();
  window.addEventListener('firma-project-changed', renderTeam);
  setInterval(renderTeam, 1000);
})();
