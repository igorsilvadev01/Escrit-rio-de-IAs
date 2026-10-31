(() => {
  'use strict';
  const image = new Image(),
    floor = new Image();
  let ready = false;
  const boxes = [
    [57, 87, 385, 316],
    [491, 87, 426, 316],
    [990, 88, 260, 334],
    [1400, 115, 262, 307],
    [49, 532, 433, 271],
    [554, 420, 298, 413],
    [942, 480, 297, 370],
    [1284, 489, 452, 333],
  ];
  function draw(ctx, index, x, y, w, h) {
    if (!ready) return false;
    const b = boxes[index];
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, ...b, x, y, w, h);
    ctx.restore();
    return true;
  }
  function ground(ctx, W) {
    if (!ready) return false;
    const tile = document.createElement('canvas');
    tile.width = 76;
    tile.height = 40;
    const c = tile.getContext('2d');
    c.imageSmoothingEnabled = false;
    c.drawImage(floor, 650, 350, 380, 200, 0, 0, 76, 40);
    ctx.fillStyle = ctx.createPattern(tile, 'repeat');
    ctx.fillRect(0, 0, W.width, W.height);
    ctx.fillStyle = '#8e9ba2';
    ctx.fillRect(0, 0, W.width, 60);
    ctx.fillStyle = '#364559';
    ctx.fillRect(0, 54, W.width, 7);
    for (const [x, w] of [
      [72, 164],
      [252, 160],
      [430, 177],
    ])
      draw(ctx, 7, x, 3, w, 52);
    const rest = W.lounge;
    ctx.fillStyle = '#52697966';
    ctx.fillRect(rest.x, rest.y, rest.w, rest.h);
    ctx.strokeStyle = '#b7bdac';
    ctx.lineWidth = 1;
    ctx.strokeRect(rest.x + 3, rest.y + 3, rest.w - 6, rest.h - 6);
    ctx.font = '7px monospace';
    ctx.fillStyle = '#f3ebdc';
    ctx.fillText('CAFÉ & CONVERSA', rest.x + 8, rest.y + 12);
    for (const room of W.rooms) {
      ctx.fillStyle = '#26394ae8';
      ctx.fillRect(room.x + 5, room.y + 3, room.w - 10, 16);
      ctx.font = 'bold 7px monospace';
      ctx.fillStyle = '#f3ebdc';
      ctx.fillText(
        room.id === 'leadership' ? 'IGOR + CODEX' : room.name.toUpperCase(),
        room.x + 12,
        room.y + 14,
      );
    }
    return true;
  }
  Promise.all([
    new Promise((ok) => {
      image.onload = ok;
      image.src = 'public-art/furniture.png?v=1';
    }),
    new Promise((ok) => {
      floor.onload = ok;
      floor.src = 'public-art/cozy-room.png?v=cozy-1';
    }),
  ]).then(() => (ready = true));
  window.FirmaOfficeArt = {
    draw,
    ground,
    get ready() {
      return ready;
    },
  };
})();
