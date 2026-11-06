import { escapeHtml } from './util';
import { Point } from './points';

export function renderPointsList(pts: Point[]): void {
  const container = document.getElementById('pointsList');
  if (!container) return;
  if (pts.length === 0) {
    container.innerHTML = '<div class="muted">Точок немає</div>';
    return;
  }
  container.innerHTML = pts.map((p) => `
    <div class="point-item" style="padding:6px 8px;border-bottom:1px solid #374151;display:flex;justify-content:space-between;align-items:center;gap:8px">
      <div>
        <div style="font-weight:600">${escapeHtml(p.label || p.lat.toFixed(4) + ', ' + p.lng.toFixed(4))}</div>
        <div style="font-size:11px;opacity:.6">${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}</div>
      </div>
      <button class="btn small ghost" onclick="window.__removePointById('${p.lat.toFixed(5)}:${p.lng.toFixed(5)}')">✕</button>
    </div>
  `).join('');
}

export function removePointById(id: string): void {
  import('./points').then((m) => {
    const pts = m.points;
    const i = pts.findIndex((p) => p.lat.toFixed(5) + ':' + p.lng.toFixed(5) === id);
    if (i < 0) return;
    m.removePoint(pts[i]);
  });
}
