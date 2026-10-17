import * as L from 'leaflet';
import { $, toast } from './core';
import { visited, resetProgress } from './store';
import { map, clearRoute } from './world';
import { drawFog } from './fog';
import { setGrainAlpha } from './grain';
import { revealAt } from './grid';

// Віртуальна ходьба без GPS (тільки dev).
let dbgPos: L.LatLng | null = null;
let dbgMarker: L.CircleMarker | null = null;
let dbgTeleport = false;

function paintPos(): void {
  if (!dbgPos) return;
  $('dbgPos').textContent = dbgPos.lat.toFixed(5) + ', ' + dbgPos.lng.toFixed(5) + ' · ' + visited.size + ' кл.';
}

function dbgShow(): void {
  if (!dbgPos) dbgPos = map.getCenter();
  if (!dbgMarker) {
    dbgMarker = L.circleMarker(dbgPos, { radius: 9, color: '#fbbf24', fillColor: '#f59e0b', fillOpacity: 1, weight: 3 }).addTo(map);
  }
  paintPos();
}

function dbgWalkTo(ll: L.LatLng, moveMap: boolean): void {
  dbgPos = ll;
  if (dbgMarker) dbgMarker.setLatLng(ll);
  else dbgMarker = L.circleMarker(ll, { radius: 9, color: '#fbbf24', fillColor: '#f59e0b', fillOpacity: 1, weight: 3 }).addTo(map);
  revealAt(ll, moveMap, false);
  if (($('dbgFollow') as HTMLInputElement).checked && !moveMap) map.panTo(ll);
  paintPos();
}

function dbgStep(dxM: number, dyM: number): void {
  if (!dbgPos) dbgShow();
  const step = parseInt(($('dbgStep') as HTMLSelectElement).value, 10) || 70;
  const lat = (dbgPos as L.LatLng).lat + (dyM * step) / 111320;
  const lng = (dbgPos as L.LatLng).lng + (dxM * step) / (111320 * Math.cos((dbgPos as L.LatLng).lat * Math.PI / 180));
  dbgWalkTo(L.latLng(lat, lng), false);
}

export function initDebug(): void {
  const panel = $('leftPanel');
  $('btnDbgStart').onclick = () => { dbgWalkTo(map.getCenter(), true); toast('Ходок на центрі — ходи стрілками'); };
  $('btnDbgTeleport').onclick = (e) => {
    dbgTeleport = !dbgTeleport;
    const b = e.currentTarget as HTMLElement;
    b.textContent = '👆 Клік=телепорт: ' + (dbgTeleport ? 'увімк' : 'вимк');
    b.classList.toggle('on', dbgTeleport);
  };
  $('btnDbgReset').onclick = () => {
    resetProgress();
    clearRoute();
    drawFog();
    dbgShow();
    toast('Туман скинуто');
  };
  $('dbgGrain').oninput = (e) => { setGrainAlpha(Number((e.currentTarget as HTMLInputElement).value) / 100); drawFog(); };
  panel.querySelectorAll<HTMLButtonElement>('.dpad button').forEach((b) => {
    b.onclick = () => { const [dx, dy] = (b.dataset['step'] || '0,0').split(',').map(Number); dbgStep(dx as number, dy as number); };
  });
  map.on('click', (e: L.LeafletMouseEvent) => { if (dbgTeleport && !panel.classList.contains('hidden')) dbgWalkTo(e.latlng, false); });
  document.addEventListener('keydown', (e) => {
    if (panel.classList.contains('hidden')) return;
    if (/INPUT|SELECT|TEXTAREA/.test((e.target as HTMLElement).tagName)) return;
    const k = e.key.toLowerCase();
    if (e.key === 'ArrowUp' || k === 'w' || k === 'ц') { e.preventDefault(); dbgStep(0, 1); }
    else if (e.key === 'ArrowDown' || k === 's' || k === 'і') { e.preventDefault(); dbgStep(0, -1); }
    else if (e.key === 'ArrowLeft' || k === 'a' || k === 'ф') { e.preventDefault(); dbgStep(-1, 0); }
    else if (e.key === 'ArrowRight' || k === 'd' || k === 'в') { e.preventDefault(); dbgStep(1, 0); }
  });
}
