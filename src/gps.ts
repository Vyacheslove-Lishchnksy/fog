import * as L from 'leaflet';
import { $, toast } from './core';
import { persistLocal } from './store';
import { revealAt } from './grid';
import { map, showAccuracy, clearRoute } from './world';

let watchId = 0, tracking = false;
let wakeLock: { release(): Promise<void> } | null = null;

// Фільтр сміттєвих фіксів: точність ≤150м, швидкість ≤55м/с, свіжість ≤30с.
const MAX_ACC = 150, MAX_SPEED = 55, MAX_AGE = 30000;
let lastFix: { ll: L.LatLng; t: number } | null = null;
function goodFix(pos: GeolocationPosition): boolean {
  if (!pos.coords || Date.now() - pos.timestamp > MAX_AGE || (pos.coords.accuracy || 0) > MAX_ACC) return false;
  if (!lastFix) return true;
  const ll = L.latLng(pos.coords.latitude, pos.coords.longitude);
  return map.distance(lastFix.ll, ll) / Math.max(1, (pos.timestamp - lastFix.t) / 1000) <= MAX_SPEED;
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
  if (!goodFix(pos)) return;
  const ll = L.latLng(pos.coords.latitude, pos.coords.longitude);
  lastFix = { ll, t: pos.timestamp };
  showAccuracy(ll, pos.coords.accuracy || 30);
  revealAt(ll, false, true);
  void detectCity(ll);
}

function onPosErr(err: GeolocationPositionError): void { toast('GPS недоступний: ' + err.message); }

export function locateOnce(): void {
  if (!('geolocation' in navigator)) return toast('Браузер без GPS');
  const btn = $('btnLocate');
  btn.textContent = '⏳ Пошук…';
  const done = (): void => { btn.textContent = '📍 Де я?'; };
  navigator.geolocation.getCurrentPosition(
    (p) => {
      const ll = L.latLng(p.coords.latitude, p.coords.longitude);
      revealAt(ll, true, true);
      void detectCity(ll);
      done();
      toast('Позицію знайдено');
    },
    (e) => {
      done();
      if (e.code === e.TIMEOUT) toast('GPS мовчить 12с. На ПК без GPS це нормально — відкрий з телефона');
      else onPosErr(e);
    },
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
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
