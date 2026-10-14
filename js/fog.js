import { CELL_METERS, MIN_FOG_ZOOM, R } from './core.js';
import { visited } from './store.js';
import { map } from './world.js';

const FOG_MARGIN = 300; // запас навколо екрана щоб драг не оголював краї
const fogCanvas = document.createElement('canvas');
fogCanvas.id = 'fogCanvas';
map.getPane('mapPane').appendChild(fogCanvas);
const fctx = fogCanvas.getContext('2d');

export function drawFog() {
  const size = map.getSize();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const z = map.getZoom();
  const W = Math.round(size.x + FOG_MARGIN * 2), H = Math.round(size.y + FOG_MARGIN * 2);
  if (fogCanvas.width !== Math.round(W * dpr) || fogCanvas.height !== Math.round(H * dpr)) {
    fogCanvas.width = Math.round(W * dpr);
    fogCanvas.height = Math.round(H * dpr);
    fogCanvas.style.width = W + 'px';
    fogCanvas.style.height = H + 'px';
  }
  fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const topLeft = map.containerPointToLayerPoint([-FOG_MARGIN, -FOG_MARGIN]);
  L.DomUtil.setPosition(fogCanvas, topLeft);

  fctx.globalCompositeOperation = 'source-over';
  fctx.fillStyle = '#0b1120'; // непрозорий — карту під туманом не видно
  fctx.fillRect(0, 0, W, H);
  if (z < MIN_FOG_ZOOM || visited.size === 0) return;

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

  // Стирання = дірки у тумані з М'ЯКИМИ краями: радіальний градієнт
  // (повне стирання до 0.6 клітинки, розтушовування до 0.9). Сусідні дірки
  // зливаються без швів, зовні — плавний перехід у темряву.
  // На дрібних зумах (клітинка < ~20px) розтушовування не видно — там швидкі прямокутники.
  const soft = z >= 15;
  fctx.globalCompositeOperation = 'destination-out';
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
      if (!soft) {
        fctx.fillRect(px0, pyN, (px1 - px0) + 1, (pyS - pyN) + 1);
        continue;
      }
      const ccx = (px0 + px1) / 2, ccy = (pyN + pyS) / 2;
      const w = px1 - px0, r0 = w * 0.6, r1 = w * 0.9;
      const g = fctx.createRadialGradient(ccx, ccy, r0, ccx, ccy, r1);
      g.addColorStop(0, 'rgba(0,0,0,1)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      fctx.fillStyle = g;
      fctx.beginPath();
      fctx.arc(ccx, ccy, r1, 0, Math.PI * 2);
      fctx.fill();
    }
  }
  fctx.globalCompositeOperation = 'source-over';
}

export function initFog() {
  // Canvas — дитина pane: під час драгу їде разом з тайлами.
  map.on('viewreset moveend zoomend resize', drawFog);
}
