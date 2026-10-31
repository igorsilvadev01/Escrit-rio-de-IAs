/* Warm indoor pixel studio, based on the portfolio thumbnail. Geometry and depth order are preserved. */
(() => {
  'use strict';
  const ink = '#26313e',
    paper = '#f1eee4';
  let groundCache = null,
    groundKey = '';
  const palettes = {
    oak: ['#463c34', '#bd9368', '#dab78b'],
    walnut: ['#3b322e', '#9c7554', '#c29b72'],
    cream: ['#51483d', '#d0b184', '#e2c79d'],
  };
  const accents = {
    planning: '#718398',
    development: '#536b86',
    testing: '#6b8b87',
    publishing: '#7a7c92',
    leadership: '#536b86',
  };
  function painter(ctx) {
    return {
      box: (x, y, w, h, c) => {
        ctx.fillStyle = c;
        ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
      },
      label: (s, x, y, size = 8, color = ink) => {
        ctx.fillStyle = color;
        ctx.textAlign = 'left';
        ctx.font = `bold ${size}px monospace`;
        ctx.fillText(s, Math.round(x), Math.round(y));
      },
    };
  }
  function plant(ctx, x, y, small = false) {
    const { box } = painter(ctx);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(small ? 0.72 : 1, small ? 0.72 : 1);
    box(-11, 11, 25, 4, '#292a2630');
    box(-9, -1, 19, 15, '#243241');
    box(-7, 1, 15, 10, '#4b6883');
    box(-7, 1, 3, 9, '#6b869d');
    box(-11, -3, 23, 5, '#273b4f');
    box(-9, -3, 18, 2, '#7c91a0');
    box(-7, -5, 15, 3, '#55422f');
    box(-1, -27, 3, 23, '#405a38');
    box(-9, -23, 9, 4, '#405a38');
    box(1, -30, 9, 4, '#405a38');
    box(-17, -25, 13, 10, '#345339');
    box(-18, -23, 7, 4, '#6d9150');
    box(-13, -29, 10, 7, '#71964d');
    box(3, -32, 12, 10, '#4d733c');
    box(8, -30, 9, 5, '#88a85a');
    box(3, -37, 7, 8, '#73984e');
    box(-10, -40, 10, 14, '#648843');
    box(-9, -42, 6, 8, '#96ad65');
    box(-3, -33, 8, 13, '#779a4f');
    box(3, -21, 14, 11, '#3b6039');
    box(8, -23, 8, 6, '#84a35b');
    box(-13, -14, 12, 9, '#547b42');
    box(-12, -15, 5, 3, '#91ab65');
    box(0, -17, 7, 9, '#72964a');
    ctx.restore();
  }
  function windowPanel(ctx, x, y, w, h) {
    const { box } = painter(ctx);
    box(x + 2, y + 3, w, h, '#4c535a');
    box(x, y, w, h, '#3b4652');
    box(x + 3, y + 3, w - 6, h - 7, '#9eb2c7');
    box(x + 4, y + 4, w - 8, Math.floor(h * 0.43), '#aebfce');
    ctx.save();
    ctx.beginPath();
    ctx.rect(x + 4, y + 4, w - 8, h - 9);
    ctx.clip();
    ctx.fillStyle = '#8c9eaf';
    ctx.beginPath();
    ctx.moveTo(x, y + h - 7);
    ctx.lineTo(x + w * 0.2, y + h * 0.38);
    ctx.lineTo(x + w * 0.39, y + h * 0.67);
    ctx.lineTo(x + w * 0.65, y + h * 0.28);
    ctx.lineTo(x + w, y + h * 0.72);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#6f839b';
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x + w * 0.31, y + h * 0.64);
    ctx.lineTo(x + w * 0.49, y + h * 0.79);
    ctx.lineTo(x + w * 0.84, y + h * 0.43);
    ctx.lineTo(x + w, y + h * 0.62);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e4edf232';
    ctx.beginPath();
    ctx.moveTo(x + w * 0.52, y + 3);
    ctx.lineTo(x + w * 0.72, y + 3);
    ctx.lineTo(x + w * 0.23, y + h);
    ctx.lineTo(x + w * 0.04, y + h);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    box(x + Math.floor(w * 0.49), y + 3, 3, h - 6, '#445567');
    box(x + Math.floor(w * 0.49) + 1, y + 3, 1, h - 6, '#71869b');
    box(x - 2, y + h - 5, w + 4, 5, '#607285');
    box(x - 1, y + h - 4, w + 2, 1, '#a5afb5');
  }
  function bookshelf(ctx, x, y) {
    const { box } = painter(ctx);
    box(x - 22, y - 50, 44, 63, '#29343e');
    box(x - 19, y - 47, 38, 57, '#9e754f');
    box(x - 17, y - 45, 34, 52, '#3f4241');
    const colors = ['#607f9e', '#b79769', '#8e5551', '#9eae91', '#536b83', '#c1b697'];
    for (let row = 0; row < 3; row++) {
      for (let j = 0; j < 6; j++) {
        const h = 9 + ((row + j) % 3) * 2,
          px = x - 15 + j * 5,
          py = y - 33 + row * 17;
        box(px, py - h, 3, h, colors[(j + row) % colors.length]);
        box(px + 1, py - h + 2, 1, 2, '#d9d7c4');
      }
      box(x - 18, y - 32 + row * 17, 36, 3, '#bb9267');
      box(x - 18, y - 29 + row * 17, 36, 1, '#614c3a');
    }
    box(x - 22, y - 51, 44, 3, '#c09a70');
    box(x - 22, y + 9, 44, 4, '#2b3540');
  }
  function sofa(ctx, x, y, w = 65, h = 34) {
    const { box } = painter(ctx);
    box(x + 2, y + h - 1, w, 5, '#302c2938');
    box(x + 4, y + h - 1, 4, 5, '#252a30');
    box(x + w - 9, y + h - 1, 4, 5, '#252a30');
    box(x, y, w, h, '#263440');
    box(x + 2, y + 2, w - 4, h - 4, '#4d6075');
    box(x + 5, y + 3, w - 10, Math.floor(h * 0.48), '#5d7084');
    const count = w > 45 ? 3 : 2,
      cushion = Math.floor((w - 14) / count);
    for (let i = 0; i < count; i++) {
      box(
        x + 7 + i * cushion,
        y + Math.floor(h * 0.5),
        cushion - 1,
        Math.floor(h * 0.4),
        '#60748a',
      );
      box(x + 7 + i * cushion, y + Math.floor(h * 0.5), cushion - 1, 1, '#8290a0');
    }
    box(x + 2, y + 7, 5, h - 10, '#3d4e62');
    box(x + w - 7, y + 7, 5, h - 10, '#3d4e62');
    box(x + 2, y + 6, 5, 2, '#7c8a99');
    box(x + w - 7, y + 6, 5, 2, '#7c8a99');
  }
  function paintGround(ctx, W, prefs) {
    const { box, label } = painter(ctx);
    box(0, 0, W.width, W.height, '#273443');
    // One continuous honey-oak floor, matching the miniature's indoor studio.
    box(12, 45, W.width - 24, W.height - 57, '#bc9063');
    for (let row = 0, y = 48; y < W.height - 12; y += 12, row++) {
      box(15, y, W.width - 30, 11, ['#bd9369', '#b58a60', '#c29a70', '#ba8f64'][row % 4]);
      box(15, y + 11, W.width - 30, 1, '#8f6949');
      box(15, y, W.width - 30, 1, '#d2aa7f');
      for (let x = 15 - (row % 3) * 27; x < W.width - 15; x += 82) {
        if (x > 15) box(x, y, 1, 11, '#966d4b');
        const gx = Math.max(18, x + 15);
        if (gx < W.width - 40) {
          box(gx, y + 7, 15, 1, '#a57a5238');
          box(gx + 17, y + 3, 8, 1, '#e0b98b33');
        }
      }
    }
    // Slate walls and large mountain-view windows occupy the old scenic perimeter.
    box(8, 3, W.width - 16, 48, '#929b9f');
    box(11, 5, W.width - 22, 3, '#c2c3ba');
    box(8, 47, W.width - 16, 5, '#46515b');
    box(10, 52, W.width - 20, 3, '#c4bba5');
    for (const [x, w] of [
      [74, 163],
      [252, 159],
      [430, 177],
    ])
      windowPanel(ctx, x, 9, w, 40);
    box(7, 53, 6, W.height - 61, '#53616c');
    box(13, 55, 3, W.height - 68, '#b0a38e');
    box(W.width - 13, 53, 6, W.height - 61, '#53616c');
    box(W.width - 16, 55, 3, W.height - 68, '#b0a38e');
    box(7, W.height - 12, W.width - 14, 5, '#73644f');
    box(7, W.height - 7, W.width - 14, 4, '#273443');
    // Quiet, warm daylight. No changing light flashes on the floor.
    ctx.save();
    ctx.fillStyle = '#f3dfb813';
    for (const x of [80, 260, 440]) {
      ctx.beginPath();
      ctx.moveTo(x, 55);
      ctx.lineTo(x + 110, 55);
      ctx.lineTo(x + 72, 112);
      ctx.lineTo(x - 35, 112);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    for (const r of W.rooms) {
      box(r.x + 4, r.y + 17, r.w - 8, 3, '#654d3a35');
      box(r.x + 4, r.y + 2, r.w - 8, 17, '#354456');
      box(r.x + 5, r.y + 3, r.w - 10, 1, '#82909b');
      box(r.x + 7, r.y + 5, 12, 10, '#63778b');
      label(r.number, r.x + 9, r.y + 13, 6, '#eee9dc');
      label(
        r.id === 'leadership' ? 'IGOR + CODEX' : r.name.toUpperCase(),
        r.x + 25,
        r.y + 14,
        8,
        '#eee9dc',
      );
    }
    const rest = W.lounge;
    box(rest.x, rest.y, rest.w, rest.h, '#826c5355');
    const rug = {
      sage: ['#71808a', '#526779'],
      clay: ['#a09484', '#766d66'],
      straw: ['#ab9b80', '#8b7d66'],
    }[prefs.rug] || ['#71808a', '#526779'];
    box(rest.x + 2, rest.y + 2, rest.w - 4, rest.h - 4, rug[0]);
    box(rest.x + 4, rest.y + 4, rest.w - 8, rest.h - 8, rug[1]);
    for (let x = rest.x + 8; x < rest.x + rest.w - 8; x += 8)
      box(x, rest.y + 5, 1, rest.h - 10, '#a4b0b314');
    label('CAFÉ & CONVERSA', rest.x + 9, rest.y + 14, 7, '#e7e4d7');
    // Lounge furniture reuses the old pond footprint; routes and collision boxes stay intact.
    box(49, 406, 150, 48, '#354352');
    box(51, 408, 146, 44, '#607486');
    box(54, 410, 140, 1, '#9cabb3');
  }
  function ground(ctx, W, state, time, prefs) {
    const key = ['indoor-studio-v1', W.width, W.height, prefs.material, prefs.rug].join(':');
    if (key !== groundKey) {
      groundCache = document.createElement('canvas');
      groundCache.width = W.width;
      groundCache.height = W.height;
      paintGround(groundCache.getContext('2d'), W, prefs);
      groundKey = key;
    }
    ctx.drawImage(groundCache, 0, 0);
  }
  function tree(ctx, x, y, i) {
    // Retain every original scenic anchor and depth/hit ID, with indoor furniture.
    if (i === 0 || i === 6 || i === 13) bookshelf(ctx, x, y);
    else plant(ctx, x, i < 6 ? 53 : y + 1, i < 6);
  }
  function desk(ctx, d, role, occupied, prefs, variant = 0, activity = null) {
    const { box, label } = painter(ctx),
      [dark, mid, light] = palettes[prefs.material];
    box(d.x + 3, d.y + 9, d.w + 3, d.h + 5, '#453b3038');
    box(d.x + 3, d.y + d.h - 3, 4, 12, dark);
    box(d.x + d.w - 7, d.y + d.h - 3, 4, 12, dark);
    box(d.x, d.y, d.w, d.h, dark);
    box(d.x + 1, d.y + 1, d.w - 2, d.h - 6, mid);
    box(d.x + 2, d.y + 1, d.w - 4, 2, light);
    box(d.x + 3, d.y + d.h - 6, d.w - 6, 1, dark);
    const cx = d.x + Math.floor(d.w / 2),
      screen = occupied
        ? {
            planning: '#8da3b1',
            development: '#728da5',
            testing: '#87a1a2',
            publishing: '#979eb3',
            leadership: '#7d96ae',
          }[role]
        : '#344354';
    const sx = d.w > 45 ? cx - 13 : cx - 10,
      sw = d.w > 45 ? 25 : 20;
    box(sx - 1, d.y - 12, sw + 2, 16, dark);
    box(sx, d.y - 11, sw, 13, '#24303e');
    box(sx + 2, d.y - 9, sw - 4, 9, screen);
    box(cx - 2, d.y + 2, 4, 4, dark);
    box(cx - 7, d.y + 5, 14, 2, dark);
    box(cx - 10, d.y + 9, 20, 4, '#aab7bf');
    for (let i = 0; i < 5; i++) box(cx - 8 + i * 3, d.y + 10, 1, 1, '#465769');
    if (occupied) {
      if (role === 'development') {
        box(sx + 4, d.y - 7, sw - 9, 1, '#657257');
        box(sx + 6, d.y - 4, sw - 11, 1, '#80744d');
        box(sx + 4, d.y - 1, sw - 12, 1, '#657257');
        box(d.x + 2, d.y + 7, 4, 6, '#35495c');
      } else if (role === 'testing') {
        for (let i = 0; i < 3; i++) {
          box(sx + 3, d.y - 8 + i * 3, 2, 2, '#866346');
          box(sx + 7, d.y - 8 + i * 3, 8, 1, '#866346');
        }
      } else if (role === 'publishing') {
        box(sx + 3, d.y - 8, 6, 6, '#967565');
        box(sx + 11, d.y - 8, 5, 2, '#796c59');
        box(sx + 11, d.y - 4, 5, 2, '#796c59');
      } else {
        box(sx + 4, d.y - 7, sw - 9, 1, '#657257');
        box(sx + 4, d.y - 4, sw - 7, 1, '#657257');
      }
      if (variant % 3 === 0) {
        box(d.x + d.w - 7, d.y + 7, 4, 6, paper);
        box(d.x + d.w - 3, d.y + 8, 2, 3, '#b68d58');
      } else {
        box(d.x + 2, d.y + 8, 5, 7, role === 'publishing' ? '#9d7a70' : '#839268');
        box(d.x + 3, d.y + 9, 3, 1, paper);
      }
    } else box(sx + 6, d.y - 5, 4, 1, '#b4ac91');
    if (occupied && activity && window.FirmaWorkAnimation) {
      ctx.save();
      ctx.globalAlpha = 0.08;
      box(sx - 3, d.y - 14, sw + 6, 20, '#6387ff');
      ctx.restore();
      const frame = window.FirmaWorkAnimation.screen(
        ctx,
        { x: sx + 2, y: d.y - 9, w: sw - 4, h: 9 },
        role,
        activity.time,
        activity.seed,
        activity.reduced,
      );
      box(cx - 8 + (frame.frame % 5) * 3, d.y + 10, 2, 1, '#6387ff');
      box(sx + sw - 2, d.y + 1, 1, 1, '#a6e7f5');
    }
    if (d.w > 45) {
      label(role === 'leadership' ? 'CODEX' : 'IGOR', d.x + 8, d.y + d.h - 1, 6, dark);
      if (prefs.plant) plant(ctx, d.x + d.w - 7, d.y + 1, true);
      if (prefs.lamp) {
        box(d.x + 5, d.y + 6, 7, 2, dark);
        box(d.x + 8, d.y - 6, 2, 13, dark);
        box(d.x + 5, d.y - 9, 9, 5, '#b9c8cc');
      }
    }
  }
  function chair(ctx, p, color) {
    const { box } = painter(ctx);
    box(p.x - 10, p.y + 10, 23, 4, '#302c2938');
    box(p.x - 8, p.y - 6, 18, 17, '#253240');
    box(p.x - 6, p.y - 5, 14, 10, '#52677e');
    box(p.x - 6, p.y - 5, 14, 2, '#7e8e9e');
    box(p.x - 9, p.y + 6, 20, 6, '#273746');
    box(p.x - 7, p.y + 7, 16, 3, '#61758a');
    box(p.x - 10, p.y + 3, 3, 7, '#35485d');
    box(p.x + 8, p.y + 3, 3, 7, '#35485d');
    box(p.x - 1, p.y + 12, 3, 3, '#2a3137');
    box(p.x - 8, p.y + 15, 17, 2, '#303b46');
    box(p.x - 9, p.y + 16, 3, 2, '#222d38');
    box(p.x + 7, p.y + 16, 3, 2, '#222d38');
  }
  function objects(W, state, prefs, live = {}) {
    const actors = new Map((live.actors || []).map((a) => [a.a.id, a]));
    const activityFor = (id) => {
      const a = actors.get(id);
      if (!a || a.moving || !a.sitting || a.p.mode !== 'desk') return null;
      return {
        time: live.time || 0,
        reduced: !!live.reduced,
        seed: String(id)
          .split('')
          .reduce((n, c) => n + c.charCodeAt(0), 0),
      };
    };
    const items = [],
      add = (id, y, draw, layer = 0) => items.push({ id, y, draw, layer });
    W.scenery.trees.forEach((p, i) => add('tree:' + i, p.y + 15, (c) => tree(c, p.x, p.y, i)));
    for (const r of W.rooms) {
      const members = (window.FirmaLife?.roster(state) || state.agents).filter(
        (a) => a.department === r.id,
      );
      W.workDesks
        .filter((d) => d.room === r.id)
        .forEach((d, i) =>
          add('desk:' + r.id + i, d.y + d.h + 8, (c) =>
            desk(c, d, r.id, !!members[i], prefs, i, activityFor(members[i]?.id)),
          ),
        );
    }
    for (const p of W.chairs)
      add('chair:' + p.x + ':' + p.y, p.y - 3, (c) => chair(c, p, accents[p.room]));
    for (const b of W.boards)
      add('board:' + b.id, b.y + b.h, (c) => {
        const { box, label } = painter(c);
        box(b.x + 1, b.y + 4, b.w, b.h, '#4c473b44');
        box(b.x, b.y, b.w, b.h, '#836e50');
        box(b.x + 2, b.y + 2, b.w - 4, b.h - 4, paper);
        if (b.id === 'planning') {
          for (let i = 0; i < 3; i++)
            box(
              b.x + 4 + (i % 2) * 7,
              b.y + 4 + Math.floor(i / 2) * 8,
              5,
              5,
              i % 2 ? '#bd9368' : '#8e9b6b',
            );
        } else if (b.id === 'development') label('{ }', b.x + 3, b.y + 14, 7, '#6e704e');
        else if (b.id === 'testing') {
          for (let i = 0; i < 3; i++) {
            label('✓', b.x + 3, b.y + 7 + i * 6, 5, '#7a8656');
            box(b.x + 9, b.y + 5 + i * 6, 6, 1, '#b1966f');
          }
        } else {
          box(b.x + 4, b.y + 5, 11, 7, '#8c82d4');
          box(b.x + 4, b.y + 14, 7, 2, '#9aa073');
        }
      });
    add('codex-desk', W.furniture.leaderDesk.y + W.furniture.leaderDesk.h + 8, (c) =>
      desk(c, W.furniture.leaderDesk, 'leadership', true, prefs, 0, activityFor('codex-leader')),
    );
    add('admin-desk', W.furniture.adminDesk.y + W.furniture.adminDesk.h + 8, (c) =>
      desk(c, W.furniture.adminDesk, 'development', true, prefs, 1, activityFor('igor-host')),
    );
    add('codex-chair', W.leaderHome.y - 3, (c) => chair(c, W.leaderHome, '#4b5d73'));
    add('admin-chair', W.playerSeats.admin.y - 3, (c) => chair(c, W.playerSeats.admin, '#4b5d73'));
    const rest = W.lounge;
    for (const [i, p] of [...rest.seats, W.playerSeats.rest].entries())
      add('bench:' + i, p.y - 4, (c) => sofa(c, p.x - 13, p.y - 8, 27, 21));
    for (let i = 0; i < 3; i++)
      add('life-plant-' + i, rest.y + 8 + i * 20, (c) =>
        plant(c, rest.x - 8, rest.y + 8 + i * 20, true),
      );
    const coffee = rest.coffee;
    add('coffee', coffee.y + coffee.h + 6, (c) => {
      const { box } = painter(c);
      box(coffee.x + 3, coffee.y + 5, coffee.w, coffee.h, '#5a513833');
      box(coffee.x, coffee.y, coffee.w, coffee.h, '#8b6e4f');
      box(coffee.x + 2, coffee.y + 1, coffee.w - 4, coffee.h - 6, '#d9ba85');
      box(coffee.x + 5, coffee.y - 12, 16, 18, '#273442');
      box(coffee.x + 7, coffee.y - 10, 12, 4, '#97aab8');
      box(coffee.x + 8, coffee.y - 3, 9, 4, '#536675');
      box(coffee.x + 10, coffee.y + 4, 6, 4, paper);
      box(coffee.x + 27, coffee.y + 6, 4, 6, paper);
    });
    if (prefs.plant)
      add('cafe-plant', coffee.y + coffee.h + 7, (c) =>
        plant(c, coffee.x + 31, coffee.y + 4, true),
      );
    add('studio-sofa', 434, (c) => sofa(c, 54, 410, 65, 21));
    add('studio-armchair', 449, (c) => sofa(c, 156, 410, 38, 34));
    add('studio-table', 447, (c) => {
      const { box } = painter(c);
      box(70, 435, 33, 14, '#2b3642');
      box(72, 437, 29, 10, '#718598');
      box(75, 438, 9, 7, '#e9e6db');
      box(76, 440, 6, 1, '#8a98a3');
      box(92, 439, 5, 6, '#d2b48a');
      box(93, 439, 3, 2, '#5c4637');
    });
    add('bridge', 457, (c) => {
      const { box } = painter(c);
      box(122, 447, 29, 7, '#354555');
      box(124, 448, 25, 4, '#6b8191');
    });
    add('entry', W.exit.y - 14, (c) => {
      const { box, label } = painter(c),
        open = state.office?.status === 'open';
      box(W.exit.x - 14, W.exit.y - 42, 36, 23, '#354555');
      box(W.exit.x - 12, W.exit.y - 40, 32, 19, open ? '#859b9c' : '#9d8c7b');
      label(open ? 'ABERTO' : 'FECHADO', W.exit.x - 10, W.exit.y - 28, 5);
    });
    return items;
  }
  function sprite(ctx, o) {
    const { box } = painter(ctx),
      phase = o.phase || 0,
      time = o.time || 0,
      stride = o.walking ? Math.round(Math.sin(time * 13 + phase) * 2) : 0,
      bounce = o.walking ? Math.round(Math.sin(time * 13) * 1) : 0,
      dx = o.facing === 'left' ? -2 : o.facing === 'right' ? 2 : 0;
    ctx.save();
    ctx.translate(0, bounce + (o.sitting ? 2 : 0));
    box(-10, 10, 21, 4, '#38462e44');
    box(-7, 0, 6, o.sitting ? 7 : 11, ink);
    box(2, 0, 6, o.sitting ? 7 : 11, ink);
    box(-8, 9 + stride, 8, 4, '#514436');
    box(2, 9 - stride, 8, 4, '#514436');
    box(-9, -15, 19, 18, ink);
    box(-7, -13, 15, 14, o.shirt);
    box(-6, -12, 3, 9, '#ffffff22');
    box(-2, -12, 1, 12, '#473d3222');
    const motion =
      o.animation === 'typing'
        ? Math.floor(time * 5 + phase) % 2
        : o.animation === 'talking'
          ? Math.floor(time * 2 + phase) % 2
          : 0;
    box(-12, -11 - stride - motion, 4, 11, ink);
    box(-11, -9 - stride - motion, 3, 7, o.skin);
    box(9, -11 + stride + motion, 4, 11, ink);
    box(9, -9 + stride + motion, 3, 7, o.skin);
    box(-11, -34, 23, 22, ink);
    box(-9, -32, 19, 18, o.skin);
    box(-9, -36, 19, 8, o.hair);
    box(-11, -30, 5, 10, o.hair);
    box(8, -30, 4, 9, o.hair);
    box(-7, -38, 15, 4, ink);
    box(-6, -36, 13, 4, o.hair);
    box(-7, -33, 7, 2, '#ffffff20');
    if (o.facing === 'up') box(-9, -29, 19, 14, o.hair);
    else {
      box(-5 + dx, -24, 2, 4, ink);
      box(4 + dx, -24, 2, 4, ink);
      box(-6 + dx, -18, 3, 2, '#bd8670');
      if (phase % 3 === 0) {
        box(-7 + dx, -25, 7, 6, '#675443');
        box(2 + dx, -25, 7, 6, '#675443');
        box(-5 + dx, -24, 3, 3, '#d0ba92');
        box(4 + dx, -24, 3, 3, '#d0ba92');
        box(0 + dx, -23, 2, 1, '#675443');
      }
    }
    if (o.animation === 'reading') {
      box(-7, -6, 14, 10, '#78644c');
      box(-6, -5, 6, 8, paper);
      box(1, -5, 5, 8, '#d3c49e');
    }
    if (o.animation === 'coffee') {
      box(9, -11 - motion, 6, 7, paper);
      box(14, -10 - motion, 2, 4, '#9e7a55');
      if (time && Math.floor(time * 2) % 3 === 0) box(11, -16 - motion, 1, 3, '#f5e8c4');
    }
    if (o.animation === 'waiting') {
      box(-2, -18, 4, 1, '#795844');
      box(-1, -6, 3, 5, '#b5a078');
    }
    if (o.player) {
      box(-3, -46, 7, 3, '#e9c779');
      box(-1, -43, 3, 3, '#e9c779');
    }
    ctx.restore();
  }
  function lighting(ctx, W, state, prefs) {
    const { box } = painter(ctx),
      evening =
        prefs.lighting === 'evening' ||
        (prefs.lighting === 'auto' && state.office?.status !== 'open');
    if (evening) box(0, 0, W.width, W.height, '#16243b38');
    if (prefs.lamp)
      for (const d of Object.values(W.furniture)) {
        ctx.save();
        ctx.globalAlpha = evening ? 0.17 : 0.07;
        ctx.fillStyle = '#ffe4b3';
        ctx.beginPath();
        ctx.ellipse(d.x + 10, d.y + 6, 32, 22, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
  }
  function draw(ctx, W, state, time, prefs = window.FirmaScene.preferences()) {
    ground(ctx, W, state, time, prefs);
    for (const o of window.FirmaScene.depth(objects(W, state, prefs))) o.draw(ctx);
    lighting(ctx, W, state, prefs);
  }
  window.FirmaVillage = { draw, ground, objects, sprite, lighting };
})();
