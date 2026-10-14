import { $, LS_KEY } from './core.js';

// Відвідані клітинки + маршрут + черга синхронізації в хмару.
export const visited = new Set(loadCells());
export const route = { latlngs: [], last: null };
export const pendingSync = new Set();
let persistTimer = null;

function loadCells() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

// Тротлований запис: не на кожну точку, а раз на 5с / при виході.
export function persistLocal(immediate = false) {
  $('statCells').textContent = visited.size;
  if (!immediate) {
    clearTimeout(persistTimer);
    persistTimer = setTimeout(() => persistLocal(true), 5000);
    return;
  }
  try { localStorage.setItem(LS_KEY, JSON.stringify([...visited].slice(-50000))); } catch {}
}

export function resetProgress() {
  visited.clear();
  pendingSync.clear();
  route.latlngs = [];
  route.last = null;
  try { localStorage.removeItem(LS_KEY); } catch {}
  persistLocal(true);
}

window.addEventListener('pagehide', () => persistLocal(true));
