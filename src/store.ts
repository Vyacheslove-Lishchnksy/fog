import { $, LS_KEY } from './core';
import type { LatLng } from 'leaflet';

// Відвідані клітинки + маршрут + черга синхронізації в хмару.
export const visited: Set<string> = new Set(loadCells());
export const route: { latlngs: LatLng[]; last: LatLng | null } = { latlngs: [], last: null };
export const pendingSync: Set<string> = new Set();
let persistTimer = 0;
const ROUTE_KEY = 'fow_route_v1';

function loadCells(): string[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw) as string[];
  } catch { /* чистий старт */ }
  return [];
}

// Тротлований запис: не на кожну точку, а раз на 5с / при виході.
export function persistLocal(immediate = false): void {
  $('statCells').textContent = String(visited.size);
  if (!immediate) {
    clearTimeout(persistTimer);
    persistTimer = window.setTimeout(() => persistLocal(true), 5000);
    return;
  }
  try { localStorage.setItem(LS_KEY, JSON.stringify([...visited].slice(-50000))); } catch { /* quota */ }
  saveRoute();
}

// Маршрут теж переживає перезавантаження (max 1000 точок, ~1м точність).
export function saveRoute(): void {
  try {
    const pts = route.latlngs.map((p) => [+p.lat.toFixed(5), +p.lng.toFixed(5)]);
    localStorage.setItem(ROUTE_KEY, JSON.stringify(pts.slice(-1000)));
  } catch { /* quota */ }
}
export function loadRoute(): Array<[number, number]> {
  try { return (JSON.parse(localStorage.getItem(ROUTE_KEY) || '[]') as Array<[number, number]>) || []; }
  catch { return []; }
}

export function resetProgress(): void {
  visited.clear();
  pendingSync.clear();
  route.latlngs = [];
  route.last = null;
  try { localStorage.removeItem(LS_KEY); } catch { /* noop */ }
  persistLocal(true);
}

window.addEventListener('pagehide', () => persistLocal(true));
