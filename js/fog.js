import { CELL_METERS, MIN_FOG_ZOOM, R } from './core.js';
import { visited } from './store.js';
import { map } from './world.js';

const FOG_MARGIN = 300; // запас навколо екрана щоб драг не оголював краї
const fogCanvas = document.createElement('canvas');
fogCanvas.id = 'fogCanvas';
map.getPane('mapPane').appendChild(fogCanvas);
const fctx = fogCanvas.getContext('2d');
// Прихований шар з ЧІТКИМИ квадратами; видимий canvas — його блюр-копія.
// Так краї м'які, а форма лишається квадратною (без видимих кругів).
const fogHard = document.createElement('canvas');
const hctx = fogHard.getContext('2d');

function fitCanvas(c, ctx, W, H, dpr) {
  if (c.width !== Math.round(W * dpr) || c.height !== Math.round(H * dpr)) {
    c.width = Math.round(W * dpr);
    c.height = Math.round(H * dpr);
    c.style.width = W + 'px';
    c.style.height = H + 'px';
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

export function drawFog() {
  const size = map.getSize();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const z = map.getZoom();
  const W = Math.round(size.x + FOG_MARGIN * 2), H = Math.round(size.y + FOG_MARGIN * 2);
  fitCanvas(fogCanvas, fctx, W, H, dpr);
  fitCanvas(fogHard, hctx, W, H, dpr);
  const topLeft = map.containerPointToLayerPoint([-FOG_MARGIN, -FOG_MARGIN]);
  L.DomUtil.setPosition(fogCanvas, topLeft);

  // видимий шар чистимо повністю — інакше старі кадри накопичуються
  fctx.globalCompositeOperation = 'source-over';
  fctx.filter = 'none';
  fctx.clearRect(0, 0, W, H);

  hctx.globalCompositeOperation = 'source-over';
  hctx.fillStyle = '#0b1120'; // непрозорий — карту під туманом не видно
  hctx.fillRect(0, 0, W, H);
  if (z < MIN_FOG_ZOOM || visited.size === 0) {
    // суцільний туман без блюру: просто копіюємо
    fctx.globalCompositeOperation = 'source-over';
    fctx.filter = 'none';
    fctx.drawImage(fogHard, 0, 0, W, H);
    return;
  }

  // Ланцюжок: екран C -> шар L = C - panePos -> глобаль G = L + pixelOrigin.
  const panePos = L.DomUtil.getPosition(map.getPane('mapPane'));
  const origin = map.getPixelOrigin();
  const scale = 256 * Math.pow(2, z);
  const k = 0.5 / (Math.PI * R);
  const toCx = (p) => {
    const G = (p - FOG_MARGIN - panePos.x) + origin.x;
    return Math.floor((((G / scale) - 0.5) / k) / CELL_METERS);
  };
  const toCy = (p) => {
    const G = (p - FOG_MARGIN - panePos.y) + origin.y;
    return Math.floor(((0.5 - (G / scale)) / k) / CELL_METERS);
  };
  const x0 = toCx(0), x1 = toCx(W);
  const y0 = toCy(H), y1 = toCy(0); // південь..північ
  if ((x1 - x0) > 600 || (y1 - y0) > 600) return;

  // Чіткі квадрати на прихованому шарі (destination-out).
  hctx.globalCompositeOperation = 'destination-out';
  for (let cx = x0; cx <= x1; cx++) {
    const gx0 = scale * ((cx * CELL_METERS) * k + 0.5);
    const gx1 = scale * (((cx + 1) * CELL_METERS) * k + 0.5);
    const px0 = (gx0 - origin.x) + panePos.x + FOG_MARGIN;
    const px1 = (gx1 - origin.x) + panePos.x + FOG_MARGIN;
    for (let cy = y0; cy <= y1; cy++) {
      if (!visited.has(cx + ':' + cy)) continue;
      const gyN = scale * (-((cy + 1) * CELL_METERS) * k + 0.5);
      const gyS = scale * (-(cy * CELL_METERS) * k + 0.5);
      const pyN = (gyN - origin.y) + panePos.y + FOG_MARGIN;
      const pyS = (gyS - origin.y) + panePos.y + FOG_MARGIN;
      hctx.fillRect(px0, pyN, (px1 - px0) + 1, (pyS - pyN) + 1);
    }
  }
  // Видимий шар = блюр-копія: краї м'які, форма квадратна.
  // Радіус ~18% клітинки (4..12px). Край canvas далеко за екраном — без щілин.
  const cellPx = CELL_METERS * scale * k;
  const blurR = Math.min(12, Math.max(4, cellPx * 0.18));
  fctx.globalCompositeOperation = 'source-over';
  try { fctx.filter = `blur(${blurR.toFixed(1)}px)`; } catch { fctx.filter = 'none'; }
  fctx.drawImage(fogHard, 0, 0, W, H);
  fctx.filter = 'none';
}

export function initFog() {
  // Canvas — дитина pane: під час драгу їде разом з тайлами.
  map.on('viewreset moveend zoomend resize', drawFog);
}
