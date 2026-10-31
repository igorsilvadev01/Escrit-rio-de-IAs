/* Generated chibi sprite artwork. Tinting preserves the original pixel shading. */
(() => {
  'use strict';
  const sheet = new Image(),
    cache = new Map();
  let ready = false;
  const columns = [
      [160, 328],
      [419, 593],
      [690, 860],
      [955, 1124],
    ],
    rows = [
      [51, 292],
      [333, 586],
      [627, 879],
      [917, 1171],
    ];
  const rgb = (hex) =>
    /^#[0-9a-f]{6}$/i.test(hex || '')
      ? [
          parseInt(hex.slice(1, 3), 16),
          parseInt(hex.slice(3, 5), 16),
          parseInt(hex.slice(5, 7), 16),
        ]
      : null;
  function frame(row, col, a) {
    const key = [
      row,
      col,
      a.color,
      a.hair,
      a.skin,
      a.pants,
      a.shoes,
      a.hairStyle,
      a.pantsStyle,
    ].join(':');
    if (cache.has(key)) return cache.get(key);
    const [x, x1] = columns[col],
      [y, y1] = rows[row],
      c = document.createElement('canvas');
    c.width = x1 - x;
    c.height = y1 - y;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(sheet, x, y, c.width, c.height, 0, 0, c.width, c.height);
    const data = ctx.getImageData(0, 0, c.width, c.height),
      d = data.data,
      shirt = rgb(a.color),
      hair = rgb(a.hair),
      skin = rgb(a.skin),
      pants = rgb(a.pants),
      shoes = rgb(a.shoes);
    for (let py = 0; py < c.height; py++)
      for (let px = 0; px < c.width; px++) {
        const i = (py * c.width + px) * 4;
        if (d[i + 3] < 50) continue;
        const R = d[i],
          G = d[i + 1],
          B = d[i + 2],
          v = py / c.height;
        let color = null,
          shade = 1;
        if (v > 0.57 && v < 0.8 && R > 125 && Math.max(R, G, B) - Math.min(R, G, B) < 58) {
          color = shirt;
          shade = (R + G + B) / 3 / 235;
        } else if (v < 0.43 && R < 115 && G < 130 && B > R * 0.82) {
          color = hair;
          shade = 0.66 + (R + G + B) / 3 / 90;
        } else if (v > 0.28 && v < 0.81 && R > 140 && R - G > 20 && G - B > 10) {
          color = skin;
          shade = R / 245;
        } else if (v > 0.78 && v < 0.93 && R < 100 && G < 120 && B > R * 0.8) {
          color = pants;
          shade = 0.6 + (R + G + B) / 3 / 100;
        } else if (v > 0.93 && Math.max(R, G, B) < 150) {
          color = shoes;
          shade = 0.62 + (R + G + B) / 3 / 120;
        }
        if (color)
          for (let k = 0; k < 3; k++)
            d[i + k] = Math.min(255, Math.max(0, Math.round(color[k] * shade)));
      }
    if (a.hairStyle === 'bald')
      for (let py = 0; py < c.height * 0.45; py++)
        for (let px = 0; px < c.width; px++) {
          const i = (py * c.width + px) * 4;
          if (d[i + 3] < 50) continue;
          const ellipse =
            ((px - c.width * 0.5) / (c.width * 0.39)) ** 2 +
            ((py - c.height * 0.34) / (c.height * 0.26)) ** 2;
          if (ellipse > 1) {
            d[i + 3] = 0;
          } else if (py < c.height * 0.4) {
            const tone = skin || [227, 177, 140];
            for (let k = 0; k < 3; k++)
              d[i + k] = Math.round(tone[k] * (0.88 + (0.12 * py) / (c.height * 0.4)));
          }
        }
    if (a.pantsStyle === 'shorts')
      for (let py = Math.floor(c.height * 0.83); py < c.height * 0.93; py++)
        for (let px = 0; px < c.width; px++) {
          const i = (py * c.width + px) * 4;
          if (d[i + 3] > 80 && d[i] < 140 && d[i + 1] < 160) {
            const tone = skin || [227, 177, 140];
            for (let k = 0; k < 3; k++) d[i + k] = tone[k];
          }
        }
    ctx.putImageData(data, 0, 0);
    if (cache.size > 180) cache.clear();
    cache.set(key, c);
    return c;
  }
  function draw(ctx, o) {
    if (!ready) return;
    const a = o.avatarPreview || o.colleagueAppearance || window.FirmaAvatar?.get() || {},
      time = o.workReduced ? 0 : o.time || 0,
      direction = o.facing || 'down',
      row = { down: 0, left: 1, right: 2, up: 3 }[direction] ?? 0,
      col = o.walking ? Math.floor(time * 8) % 4 : 1,
      im = frame(row, col, a),
      h = 62,
      w = (h * im.width) / im.height;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#17233330';
    ctx.beginPath();
    ctx.ellipse(0, 12, w * 0.33, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    const breath =
      o.avatarPreview || o.workReduced ? 0 : Math.sin(time * 2 + (o.phase || 0)) * 0.35;
    ctx.translate(0, breath);
    if (a.hairStyle === 'long' || a.hairStyle === 'bob') {
      ctx.fillStyle = a.hair || '#202337';
      ctx.fillRect(-w * 0.34, -31, w * 0.68, a.hairStyle === 'long' ? 28 : 14);
    }
    ctx.drawImage(im, -w / 2, -50, w, h);
    if (a.hairStyle === 'mohawk') {
      ctx.fillStyle = a.hair || '#202337';
      ctx.fillRect(-3, -54, 6, 8);
    }
    if (a.hairStyle === 'curly') {
      ctx.fillStyle = a.hair || '#202337';
      for (let j = -2; j <= 2; j++) {
        ctx.beginPath();
        ctx.arc(j * 5, -45 + Math.abs(j), 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (a.shirtStyle === 'stripes') {
      ctx.fillStyle = '#ffffff66';
      for (const y of [-12, -8, -4]) ctx.fillRect(-8, y, 16, 1);
    }
    if (a.shirtStyle === 'jacket') {
      ctx.fillStyle = '#e9edf1';
      ctx.fillRect(-2, -14, 4, 13);
    }
    if (a.shirtStyle === 'hoodie') {
      ctx.fillStyle = '#e5e9ef';
      ctx.fillRect(-4, -13, 1, 5);
      ctx.fillRect(4, -13, 1, 5);
    }
    if (a.shoeStyle === 'boots') {
      ctx.fillStyle = a.shoes || '#24354c';
      ctx.fillRect(-10, 6, 8, 4);
      ctx.fillRect(3, 6, 8, 4);
    }
    const hat = a.hat,
      color = a.hatColor || '#4d6b88';
    ctx.fillStyle = color;
    if (hat === 'cap') {
      ctx.fillRect(-13, -46, 26, 8);
      ctx.fillRect(-13, -39, 31, 3);
    }
    if (hat === 'beanie') {
      ctx.fillRect(-12, -48, 24, 10);
      ctx.fillStyle = '#e8e6df';
      ctx.fillRect(-13, -40, 26, 3);
    }
    if (hat === 'bucket' || hat === 'fedora') {
      ctx.fillRect(-10, -49, 20, 10);
      ctx.fillRect(-16, -40, 32, 4);
    }
    if (o.sitting && o.animation === 'typing') {
      const pose = window.FirmaWorkAnimation?.pose(time, o.phase || 0, !!o.workReduced) || {
        left: 0,
        right: 0,
      };
      ctx.fillStyle = a.skin || '#e3b18c';
      ctx.fillRect(-12, -14 + pose.left, 4, 3);
      ctx.fillRect(9, -14 + pose.right, 4, 3);
    }
    ctx.restore();
  }
  let resolve, reject;
  const loaded = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  loaded.catch(() => {});
  sheet.onload = () => {
    ready = true;
    resolve();
    window.dispatchEvent(new Event('firma-chibi-ready'));
  };
  sheet.onerror = () => reject(new Error('Não foi possível carregar a arte dos personagens.'));
  sheet.src = 'public-art/chibi-walk.png?v=cozy-1';
  window.FirmaChibi = {
    draw,
    loaded,
    get ready() {
      return ready;
    },
  };
})();
