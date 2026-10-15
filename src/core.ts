export const CELL_METERS = 70; // розмір клітинки туману
export const REVEAL_RADIUS = 120; // радіус відкриття навколо тебе, метри
export const LS_KEY = 'fow_cells_v1';
export const R = 6378137;
export const MIN_FOG_ZOOM = 13; // нижче — суцільний туман
export const VER: string = __APP_VERSION__;
// DEBUG=true: локалка і dev. На prod — тільки через VITE_APP_DEBUG=true.
const flag = import.meta.env.VITE_APP_DEBUG as string | undefined;
export const DEBUG: boolean = flag !== undefined ? flag === 'true' : import.meta.env.DEV;

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
  toastTimer = window.setTimeout(() => el.classList.add('hidden'), 2600);
}
