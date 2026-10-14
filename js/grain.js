const TILE = 128;
let tile = null, alpha = 0.08;

export function setGrainAlpha(a) { alpha = a; }

function makeTile() {
  tile = document.createElement('canvas');
  tile.width = tile.height = TILE;
  const c = tile.getContext('2d');
  const d = c.createImageData(TILE, TILE);
  for (let i = 0; i < d.data.length; i += 4) {
    const v = 200 + Math.random() * 55; // світла перлина
    d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
    d.data[i + 3] = 255;
  }
  c.putImageData(d, 0, 0);
}

// Зерно тільки по непрозорому (source-atop): дірки чисті.
// ax, ay — глобальні координати кута canvas: фаза плитки прив'язана до світу.
export function paintGrain(ctx, W, H, ax, ay) {
  if (alpha <= 0) return;
  if (!tile) makeTile();
  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';
  ctx.globalAlpha = alpha;
  const ox = ((ax % TILE) + TILE) % TILE, oy = ((ay % TILE) + TILE) % TILE;
  ctx.translate(-ox, -oy);
  ctx.fillStyle = ctx.createPattern(tile, 'repeat');
  ctx.fillRect(0, 0, W + TILE, H + TILE);
  ctx.restore();
}
