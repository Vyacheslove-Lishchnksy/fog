import * as L from 'leaflet';
import { toast } from './core';
import { visited } from './store';
import { map } from './world';
import { cellOf } from './grid';
import { renderPointsList } from './point-list';
import { askPointName } from './point-modal';
import { t } from './i18n';

const POINTS_KEY = 'fow_points_v1';
export type Point = { lat: number; lng: number; label?: string };
export const points: Point[] = [];
const markers: L.Marker[] = [];
let pointMode = false;
let pointLayer: L.LayerGroup | null = null;

function pointId(p: Point): string { return p.lat.toFixed(5) + ':' + p.lng.toFixed(5); }
function loadPoints(): void { try { const r = localStorage.getItem(POINTS_KEY); if (r) for (const p of JSON.parse(r) as Point[]) points.push(p); } catch { } }
function savePoints(): void { try { localStorage.setItem(POINTS_KEY, JSON.stringify(points)); } catch { } }
function makeMarker(p: Point): L.Marker {
  const m = L.marker([p.lat, p.lng], { title: `${p.label ? p.label + ' — ' : ''}${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}`, alt: t('points.marker.alt') });
  if (p.label) m.bindTooltip(p.label, { permanent: true, direction: 'top', offset: [0, -10], className: 'point-tooltip' }).openTooltip();
  m.on('click', () => removePoint(p)); return m;
}
// Знімаємо маркер разом із підписом: unbindTooltip закриває tooltip.
// Не використовувати m.off() — він знімає і внутрішній обробник Leaflet,
// через який tooltip закривається при видаленні шару.
function detachMarker(m: L.Marker): void {
  m.unbindTooltip();
  m.off();
  if (pointLayer) pointLayer.removeLayer(m); else map.removeLayer(m);
}
function redrawLayer(): void { if (!pointLayer) return; pointLayer.clearLayers(); for (const m of markers) pointLayer.addLayer(m); }
function isRevealed(latlng: L.LatLng): boolean { return visited.has(cellOf(latlng)); }

export async function addPoint(latlng: L.LatLng): Promise<void> {
  const p: Point = { lat: +latlng.lat.toFixed(5), lng: +latlng.lng.toFixed(5) };
  if (points.some((q) => pointId(q) === pointId(p))) { toast(t('points.exists')); return; }
  const cell = cellOf(latlng);
  if (!isRevealed(latlng)) { toast(t('points.fog')); return; }
  const label = await askPointName();
  if (label === null) return;
  p.label = label || undefined;
  points.push(p); markers.push(makeMarker(p));
  savePoints(); redrawLayer(); renderPointsList(points);
  toast(t('points.added') + ' (' + cell + ')');
}

export function removePoint(p: Point): void {
  const i = points.findIndex((q) => pointId(q) === pointId(p));
  if (i < 0) return;
  points.splice(i, 1); const m = markers.splice(i, 1)[0];
  detachMarker(m);
  savePoints(); renderPointsList(points);
  toast(t('points.removed'));
}

export function clearPoints(): void {
  for (const m of markers) detachMarker(m);
  markers.length = 0; points.length = 0; if (pointLayer) pointLayer.clearLayers();
  localStorage.removeItem(POINTS_KEY); renderPointsList(points);
  toast(t('points.removed.all'));
}

export function togglePointMode(): boolean {
  pointMode = !pointMode;
  const cb = document.getElementById('btnPointToggle') as HTMLInputElement | null;
  if (cb) cb.checked = pointMode;
  toast(t(pointMode ? 'hint.point.click' : 'hint.point.off'));
  return pointMode;
}

export function initPoints(): void {
  loadPoints();
  for (const p of points) markers.push(makeMarker(p));
  pointLayer = L.layerGroup(markers).addTo(map);
  renderPointsList(points);
  map.on('click', async (e: L.LeafletMouseEvent) => { if (pointMode) await addPoint(e.latlng); });
}
