import * as L from 'leaflet';
import { toast } from './core';
import { visited } from './store';
import { map } from './world';
import { cellOf } from './grid';

const POINTS_KEY = 'fow_points_v1';
export interface Point { lat: number; lng: number; label?: string }

export const points: Point[] = [];
const markers: L.Marker[] = [];
let pointMode = false;
let pointLayer: L.LayerGroup | null = null;

let nameModal: HTMLElement | null = null;
let nameInput: HTMLInputElement | null = null;
let nameResolve: ((value: string | null) => void) | null = null;

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

function pointId(p: Point): string { return p.lat.toFixed(5) + ':' + p.lng.toFixed(5); }

function loadPoints(): void {
  try {
    const raw = localStorage.getItem(POINTS_KEY);
    if (raw) {
      const arr = JSON.parse(raw) as Point[];
      const byId = new Map<string, Point>();
      let changed = false;
      for (const p of arr) {
        const id = pointId(p);
        const existing = byId.get(id);
        if (!existing) {
          byId.set(id, p);
          points.push(p);
        } else {
          changed = true;
          if (!existing.label && p.label) existing.label = p.label;
        }
      }
      if (changed) savePoints();
    }
  } catch { /* чистий старт */ }
}

function savePoints(): void {
  try { localStorage.setItem(POINTS_KEY, JSON.stringify(points)); } catch { /* quota */ }
}

// Створює маркер. Якщо є назва — показує постійний tooltip зверху.
function makeMarker(p: Point): L.Marker {
  const m = L.marker([p.lat, p.lng], {
    title: `${p.label ? p.label + ' — ' : ''}${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}`,
    alt: 'Власная точка',
  });
  if (p.label) {
    m.bindTooltip(p.label, {
      permanent: true,
      direction: 'top',
      offset: [0, -10],
      className: 'point-tooltip',
    }).openTooltip();
  }
  m.on('click', () => removePoint(p));
  return m;
}

function redrawLayer(): void {
  if (!pointLayer) return;
  pointLayer.clearLayers();
  for (const m of markers) pointLayer.addLayer(m);
}

// Можна ставити точку тільки там, де туман вже відкрито (клітинка у visited).
function isRevealed(latlng: L.LatLng): boolean { return visited.has(cellOf(latlng)); }

function ensureNameModal(): void {
  if (nameModal) return;
  nameModal = document.createElement('div');
  nameModal.id = 'pointNameModal';
  nameModal.className = 'modal';
  nameModal.innerHTML = `
    <div class="modal-card">
      <div class="dbg-head"><b>📌 Нова точка</b><button id="btnPointNameClose" class="btn small ghost">✕</button></div>
      <p class="muted">Назва точки (можна залишити порожнім):</p>
      <input id="pointNameInput" type="text" placeholder="наприклад: Дім, Парк, Робота" />
      <div class="row">
        <button id="btnPointNameOk" class="btn primary">ОК</button>
        <button id="btnPointNameCancel" class="btn ghost">Скасувати</button>
      </div>
    </div>`;
  document.body.appendChild(nameModal);
  nameInput = nameModal.querySelector('#pointNameInput') as HTMLInputElement;
  nameModal.querySelector('#btnPointNameClose')?.addEventListener('click', () => closeNameModal(null));
  nameModal.querySelector('#btnPointNameCancel')?.addEventListener('click', () => closeNameModal(null));
  nameModal.querySelector('#btnPointNameOk')?.addEventListener('click', () => closeNameModal(nameInput?.value ?? null));
  nameInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); closeNameModal(nameInput?.value ?? null); }
    if (e.key === 'Escape') { closeNameModal(null); }
  });
  nameModal.addEventListener('click', (e) => { if (e.target === nameModal) closeNameModal(null); });
}

function closeNameModal(value: string | null): void {
  if (!nameModal) return;
  nameModal.classList.add('hidden');
  if (nameResolve) { nameResolve(value); nameResolve = null; }
}

function askPointName(): Promise<string | null> {
  ensureNameModal();
  nameModal!.classList.remove('hidden');
  nameInput!.value = '';
  nameInput!.focus();
  return new Promise((resolve) => { nameResolve = resolve; });
}

export async function addPoint(latlng: L.LatLng): Promise<void> {
  const p: Point = { lat: +latlng.lat.toFixed(5), lng: +latlng.lng.toFixed(5) };
  if (points.some((q) => pointId(q) === pointId(p))) { toast('Така точка вже є'); return; }
  const cell = cellOf(latlng);
  if (!isRevealed(latlng)) { toast(`Туман: клітинка ${cell} не відкрита`); return; }
  const label = await askPointName();
  if (label === null) return; // скасували
  p.label = label || undefined;
  points.push(p);
  const m = makeMarker(p);
  markers.push(m);
  savePoints();
  redrawLayer();
  toast('Точку додано (' + cell + ')');
}

export function removePoint(p: Point): void {
  let i = points.indexOf(p);
  if (i < 0) i = points.findIndex((q) => pointId(q) === pointId(p));
  if (i < 0) return;
  points.splice(i, 1);
  const m = markers.splice(i, 1)[0];
  if (pointLayer) pointLayer.removeLayer(m);
  else map.removeLayer(m);
  m.off();
  savePoints();
  renderPointsList();
  toast('Точку видалено');
}

export function clearPoints(): void {
  for (const m of markers) {
    if (pointLayer) pointLayer.removeLayer(m);
    else map.removeLayer(m);
    m.off();
  }
  markers.length = 0;
  points.length = 0;
  if (pointLayer) pointLayer.clearLayers();
  localStorage.removeItem(POINTS_KEY);
  renderPointsList();
  toast('Усі точки видалені');
}

export function renderPointsList(): void {
  const container = document.getElementById('pointsList');
  if (!container) return;
  if (points.length === 0) {
    container.innerHTML = '<div class="muted">Точок немає</div>';
    return;
  }
  container.innerHTML = points.map((p) => `
    <div class="point-item" style="padding:6px 8px;border-bottom:1px solid #374151;display:flex;justify-content:space-between;align-items:center;gap:8px">
      <div>
        <div style="font-weight:600">${escapeHtml(p.label || p.lat.toFixed(4) + ', ' + p.lng.toFixed(4))}</div>
        <div style="font-size:11px;opacity:.6">${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}</div>
      </div>
      <button class="btn small ghost" onclick="window.__removePointById('${pointId(p)}')">✕</button>
    </div>
  `).join('');
}

export function removePointById(id: string): void {
  const i = points.findIndex((p) => pointId(p) === id);
  if (i < 0) return;
  removePoint(points[i]);
}

export function togglePointMode(): boolean {
  pointMode = !pointMode;
  const cb = document.getElementById('btnPointToggle') as HTMLInputElement | null;
  if (cb) cb.checked = pointMode;
  toast(pointMode
    ? 'Клікніть по відкритій частині карти, щоб поставити точку (спочатку відкрийте територію через GPS або debug)'
    : 'Режим точок вимкнено');
  return pointMode;
}

export function initPoints(): void {
  loadPoints();
  for (const p of points) markers.push(makeMarker(p));
  pointLayer = L.layerGroup(markers).addTo(map);
  renderPointsList();
  map.on('click', async (e: L.LeafletMouseEvent) => {
    if (pointMode) await addPoint(e.latlng);
  });
  // Зв’язок з глобальною областю для кнопок у списку точок
  (window as any).__removePointById = removePointById;
}
