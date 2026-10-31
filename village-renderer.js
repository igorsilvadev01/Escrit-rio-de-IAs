/* Original woodland studio artwork. Cached floor; objects share actors' depth order. */
(() => {
  'use strict';
  const ink = '#453c32',
    paper = '#f4f7ff';
  let groundCache = null,
    groundKey = '';
  const palettes = {
    oak: ['#835c40', '#c69b68', '#e1bd87'],
    walnut: ['#574635', '#937450', '#bea078'],
    cream: ['#998263', '#ddd0ab', '#f3e6c7'],
  };
  const accents = {
    planning: '#728fdb',
    development: '#3455f5',
    testing: '#68a7ca',
    publishing: '#8c82d4',
    leadership: '#6174be',
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
    ctx.scale(small ? 0.65 : 1, small ? 0.65 : 1);
    box(-6, 0, 13, 11, '#74513e');
    box(-7, -1, 15, 4, '#bc8860');
    box(-1, -17, 3, 17, '#526c42');
    box(-10, -15, 9, 6, '#648b50');
    box(1, -22, 8, 8, '#8aa85d');
    box(2, -12, 10, 6, '#799b55');
    box(-7, -25, 7, 8, '#456743');
    box(-5, -23, 3, 3, '#a6bc75');
    ctx.restore();
  }
  function paintGround(ctx, W, prefs) {
    const { box, label } = painter(ctx);
    box(0, 0, W.width, W.height, '#c8d9f0');
    for (let y = 0; y < W.height; y += 16)
      for (let x = 0; x < W.width; x += 16) {
        const n = (x * 13 + y * 7) % 97;
        box(x, y, 16, 16, n < 32 ? '#cbdcf2' : n < 58 ? '#c5d7ed' : '#ceddf3');
        if (n < 12) {
          box(x + 5, y + 9, 2, 3, '#e3edfc');
          box(x + 8, y + 7, 2, 5, '#b9cde9');
        }
      }
    box(28, 198, 575, 38, '#9db5d7');
    box(30, 201, 571, 32, '#9bb0cf');
    box(30, 204, 571, 26, '#d8e3f4');
    box(260, 230, 25, 190, '#9bb0cf');
    box(264, 230, 17, 190, '#d8e3f4');
    for (const f of W.floor) {
      box(f.x + 3, f.y + 6, f.w, f.h, '#53624244');
      box(f.x - 2, f.y - 2, f.w + 4, f.h + 5, '#6c85af');
      box(f.x, f.y, f.w, f.h, '#dce5f3');
      for (let y = f.y; y < f.y + f.h; y += 11) {
        box(f.x, y, f.w, 10, Math.floor(y / 11) % 2 ? '#e3eaf6' : '#edf2fa');
        for (let x = f.x + 10 + (Math.floor(y / 11) % 2) * 23; x < f.x + f.w; x += 46)
          box(x, y, 1, 10, '#c5d3e8');
      }
    }
    const rugs = {
      sage: ['#6d7955', '#a8b388'],
      clay: ['#9b7054', '#c5a17c'],
      straw: ['#9e8c5c', '#d2c18a'],
    };
    for (const r of W.rooms) {
      const c =
        r.id === 'leadership'
          ? rugs[prefs.rug]
          : {
              planning: rugs.sage,
              development: rugs.straw,
              testing: rugs.clay,
              publishing: ['#89756e', '#b7a58e'],
            }[r.id];
      box(r.x + 6, r.y + 25, r.w - 12, r.h - 30, c[0]);
      box(r.x + 8, r.y + 27, r.w - 16, r.h - 34, c[1]);
      for (let x = r.x + 12; x < r.x + r.w - 12; x += 9) {
        box(x, r.y + 28, 3, 1, c[0]);
        box(x, r.y + r.h - 9, 3, 1, c[0]);
      }
      box(r.x + 11, r.y + 30, r.w - 22, 1, c[0]);
      box(r.x + 5, r.y + 3, r.w - 10, 18, '#b18d61');
      box(r.x + 6, r.y + 3, r.w - 12, 15, paper);
      box(r.x + 9, r.y + 5, 11, 11, accents[r.id]);
      label(r.number, r.x + 10, r.y + 13, 6);
      label(r.id === 'leadership' ? 'IGOR + CODEX' : r.name.toUpperCase(), r.x + 25, r.y + 14, 8);
    }
    const rest = W.lounge;
    box(rest.x + 3, rest.y + 5, rest.w, rest.h, '#52633d55');
    box(rest.x, rest.y, rest.w, rest.h, '#8e9468');
    box(rest.x + 2, rest.y + 2, rest.w - 4, rest.h - 4, '#c4c597');
    box(rest.x + 6, rest.y + 6, rest.w - 12, rest.h - 12, '#d7d4ac');
    label('CAFÉ & CONVERSA', rest.x + 10, rest.y + 15, 7, '#656a46');
    box(49, 406, 150, 48, '#61794d');
    box(54, 410, 140, 40, '#c4b483');
    box(59, 414, 130, 30, '#6b9690');
    box(63, 414, 124, 4, '#a6c2ac');
    for (let i = 0; i < 8; i++) box(63 + i * 15, 425 + (i % 2) * 8, 9, 2, '#537f7b');
    for (let i = 0; i < 43; i++) {
      const x = 28 + ((i * 137) % (W.width - 60)),
        y = 28 + ((i * 73) % 414);
      if (
        W.floor.some((f) => x > f.x - 8 && x < f.x + f.w + 8 && y > f.y - 8 && y < f.y + f.h + 8) ||
        (x > 45 && x < 200 && y > 400)
      )
        continue;
      box(x, y, 4, 4, '#e5e6bc');
      box(x + 1, y + 1, 2, 2, '#cfaf64');
    }
  }
  function ground(ctx, W, state, time, prefs) {
    const key = [prefs.rug, W.width, W.height].join(':');
    if (key !== groundKey) {
      groundCache = document.createElement('canvas');
      groundCache.width = W.width;
      groundCache.height = W.height;
      paintGround(groundCache.getContext('2d'), W, prefs);
      groundKey = key;
    }
    ctx.drawImage(groundCache, 0, 0);
    if (time && Math.floor(time) % 4 === 0) {
      const { box } = painter(ctx);
      box(77, 433, 4, 1, '#c8d9bc');
      box(170, 421, 5, 1, '#c8d9bc');
    }
  }
  function tree(ctx, x, y, i) {
    const { box } = painter(ctx);
    box(x - 24, y + 10, 49, 7, '#38472f33');
    box(x - 6, y - 3, 12, 19, '#72573e');
    box(x - 2, y - 2, 5, 18, '#a17a50');
    box(x - 23, y - 33, 46, 27, '#3f583c');
    box(x - 27, y - 24, 53, 16, '#3f583c');
    box(x - 22, y - 37, 43, 27, '#547747');
    box(x - 17, y - 43, 33, 25, '#759653');
    box(x - 11, y - 43, 19, 6, '#94ac68');
    box(x - 24, y - 23, 18, 9, '#65894c');
    box(x + 7, y - 23, 17, 11, '#486b40');
    box(x - 17, y - 34, 8, 3, '#9ab471');
    box(x + 1, y - 12, 14, 4, '#4c6b40');
    if (i % 3 === 0) {
      box(x + 10, y - 27, 4, 4, '#d1aa5e');
      box(x - 12, y - 17, 4, 4, '#e2c27b');
    }
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
            planning: '#b8c99c',
            development: '#bdb797',
            testing: '#d2b290',
            publishing: '#c6b0ab',
            leadership: '#d5c38d',
          }[role]
        : '#998f74';
    const sx = d.w > 45 ? cx - 13 : cx - 10,
      sw = d.w > 45 ? 25 : 20;
    box(sx - 1, d.y - 12, sw + 2, 16, dark);
    box(sx, d.y - 11, sw, 13, '#514f43');
    box(sx + 2, d.y - 9, sw - 4, 9, screen);
    box(cx - 2, d.y + 2, 4, 4, dark);
    box(cx - 7, d.y + 5, 14, 2, dark);
    box(cx - 10, d.y + 9, 20, 4, '#e3d6b8');
    for (let i = 0; i < 5; i++) box(cx - 8 + i * 3, d.y + 10, 1, 1, '#9c927a');
    if (occupied) {
      if (role === 'development') {
        box(sx + 4, d.y - 7, sw - 9, 1, '#657257');
        box(sx + 6, d.y - 4, sw - 11, 1, '#80744d');
        box(sx + 4, d.y - 1, sw - 12, 1, '#657257');
        box(d.x + 2, d.y + 7, 4, 6, '#605c4c');
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
      ctx.save();ctx.globalAlpha=.08;box(sx-3,d.y-14,sw+6,20,'#6387ff');ctx.restore();
      const frame=window.FirmaWorkAnimation.screen(ctx,{x:sx+2,y:d.y-9,w:sw-4,h:9},role,activity.time,activity.seed,activity.reduced);
      box(cx-8+(frame.frame%5)*3,d.y+10,2,1,'#6387ff');
      box(sx+sw-2,d.y+1,1,1,'#a6e7f5');
    }
    if (d.w > 45) {
      label(role === 'leadership' ? 'CODEX' : 'IGOR', d.x + 8, d.y + d.h - 1, 6, dark);
      if (prefs.plant) plant(ctx, d.x + d.w - 7, d.y + 1, true);
      if (prefs.lamp) {
        box(d.x + 5, d.y + 6, 7, 2, dark);
        box(d.x + 8, d.y - 6, 2, 13, dark);
        box(d.x + 5, d.y - 9, 9, 5, '#e6c887');
      }
    }
  }
  function chair(ctx, p, color) {
    const { box } = painter(ctx);
    box(p.x - 10, p.y + 10, 23, 5, '#51483233');
    box(p.x - 7, p.y - 5, 14, 16, '#655a43');
    box(p.x - 6, p.y - 5, 12, 8, color);
    box(p.x - 8, p.y + 8, 17, 4, '#655a43');
    box(p.x - 6, p.y + 8, 13, 2, '#e2d0a2');
    box(p.x - 7, p.y + 12, 2, 3, '#655a43');
    box(p.x + 6, p.y + 12, 2, 3, '#655a43');
  }
  function objects(W, state, prefs, live = {}) {
    const actors = new Map((live.actors || []).map(a=>[a.a.id,a]));
    const activityFor = id => {
      const a=actors.get(id);
      if(!a || a.moving || !a.sitting || a.p.mode!=='desk') return null;
      return {time:live.time||0,reduced:!!live.reduced,seed:String(id).split('').reduce((n,c)=>n+c.charCodeAt(0),0)};
    };
    const items = [],
      add = (id, y, draw, layer = 0) => items.push({ id, y, draw, layer });
    W.scenery.trees.forEach((p, i) => add('tree:' + i, p.y + 15, (c) => tree(c, p.x, p.y, i)));
    for (const r of W.rooms) {
      const members = (window.FirmaLife?.roster(state) || state.agents).filter((a) => a.department === r.id);
      W.workDesks
        .filter((d) => d.room === r.id)
        .forEach((d, i) =>
          add('desk:' + r.id + i, d.y + d.h + 8, (c) => desk(c, d, r.id, !!members[i], prefs, i, activityFor(members[i]?.id))),
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
    add('codex-chair', W.leaderHome.y - 3, (c) => chair(c, W.leaderHome, '#b69d6b'));
    add('admin-chair', W.playerSeats.admin.y - 3, (c) => chair(c, W.playerSeats.admin, '#8b9c70'));
    const rest = W.lounge;
    for (const [i, p] of [...rest.seats, W.playerSeats.rest].entries())
      add('bench:' + i, p.y - 4, (c) => {
        const { box } = painter(c);
        box(p.x - 12, p.y - 7, 25, 17, '#796346');
        box(p.x - 10, p.y - 6, 21, 6, '#d4bd8c');
        box(p.x - 10, p.y + 2, 21, 5, '#b49a70');
        box(p.x - 11, p.y + 8, 3, 5, '#796346');
        box(p.x + 8, p.y + 8, 3, 5, '#796346');
      });
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
      box(coffee.x + 5, coffee.y - 12, 16, 18, '#514d3f');
      box(coffee.x + 7, coffee.y - 10, 12, 4, '#b7ba90');
      box(coffee.x + 8, coffee.y - 3, 9, 4, '#8b795d');
      box(coffee.x + 10, coffee.y + 4, 6, 4, paper);
      box(coffee.x + 27, coffee.y + 6, 4, 6, paper);
    });
    if (prefs.plant)
      add('cafe-plant', coffee.y + coffee.h + 7, (c) =>
        plant(c, coffee.x + 31, coffee.y + 4, true),
      );
    add('bridge', 457, (c) => {
      const { box } = painter(c);
      box(121, 405, 33, 51, '#806347');
      box(124, 407, 27, 47, '#a98258');
      for (let y = 409; y < 452; y += 7) {
        box(125, y, 25, 5, '#d1ad7a');
        box(126, y, 23, 1, '#ead0a0');
      }
    });
    add('fence', 427, (c) => {
      const { box } = painter(c);
      for (let x = 304; x < 600; x += 36) {
        box(x, 414, 28, 5, '#795e43');
        box(x + 2, 412, 27, 3, '#b99a67');
        box(x - 3, 404, 7, 22, '#795e43');
        box(x - 2, 402, 5, 20, '#d7bb89');
      }
    });
    add('entry', W.exit.y - 14, (c) => {
      const { box, label } = painter(c),
        open = state.office?.status === 'open';
      box(W.exit.x - 14, W.exit.y - 42, 36, 23, '#786347');
      box(W.exit.x - 12, W.exit.y - 40, 32, 19, open ? '#bbc899' : '#c7a17c');
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
    if (evening) box(0, 0, W.width, W.height, '#55433622');
    if (prefs.lamp)
      for (const d of Object.values(W.furniture)) {
        ctx.save();
        ctx.globalAlpha = evening ? 0.17 : 0.07;
        ctx.fillStyle = '#ffe3a0';
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
