/* Visitor appearance stays on this device and never changes the owner's player. */
(() => {
  'use strict';
  const key = 'firma-visitor-avatar-v1';
  const defaults = {
    name: 'Visitante',
    gender: 'neutral',
    skin: '#c49373',
    color: '#3455f5',
    pants: '#253654',
    shoes: '#ffffff',
    hair: '#322820',
    hairStyle: 'short',
    hat: 'none',
    hatColor: '#3455f5',
    shirtStyle: 'plain',
    pantsStyle: 'straight',
    shoeStyle: 'sneakers',
  };
  const choices = {
    gender: [
      ['neutral', 'Neutro'],
      ['female', 'Feminino'],
      ['male', 'Masculino'],
    ],
    shirtStyle: [
      ['plain', 'Camiseta lisa'],
      ['stripes', 'Camiseta listrada'],
      ['hoodie', 'Moletom'],
      ['jacket', 'Jaqueta'],
    ],
    pantsStyle: [
      ['straight', 'Calça reta'],
      ['wide', 'Calça larga'],
      ['shorts', 'Bermuda'],
    ],
    shoeStyle: [
      ['sneakers', 'Tênis'],
      ['boots', 'Botas'],
      ['formal', 'Sapato social'],
    ],
    hairStyle: [
      ['short', 'Curto'],
      ['long', 'Longo'],
      ['curly', 'Cacheado'],
      ['mohawk', 'Moicano'],
      ['bob', 'Chanel'],
      ['bald', 'Sem cabelo'],
    ],
    hat: [
      ['none', 'Sem chapéu'],
      ['cap', 'Boné'],
      ['beanie', 'Gorro'],
      ['bucket', 'Bucket'],
      ['fedora', 'Chapéu de aba'],
    ],
  };
  function normalize(value) {
    const a = { ...defaults };
    if (!value || typeof value !== 'object') return a;
    for (const k of ['skin', 'color', 'pants', 'shoes', 'hair', 'hatColor'])
      if (/^#[0-9a-f]{6}$/i.test(value[k])) a[k] = value[k];
    for (const [k, items] of Object.entries(choices))
      if (items.some(([id]) => id === value[k])) a[k] = value[k];
    if (typeof value.name === 'string') a.name = value.name.trim().slice(0, 20) || defaults.name;
    return a;
  }
  let appearance = normalize(null),
    pending = null,
    entering = false;
  try {
    appearance = normalize(JSON.parse(localStorage.getItem(key)));
  } catch {}
  function draw(ctx, o) {
    if(window.FirmaChibi?.ready) return window.FirmaChibi.draw(ctx,o);
    const a = o.avatarPreview || o.colleagueAppearance || appearance,
      t = o.time || 0,
      stride = o.walking ? Math.round(Math.sin(t * 13) * 2) : 0,
      work = window.FirmaWorkAnimation?.pose(
        t,
        o.phase || 0,
        !!o.workReduced || !!o.avatarPreview,
      ) || {
        left: 0,
        right: 0,
        mouse: 0,
        head: 0,
        blink: false,
        frame: 0,
      },
      footY = o.sitting ? 7 : 10,
      face =
        o.sitting && o.animation === 'typing' && work.action === 'review'
          ? o.name === 'Igor'
            ? 'left'
            : 'right'
          : o.facing;
    const box = (x, y, w, h, c) => {
      ctx.fillStyle = c;
      ctx.fillRect(x, y, w, h);
    };
    ctx.save();
    ctx.translate(0, o.walking ? Math.round(Math.sin(t * 13)) : 0);
    box(-11, o.sitting ? 9 : 11, 23, 4, '#101c3433');
    if (o.sitting) {
      box(-11, -11, 23, 17, '#243b62');
      box(-10, -10, 21, 14, '#4d6075');
    }
    if (a.hairStyle === 'long') box(-12, -31, 25, 28, a.hair);
    const leg = a.pantsStyle === 'wide' ? 9 : 6,
      length = a.pantsStyle === 'shorts' ? 5 : o.sitting ? 8 : 11;
    box(-8, 0, leg, length, a.pants);
    box(2, 0, leg, length, a.pants);
    if (a.pantsStyle === 'shorts') {
      box(-7, 5, 6, 6, a.skin);
      box(2, 5, 6, 6, a.skin);
    }
    if (a.shoeStyle === 'boots') {
      box(-8, 5 + stride, 8, 9, a.shoes);
      box(2, 5 - stride, 8, 9, a.shoes);
    }
    box(-9, footY + stride, 9, 4, a.shoes);
    box(2, footY - stride, 9, 4, a.shoes);
    if (a.shoeStyle === 'sneakers') {
      box(-9, footY + 3 + stride, 9, 1, '#d5def0');
      box(2, footY + 3 - stride, 9, 1, '#d5def0');
      box(-6, footY + stride, 3, 1, '#17233d');
      box(4, footY - stride, 3, 1, '#17233d');
    }
    if (a.shoeStyle === 'formal') {
      box(-9, footY + 2 + stride, 9, 2, '#17233d');
      box(2, footY + 2 - stride, 9, 2, '#17233d');
    }
    const torso = a.gender === 'female' ? 13 : a.gender === 'male' ? 19 : 17;
    box(-Math.floor(torso / 2) - 1, -16, torso + 2, 19, '#17233d');
    box(-Math.floor(torso / 2), -15, torso, 17, a.color);
    box(-12, -13, 4, 8, a.color);
    box(9, -13, 4, 8, a.color);
    box(-12, -5 - stride, 4, 7, a.skin);
    box(9, -5 + stride, 4, 7, a.skin);
    if (a.shirtStyle === 'stripes') for (let y = -12; y < 0; y += 5) box(-6, y, 13, 2, '#ffffffb0');
    if (a.shirtStyle === 'jacket') {
      box(-2, -14, 4, 16, '#f4f7ff');
      box(-1, -14, 2, 16, '#182748');
    }
    if (a.shirtStyle === 'hoodie') {
      box(-7, -16, 15, 3, '#ffffff55');
      box(-3, -12, 1, 5, '#fff');
      box(3, -12, 1, 5, '#fff');
      box(-4, -3, 9, 3, '#13234744');
    }
    ctx.save();
    ctx.translate(!o.walking && o.animation === 'typing' ? work.head : 0, 0);
    box(-11, -34, 23, 21, '#17233d');
    box(-9, -32, 19, 18, a.skin);
    if (a.hairStyle !== 'bald') {
      box(-10, -36, 21, 7, a.hair);
      if (['long', 'bob'].includes(a.hairStyle)) {
        box(-12, -31, 5, a.hairStyle === 'long' ? 24 : 15, a.hair);
        box(8, -31, 5, a.hairStyle === 'long' ? 24 : 15, a.hair);
      } else if (a.hairStyle === 'mohawk') {
        box(-3, -42, 7, 12, a.hair);
        box(-9, -31, 3, 6, a.hair);
      } else if (a.hairStyle === 'curly') {
        for (let x = -12; x < 11; x += 5) {
          box(x, -39 + (x % 3), 6, 9, a.hair);
        }
        box(-12, -31, 5, 9, a.hair);
        box(8, -31, 5, 9, a.hair);
      } else {
        box(-10, -31, 4, 7, a.hair);
        box(8, -31, 3, 6, a.hair);
      }
    }
    if (face === 'up' && a.hairStyle !== 'bald') {
      box(-9, -30, 19, 15, a.hair);
      box(-7, -30, 13, 2, '#ffffff12');
      box(-8, -27, 2, 7, '#ffffff0c');
      box(-11, -23, 2, 5, a.skin);
      box(10, -23, 2, 5, a.skin);
      box(-2, -16, 5, 3, a.skin);
    } else {
      const dx = face === 'left' ? -2 : face === 'right' ? 2 : 0;
      box(-5 + dx, -25, 2, work.blink ? 1 : 4, '#17233d');
      box(4 + dx, -25, 2, work.blink ? 1 : 4, '#17233d');
      box(-2 + dx, -18, 5, 1, '#8d534c');
    }
    if (a.hat === 'cap') {
      box(-11, -38, 23, 8, a.hatColor);
      box(face === 'left' ? -16 : -8, -31, 25, 3, a.hatColor);
    }
    if (a.hat === 'beanie') {
      box(-10, -40, 21, 10, a.hatColor);
      box(-12, -32, 25, 4, '#dfe7ff');
      box(-3, -44, 7, 5, a.hatColor);
    }
    if (a.hat === 'bucket') {
      box(-9, -41, 19, 11, a.hatColor);
      box(-14, -32, 29, 5, a.hatColor);
      box(-8, -33, 17, 2, '#ffffff66');
    }
    if (a.hat === 'fedora') {
      box(-9, -42, 19, 11, a.hatColor);
      box(-14, -32, 29, 4, a.hatColor);
      box(-9, -35, 19, 3, '#17233d');
    }
    ctx.restore();
    const beat = Math.floor(t * 3) % 2;
    if (!o.walking && o.animation === 'typing') {
      if (o.sitting) {
        // Hands reach the physical desk; nothing floats on the character's lap.
        box(-14, -21, 5, 11, a.color);
        box(10, -21, 5, 11, a.color);
        box(-14, -25 + work.left, 5, 5, a.skin);
        box(10 + (work.mouse ? 2 : 0), -25 + work.right, 5, 5, a.skin);
        box(-13, -26 + work.left, 3, 1, '#f1ccb1');
        box(11, -26 + work.right, 3, 1, '#f1ccb1');
      } else {
        box(-10, -7 + work.left, 7, 5, a.color);
        box(-8, -5 + work.left, 5, 3, a.skin);
        box(4, -7 + work.right, 7, 5, a.color);
        box(4, -5 + work.right, 5, 3, a.skin);
      }
    }
    if (!o.walking && o.animation === 'reading') {
      box(-8, -6, 17, 12, '#3455f5');
      box(-7, -5, 7, 9, '#f4f7ff');
      box(1, -5, 7, 9, '#dbe5fa');
    }
    if (!o.walking && o.animation === 'coffee') {
      box(9, -10 - beat, 7, 8, '#f4f7ff');
      box(15, -9 - beat, 3, 5, '#8199c9');
      box(11, -14 - beat, 1, 3, '#b8c9ec');
    }
    if (!o.walking && o.animation === 'talking') {
      box(10, -11 - beat * 3, 5, 6, a.skin);
    }
    if (!o.walking && o.animation === 'watering') {
      box(10, -4, 10, 7, '#5c9bbd');
      box(18, -7, 6, 3, '#5c9bbd');
      box(23, -5, 1, 3 + beat, '#9dc5f3');
    }
    if (o.player) box(-3, -50, 7, 3, '#7395ff');
    ctx.restore();
  }
  const original = window.FirmaVillage.sprite;
  window.FirmaVillage.sprite = (ctx, o) => {
    if (o.avatarPreview || o.colleagueAppearance || (o.player && !window.FirmaAccess?.isAdmin))
      draw(ctx, o);
    else original(ctx, o);
  };
  const dialog = document.createElement('dialog');
  dialog.id = 'visitor-avatar';
  dialog.className = 'visitor-avatar';
  dialog.setAttribute('aria-labelledby', 'avatar-title');
  dialog.innerHTML = `<form method="dialog" id="avatar-form"><header><div><span class="avatar-eyebrow">SUA PRESENÇA NA FIRMA</span><h2 id="avatar-title">Crie seu personagem.</h2></div><button type="button" class="avatar-close" aria-label="Fechar personalização">×</button></header><div class="avatar-layout"><aside class="avatar-stage"><canvas width="240" height="280" aria-label="Prévia do seu personagem" role="img"></canvas><strong class="avatar-name"></strong><span>VISITANTE · SEU ESTILO</span><p>Seu visual fica salvo neste navegador.</p></aside><div class="avatar-fields"><label class="avatar-full">Como quer ser chamado?<input name="name" maxlength="20" required autocomplete="nickname"></label><label>Sexo / apresentação<select name="gender"></select></label><label>Tom de pele<input type="color" name="skin"></label><fieldset><legend>Camiseta</legend><label>Estilo<select name="shirtStyle"></select></label><label>Cor<input type="color" name="color"></label></fieldset><fieldset><legend>Calças e sapatos</legend><label>Modelo<select name="pantsStyle"></select></label><label>Cor da calça<input type="color" name="pants"></label><label>Sapatos<select name="shoeStyle"></select></label><label>Cor dos sapatos<input type="color" name="shoes"></label></fieldset><fieldset><legend>Cabelo e chapéu</legend><label>Cabelo<select name="hairStyle"></select></label><label>Cor do cabelo<input type="color" name="hair"></label><label>Chapéu<select name="hat"></select></label><label>Cor do chapéu<input type="color" name="hatColor"></label></fieldset></div></div><footer><button type="button" class="secondary-button avatar-cancel">Cancelar</button><button type="submit" class="primary-button">Entrar com meu personagem →</button></footer></form>`;
  document.body.append(dialog);
  const form = dialog.querySelector('form'),
    preview = dialog.querySelector('canvas');
  for (const [k, items] of Object.entries(choices))
    for (const [id, label] of items) form.elements[k].add(new Option(label, id));
  const read = () => normalize(Object.fromEntries(new FormData(form)));
  function render() {
    const a = read(),
      ctx = preview.getContext('2d');
    ctx.clearRect(0, 0, 240, 280);
    ctx.save();
    ctx.translate(120, 213);
    ctx.scale(4, 4);
    draw(ctx, { avatarPreview: a, facing: 'down' });
    ctx.restore();
    dialog.querySelector('.avatar-name').textContent = a.name;
  }
  function apply() {
    if (window.FirmaUI && !window.FirmaAccess?.isAdmin) {
      Object.assign(window.FirmaUI.state.player, appearance);
      window.dispatchEvent(new Event('firma-player-changed'));
    }
  }
  function open(callback = null) {
    pending = callback;
    for (const [k, v] of Object.entries(appearance))
      if (form.elements[k]) form.elements[k].value = v;
    dialog.querySelector('[type=submit]').textContent = callback
      ? 'Entrar com meu personagem →'
      : 'Salvar meu visual';
    render();
    dialog.showModal();
  }
  window.addEventListener('firma-chibi-ready',()=>{if(dialog.open)render();});
  form.addEventListener('input', render);
  const cancel = () => {
    pending = null;
    dialog.close();
  };
  dialog.querySelector('.avatar-close').onclick = cancel;
  dialog.querySelector('.avatar-cancel').onclick = cancel;
  dialog.addEventListener('cancel', () => {
    pending = null;
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    appearance = read();
    try {
      localStorage.setItem(key, JSON.stringify(appearance));
    } catch {}
    apply();
    dialog.close();
    const next = pending;
    pending = null;
    if (next) next();
  });
  document.getElementById('visit-office').addEventListener(
    'click',
    (e) => {
      if (entering) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      open(() => {
        entering = true;
        document.getElementById('visit-office').click();
        entering = false;
      });
    },
    true,
  );
  const edit = document.createElement('button');
  edit.type = 'button';
  edit.id = 'visitor-appearance';
  edit.className = 'secondary-button';
  edit.textContent = 'Meu personagem';
  edit.hidden = true;
  edit.onclick = () => open();
  document.querySelector('.topbar-right').prepend(edit);
  const observer = new MutationObserver(() => {
    if (!document.body.classList.contains('gated')) {
      edit.hidden = !!window.FirmaAccess?.isAdmin;
      apply();
      observer.disconnect();
    }
  });
  observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  window.FirmaAvatar = { normalize, get: () => ({ ...appearance }), open };
})();
