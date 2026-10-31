/* Accessible companion list and full scripted conversation history. */
(() => {
  'use strict';
  const ui = window.FirmaUI,
    life = window.FirmaLifeModel.create(window.FirmaWorld, window.FirmaEngine);
  window.FirmaLife = life;
  life.drawAmbient = (ctx) => {
    ctx.save();
    const t = life.reduced ? 0 : life.elapsed;
    ctx.strokeStyle = '#f4f7ff';
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.7;
    for (let i = 0; i < 3; i++) {
      const x = window.FirmaWorld.lounge.coffee.x + 8 + i * 5,
        y = window.FirmaWorld.lounge.coffee.y - 5;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + Math.sin(t * 1.6 + i) * 3, y - 5, x, y - 11);
      ctx.stroke();
    }
    ctx.restore();
  };
  const esc = (s) =>
    String(s).replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
  const dialog = document.createElement('dialog');
  dialog.id = 'office-life-panel';
  dialog.setAttribute('aria-labelledby', 'life-title');
  dialog.innerHTML =
    '<header><div><span class="avatar-eyebrow">O DIA A DIA DO ESCRITÓRIO</span><h2 id="life-title">Gente, ideias e conversas.</h2></div><button type="button" aria-label="Fechar equipe e conversas">×</button></header><p class="life-note">Rotinas e conversas roteirizadas do cenário. Elas não executam tarefas nem usam serviços de IA.</p><div class="life-panel-grid"><section><h3 id="life-roster-heading"></h3><div id="life-roster"></div></section><section><h3>Conversa em andamento</h3><div id="life-current"></div><h3>O que foi dito</h3><div id="life-history" role="log" aria-live="off"></div><details><summary>Ler todas as conversas</summary><div id="life-stories"></div></details></section></div>';
  document.body.append(dialog);
  dialog.querySelector('header button').onclick = () => dialog.close();
  const button = document.createElement('button');
  button.type = 'button';
  button.id = 'office-life-button';
  button.className = 'secondary-button';
  button.textContent = 'Equipe e conversas';
  document.querySelector('.topbar-right').prepend(button);
  function render() {
    const roster = life.roster(ui.state);
    dialog.querySelector('#life-roster-heading').textContent =
      roster.length + ' colegas no cenário';
    dialog.querySelector('#life-roster').innerHTML = roster
      .map(
        (a) =>
          '<article class="life-colleague"><span style="--colleague-color:' +
          esc(a.color) +
          '">' +
          esc(a.name.slice(0, 1)) +
          '</span><div><strong>' +
          esc(a.name) +
          '</strong><small>' +
          esc(a.role) +
          '</small><p>' +
          ({
            desk: 'Na mesa · rotina do cenário',
            board: 'Consultando o quadro',
            plant: 'Cuidando do ambiente',
            coffee: 'No cantinho do café',
            chat: 'Encontrando um colega',
            rest: 'Em uma pausa',
          }[life.plan(ui.state, a).mode] || 'Pelo escritório') +
          '</p></div></article>',
      )
      .join('');
    const { story } = life.current();
    dialog.querySelector('#life-current').textContent = story.title;
    dialog.querySelector('#life-history').innerHTML = life.history.length
      ? life.history
          .slice(-12)
          .map(
            (x) =>
              '<article class="life-message"><strong>' +
              esc(x.name) +
              '</strong><p>' +
              esc(x.text) +
              '</p></article>',
          )
          .join('')
      : '<p>As falas aparecerão aqui quando os colegas se encontrarem. Você também pode abrir as conversas completas abaixo.</p>';
  }
  dialog.querySelector('#life-stories').innerHTML = life.conversations
    .map(
      (story) =>
        '<details><summary>' +
        esc(story.title) +
        '</summary>' +
        story.lines
          .map(
            (text, i) =>
              '<article class="life-message"><strong>' +
              esc(life.roster(ui.state).find((a) => a.id === story.ids[i % 2])?.name || 'Colega') +
              '</strong><p>' +
              esc(text) +
              '</p></article>',
          )
          .join('') +
        '</details>',
    )
    .join('');
  button.onclick = () => {
    render();
    dialog.showModal();
  };
  setInterval(() => {
    if (dialog.open) render();
  }, 2000);
  const original = ui.agentDetail;
  ui.agentDetail = (id) => {
    const a = life.companions.find((x) => x.id === id);
    if (!a) return original(id);
    render();
    dialog.showModal();
    const card = [...dialog.querySelectorAll('.life-colleague')].find((x) =>
      x.textContent.includes(a.name),
    );
    card?.scrollIntoView({ block: 'nearest' });
  };
})();
