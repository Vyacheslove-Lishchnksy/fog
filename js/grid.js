import { $, CELL_METERS, REVEAL_RADIUS } from './core.js';
import { visited, pendingSync, persistLocal, route } from './store.js';
import { bumpStats } from './stats.js';
import { map, lockToHome, pushRoute, showMe } from './world.js';
import { drawFog } from './fog.js';
import { queueSync } from './cloud.js';

// Клітинки навколо точки в радіусі radiusM.
export function cellsAround(latlng, radiusM) {
  const c = L.CRS.EPSG3857.project(latlng);
  const steps = Math.ceil(radiusM / CELL_METERS);
  const cx0 = Math.floor(c.x / CELL_METERS), cy0 = Math.floor(c.y / CELL_METERS);
  const out = [];
  for (let dx = -steps; dx <= steps; dx++) {
    for (let dy = -steps; dy <= steps; dy++) {
      const px = (cx0 + dx) * CELL_METERS + CELL_METERS / 2;
      const py = (cy0 + dy) * CELL_METERS + CELL_METERS / 2;
      if (Math.hypot(px - c.x, py - c.y) <= radiusM) out.push((cx0 + dx) + ':' + (cy0 + dy));
    }
  }
  return out;
}

// doLock=true тільки для реального GPS: debug-ходьба замок не ставить.
export function revealAt(latlng, moveMap = false, doLock = false) {
  const cells = cellsAround(latlng, REVEAL_RADIUS);
  let added = 0;
  for (let i = 0; i < cells.length; i++) {
    if (!visited.has(cells[i])) { visited.add(cells[i]); pendingSync.add(cells[i]); added++; }
  }
  const prev = route.last;
  pushRoute(latlng);
  bumpStats(added, prev ? map.distance(prev, latlng) : 0);
  if (added > 0) {
    persistLocal();
    drawFog();
    queueSync();
  } else {
    $('statCells').textContent = visited.size;
  }
  showMe(latlng);
  if (doLock) lockToHome(latlng, moveMap);
  if (moveMap) map.setView(latlng, Math.max(map.getZoom(), 16));
}
