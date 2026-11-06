import { config as envConfig } from './config';
import { CELL_METERS as _CELL_METERS, REVEAL_RADIUS as _REVEAL_RADIUS, R as _R, MIN_FOG_ZOOM as _MIN_FOG_ZOOM, LS_VISITED_KEY as _LS_KEY } from '../config/system';
import { UI } from '../config/ui';

export const CELL_METERS = _CELL_METERS; // розмір клітинки туману
export const REVEAL_RADIUS = _REVEAL_RADIUS; // радіус відкриття навколо тебе, метри
export const LS_KEY = _LS_KEY; // ключ localStorage для відвіданих клітинок
export const R = _R; // радіус Землі, метри
export const MIN_FOG_ZOOM = _MIN_FOG_ZOOM; // нижче — суцільний туман
export const VER: string = __APP_VERSION__;
export const DEBUG: boolean = envConfig.debug;

export const $ = (id: string): HTMLElement => {
  const el = document.getElementById(id);
  if (!el) throw new Error('missing #' + id);
  return el;
};

let toastTimer = 0;
export function toast(msg: string): void {
  const el = $('toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => el.classList.add('hidden'), UI.toastDurationMs);
}
