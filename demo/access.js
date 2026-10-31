/* Public portfolio preview: fresh sample state, no accounts or API requests. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const E = window.FirmaEngine;
  const state = E.create();
  state.onboarded = true;
  let started = false;
  let revision = 1;
  let lastRead = performance.now();
  const description = 'Explore o cenário, caminhe e conheça a equipe. Esta demonstração usa dados de exemplo e simulação local; não chama serviços de IA.';
  const unavailable = () => Promise.reject(new Error('Recurso da versão com servidor. Nesta demonstração, explore o escritório e a equipe sem login ou chamadas de IA.'));
  const snapshot = () => ({ state: JSON.parse(JSON.stringify(state)), revision, paused: false, role: 'visitor' });
  const about = () => window.FirmaUI.openModal('Sobre esta demonstração', '<p class="detail-description">O cenário, os personagens, a navegação e os diálogos demonstrativos funcionam no navegador. Não há conexão com IAs reais nem com seus projetos ou arquivos.</p><p class="detail-note">A versão completa usa Node.js para autenticação, gestão de projetos, arquivos, terminal e integrações configuradas pelo proprietário.</p><a href="https://github.com/igorsilvadev01/Escrit-rio-de-IAs" target="_blank" rel="noopener noreferrer">Ver código e instruções da versão completa ↗</a>', null, null);
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error('Não foi possível carregar a demonstração. Atualize a página.'));
      document.body.append(script);
    });
  }
  async function start() {
    if (started) return;
    started = true;
    $('visit-office').disabled = true;
    $('access-status').textContent = 'Abrindo demonstração…';
    window.FirmaAccess = {
      role: 'visitor', isAdmin: false, isDemo: true, username: '', initial: snapshot(),
      async read() {
        const now = performance.now();
        E.tick(state, Math.min(2, Math.max(0, (now - lastRead) / 1000)));
        lastRead = now;
        revision++;
        return snapshot();
      },
      command: unavailable, ai: unavailable, aiStatus: unavailable,
      studioRead: unavailable, studio: unavailable, companyRead: unavailable,
      company: unavailable, backup: unavailable,
      login: about, logout: () => location.reload()
    };
    try {
      document.body.classList.add('visitor');
      $('access-role').textContent = 'DEMONSTRAÇÃO';
      $('session-exit').textContent = 'Sobre a versão completa';
      $('session-exit').onclick = about;
      for (const src of ['activity.js', 'ui.js', 'office-life-ui.js', 'ai-ui.js', 'scene-controls.js', 'app.js']) await loadScript(src);
      $('connection-label').textContent = 'Simulação local';
      $('save-status').textContent = 'Demonstração · dados de exemplo';
      $('access-gate').hidden = true;
      document.body.classList.remove('gated');
    } catch (error) {
      started = false;
      $('access-error').textContent = error.message;
      $('visit-office').disabled = false;
    }
  }
  $('show-login').hidden = true;
  $('visit-office').disabled = false;
  $('visit-office').innerHTML = '<span aria-hidden="true">◉</span><strong>Explorar demonstração<small>Entre no escritório 2D e conheça a equipe.</small></strong><span aria-hidden="true">→</span>';
  $('access-heading').textContent = 'Conheça o escritório de IAs.';
  $('access-description').textContent = description;
  $('access-status').textContent = 'Demonstração pública · sem login · sem consumo de IA';
  document.querySelector('.access-footnote').textContent = 'Administração, arquivos, terminal e IAs reais estão disponíveis na versão com servidor.';
  document.querySelector('.access-story > p').textContent = description;
  document.querySelector('.access-story .brand').setAttribute('href', './');
  $('visit-office').onclick = start;
})();
