import { escapeHtml } from './util';
import type { Point } from './points';
import { t } from './i18n';

const pointId = (p: Point): string => p.lat.toFixed(5) + ':' + p.lng.toFixed(5);

export function renderPointsList(pts: Point[]): void {
  const container = document.getElementById('pointsList');
  if (!container) return;
  if (pts.length === 0) {
    container.innerHTML = `<div class="muted">${escapeHtml(t('points.list.empty'))}</div>`;
    return;
  }
  container.innerHTML = pts.map((p) => `
    <div class="point-item" style="padding:6px 8px;border-bottom:1px solid #374151;display:flex;justify-content:space-between;align-items:center;gap:8px">
      <div>
        <div style="font-weight:600">${escapeHtml(p.label || p.lat.toFixed(4) + ', ' + p.lng.toFixed(4))}</div>
        <div style="font-size:11px;opacity:.6">${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}</div>
      </div>
      <button class="btn small ghost" data-point-id="${escapeHtml(pointId(p))}" title="${escapeHtml(t('points.delete'))}">✕</button>
    </div>
  `).join('');
  container.onclick = (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-point-id]');
    const id = btn?.dataset['pointId'];
    if (id) removePointById(id);
  };
}

export function removePointById(id: string): void {
  void import('./points').then((m) => {
    const i = m.points.findIndex((p) => pointId(p) === id);
    if (i < 0) return;
    m.removePoint(m.points[i]);
  });
}
