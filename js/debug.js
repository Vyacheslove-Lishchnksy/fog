import { $, toast } from './core.js';
import { visited, persistLocal, resetProgress } from './store.js';
import { map, clearRoute } from './world.js';
import { drawFog } from './fog.js';
import { setGrainAlpha } from './grain.js';
import { revealAt } from './grid.js';

// Віртуальна ходьба без GPS (тільки dev).
let dbgPos = null, dbgMarker = null, dbgTeleport = false;

function dbgShow() {
  if (!dbgPos) dbgPos = map.getCenter();
  if (!dbgMarker) {
    dbgMarker = L.circleMarker(dbgPos, { radius: 9, color: '#fbbf24', fillColor: '#f59e0b', fillOpacity: 1, weight: 3 }).addTo(map);
  }
  paintPos();
}

function paintPos() {
  $('dbgPos').textContent = dbgPos.lat.toFixed(5) + ', ' + dbgPos.lng.toFixed(5) + ' · ' + visited.size + ' кл.';
}

function dbgWalkTo(ll, moveMap) {
  dbgPos = ll;
  if (dbgMarker) dbgMarker.setLatLng(ll);
  else dbgMarker = L.circleMarker(ll, { radius: 9, color: '#fbbf24', fillColor: '#f59e0b', fillOpacity: 1, weight: 3 }).addTo(map);
  revealAt(ll, !!moveMap, false);
  if ($('dbgFollow').checked && !moveMap) map.panTo(ll);
  paintPos();
}

function dbgStep(dxM, dyM) {
  if (!dbgPos) dbgShow();
  const step = parseInt($('dbgStep').value, 10) || 70;
  const lat = dbgPos.lat + (dyM * step) / 111320;
  const lng = dbgPos.lng + (dxM * step) / (111320 * Math.cos(dbgPos.lat * Math.PI / 180));
  dbgWalkTo(L.latLng(lat, lng), false);
}

export function initDebug() {
  const panel = $('debugPanel');
  $('btnDebug').onclick = () => { panel.classList.toggle('hidden'); if (!panel.classList.contains('hidden')) dbgShow(); };
  $('btnDbgClose').onclick = () => panel.classList.add('hidden');
  $('btnDbgStart').onclick = () => { dbgWalkTo(map.getCenter(), true); toast('Ходок на центрі — ходи стрілками'); };
  $('dbgGrain').oninput = (e) => { setGrainAlpha(e.target.value / 100); drawFog(); };
  $('btnDbgTeleport').onclick = (e) => {
    dbgTeleport = !dbgTeleport;
    e.currentTarget.textContent = '👆 Клік=телепорт: ' + (dbgTeleport ? 'увімк' : 'вимк');
    e.currentTarget.classList.toggle('on', dbgTeleport);
  };
  $('btnDbgReset').onclick = () => {
    resetProgress();
    clearRoute();
    drawFog();
    dbgShow();
    toast('Туман скинуто');
  };
  panel.querySelectorAll('.dpad button').forEach((b) => {
    b.onclick = () => { const [dx, dy] = b.dataset.step.split(',').map(Number); dbgStep(dx, dy); };
  });
  map.on('click', (e) => { if (dbgTeleport && !panel.classList.contains('hidden')) dbgWalkTo(e.latlng, false); });
  document.addEventListener('keydown', (e) => {
    if (panel.classList.contains('hidden')) return;
    if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
    const k = e.key.toLowerCase();
    if (e.key === 'ArrowUp' || k === 'w' || k === 'ц') { e.preventDefault(); dbgStep(0, 1); }
    else if (e.key === 'ArrowDown' || k === 's' || k === 'і') { e.preventDefault(); dbgStep(0, -1); }
    else if (e.key === 'ArrowLeft' || k === 'a' || k === 'ф') { e.preventDefault(); dbgStep(-1, 0); }
    else if (e.key === 'ArrowRight' || k === 'd' || k === 'в') { e.preventDefault(); dbgStep(1, 0); }
  });
}
