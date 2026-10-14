export const CELL_METERS = 70;   // розмір клітинки туману
export const REVEAL_RADIUS = 120; // радіус відкриття навколо тебе, метри
export const LS_KEY = 'fow_cells_v1';
export const R = 6378137;
export const MIN_FOG_ZOOM = 13; // нижче — суцільний туман
// DEBUG=true: локалка і dev. На prod (APP_DEBUG=false) debug ховається.
export const DEBUG = (window.FOW_CONFIG || {}).DEBUG !== false;

export const $ = (id) => document.getElementById(id);
export function toast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.add('hidden'), 2600);
}
