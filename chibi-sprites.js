/* Generated chibi sprite artwork. Tinting preserves the original pixel shading. */
(() => {
  'use strict';
  const sittingSheet = new Image();
  sittingSheet.src = 'public-art/chibi-sit.png?v=1';
  const sitBoxes = [
    [135, 66, 255, 393],
    [554, 112, 252, 348],
    [973, 153, 253, 307],
    [1393, 137, 253, 323],
    [135, 482, 255, 369],
    [554, 510, 252, 341],
    [972, 529, 254, 321],
    [1393, 507, 253, 339],
  ];
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
  function frame(row, col, a, seatCol = null) {
    const key =
      [row, col, a.color, a.hair, a.skin, a.pants, a.shoes, a.hairStyle, a.pantsStyle].join(':') +
      ':' +
      seatCol;
    if (cache.has(key)) return cache.get(key);
    const bounds =
      seatCol === null
        ? [
            columns[col][0],
            rows[row][0],
            columns[col][1] - columns[col][0],
            rows[row][1] - rows[row][0],
          ]
        : sitBoxes[(row === 3 ? 4 : 0) + seatCol];
    const [x, y, fw, fh] = bounds,
      c = document.createElement('canvas');
    c.width = fw;
    c.height = fh;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(seatCol === null ? sheet : sittingSheet, x, y, fw, fh, 0, 0, fw, fh);
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
      progress = o.seatAmount ?? (o.sitting ? 1 : 0),
      seatCol =
        progress > 0 && sittingSheet.complete && sittingSheet.naturalWidth
          ? window.FirmaSeatMotion.frame(progress, time)
          : null,
      im = frame(row, col, a, seatCol),
      h = seatCol === null ? 62 : (62 * im.height) / (row === 3 ? 369 : 393),
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
    ctx.drawImage(im, -w / 2, 12 - h, w, h);
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
    ctx.save();
    ctx.translate(0, 62 - h);
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
    ctx.restore();
    if (seatCol === null && o.sitting && o.animation === 'typing') {
      const pose = window.FirmaWorkAnimation?.pose(time, o.phase || 0, !!o.workReduced) || {
        left: 0,
        right: 0,
      };
      ctx.fillStyle = a.skin || '#e3b18c';
      ctx.fillRect(-12, -14 + pose.left, 4, 3);
      ctx.fillRect(9, -14 + pose.right, 4, 3);
    }
    if (!o.walking && !o.workReduced && progress === 0) {
      const beat = Math.sin(time * 3 + (o.phase || 0));
      ctx.strokeStyle = a.skin || '#e3b18c';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      if (o.animation === 'coffee') {
        const y = -15 - (beat + 1) * 4;
        ctx.beginPath();
        ctx.moveTo(8, -12);
        ctx.lineTo(14, y);
        ctx.stroke();
        ctx.fillStyle = '#f6e8c9';
        ctx.fillRect(11, y - 5, 7, 7);
        ctx.strokeStyle = '#eee1c1';
        ctx.lineWidth = 1;
        ctx.strokeRect(17, y - 4, 3, 4);
        ctx.fillStyle = '#b3c6ce66';
        ctx.fillRect(13, y - 10 - ((time * 3) % 4), 1, 3);
      } else if (o.animation === 'reading') {
        ctx.fillStyle = '#344f75';
        ctx.fillRect(-11, -15, 22, 13);
        ctx.fillStyle = '#efe4cc';
        ctx.fillRect(-9, -13, 8, 9);
        ctx.fillRect(1, -13, 8, 9);
        ctx.fillStyle = '#9aa8ad';
        ctx.fillRect(-7, -10, 5, 1);
        ctx.fillRect(3, -9 + Math.round(beat), 4, 1);
      } else if (o.animation === 'watering') {
        ctx.fillStyle = '#7195aa';
        ctx.fillRect(8, -11, 9, 6);
        ctx.fillRect(16, -14, 7, 2);
        ctx.fillStyle = '#b8e5ef';
        for (let j = 0; j < 3; j++) ctx.fillRect(22 + j * 2, -9 + ((time * 10 + j * 3) % 12), 1, 2);
      } else if (o.animation === 'talking') {
        ctx.beginPath();
        ctx.moveTo(8, -15);
        ctx.lineTo(16, -21 + beat * 5);
        ctx.stroke();
      }
    }
    // Short upper-body stretch between work bursts, without moving the chair.
    if (progress > 0.98 && !o.workReduced && (time + (o.phase || 0)) % 19 > 16) {
      ctx.strokeStyle = a.color || '#536f9a';
      ctx.lineWidth = 5;
      ctx.lineCap = 'square';
      ctx.beginPath();
      ctx.moveTo(-8, 3 - h * 0.37);
      ctx.lineTo(-13, 5 - h * 0.54);
      ctx.moveTo(8, 3 - h * 0.37);
      ctx.lineTo(13, 5 - h * 0.54);
      ctx.stroke();
      ctx.strokeStyle = a.skin || '#e3b18c';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-13, 5 - h * 0.54);
      ctx.lineTo(-15, 5 - h * 0.66);
      ctx.moveTo(13, 5 - h * 0.54);
      ctx.lineTo(15, 5 - h * 0.66);
      ctx.stroke();
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
