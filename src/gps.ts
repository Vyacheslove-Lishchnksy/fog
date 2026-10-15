import * as L from 'leaflet';
import { $, toast } from './core';
import { persistLocal } from './store';
import { revealAt } from './grid';
import { map, showAccuracy, clearRoute } from './world';

let watchId = 0;
let tracking = false;
let wakeLock: { release(): Promise<void> } | null = null;

// Фільтр сміттєвих фіксів (повернення з фону дає стрибки).
const MAX_ACC = 150; // грубіше — ігнор (малює не ті клітинки)
const MAX_SPEED = 55; // м/с — швидше не їде навіть авто
const MAX_AGE = 30000; // фікс старіший 30с — протухлий
let lastFix: { ll: L.LatLng; t: number } | null = null;
function goodFix(pos: GeolocationPosition): boolean {
  if (!pos.coords) return false;
  if (Date.now() - pos.timestamp > MAX_AGE) return false;
  if (pos.coords.accuracy && pos.coords.accuracy > MAX_ACC) return false;
  if (lastFix) {
    const ll = L.latLng(pos.coords.latitude, pos.coords.longitude);
    const dt = Math.max(1, (pos.timestamp - lastFix.t) / 1000);
    if (map.distance(lastFix.ll, ll) / dt > MAX_SPEED) return false;
  }
  return true;
}

// Wake Lock: екран не гасне під час трекінгу, інакше телефон зупиняє GPS у фоні.
async function holdScreen(): Promise<void> {
  try {
    const nav = navigator as Navigator & { wakeLock?: { request(t: string): Promise<{ release(): Promise<void> }> } };
    if (nav.wakeLock) wakeLock = await nav.wakeLock.request('screen');
  } catch { /* без замка трекінг все одно працює */ }
}
function freeScreen(): void {
  try { void wakeLock?.release(); } catch { /* noop */ }
  wakeLock = null;
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && tracking) void holdScreen();
});

function onPos(pos: GeolocationPosition): void {
  if (!goodFix(pos)) return; // стрибок після фону — мовчки пропускаємо
  const ll = L.latLng(pos.coords.latitude, pos.coords.longitude);
  lastFix = { ll, t: pos.timestamp };
  showAccuracy(ll, pos.coords.accuracy || 30);
  revealAt(ll, false, true);
  void detectCity(ll);
}

function onPosErr(err: GeolocationPositionError): void { toast('GPS недоступний: ' + err.message); }

export function locateOnce(): void {
  if (!('geolocation' in navigator)) return toast('Браузер без GPS');
  navigator.geolocation.getCurrentPosition(
    (p) => {
      const ll = L.latLng(p.coords.latitude, p.coords.longitude);
      revealAt(ll, true, true);
      void detectCity(ll);
      toast('Позицію знайдено');
    },
    onPosErr, { enableHighAccuracy: true, timeout: 12000 },
  );
}

export function toggleTrack(): void {
  if (tracking) {
    navigator.geolocation.clearWatch(watchId);
    tracking = false;
    freeScreen();
    clearRoute(); // кінець трекінгу — прибираємо лінію з карти
    $('btnTrack').textContent = '▶ Трекінг';
    persistLocal(true);
    toast('Трекінг зупинено');
    return;
  }
  if (!('geolocation' in navigator)) return toast('Браузер без GPS');
  watchId = navigator.geolocation.watchPosition(onPos, onPosErr,
    { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 });
  tracking = true;
  void holdScreen();
  $('btnTrack').textContent = '⏸ Стоп';
  toast('Трекінг увімкнено — іди, туман відкриється (екран не гасне)');
}

// Місто автоматично по першому GPS-фіксу.
let cityDone = false;
async function detectCity(ll: L.LatLng): Promise<void> {
  if (cityDone) return;
  cityDone = true;
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${ll.lat}&lon=${ll.lng}&format=json`);
    const r = (await res.json()) as { address?: Record<string, string>; display_name?: string };
    const a = r.address || {};
    const city = a['city'] || a['town'] || a['village'] || a['municipality'] || a['county'] || r.display_name?.split(',')[0] || '';
    if (city) $('cityName').textContent = '— ' + city;
  } catch { /* офлайн — місто лишиться за замовчуванням */ }
}
