import { $, toast } from './core.js';
import { persistLocal } from './store.js';
import { revealAt } from './grid.js';
import { map, showAccuracy } from './world.js';

let watchId = null, tracking = false;
let wakeLock = null;

// Фільтр сміттєвих фіксів (повернення з фону дає стрибки):
const MAX_ACC = 150;   // грубіше — ігнор (малює не ті клітинки)
const MAX_SPEED = 55;  // м/с — швидше не їде навіть авто
const MAX_AGE = 30000; // фікс старіший 30с — протухлий
let lastFix = null;
function goodFix(pos) {
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

// Wake Lock: екран не гасне під час трекінгу, інакше телефон
// зупиняє GPS у фоні (обмеження мобільних браузерів, не баг).
async function holdScreen() {
  try {
    if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen');
  } catch {}
}
function freeScreen() {
  try { wakeLock && wakeLock.release(); } catch {}
  wakeLock = null;
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && tracking) holdScreen();
});

function onPos(pos) {
  if (!goodFix(pos)) return; // стрибок після фону — мовчки пропускаємо
  const ll = L.latLng(pos.coords.latitude, pos.coords.longitude);
  lastFix = { ll, t: pos.timestamp };
  showAccuracy(ll, pos.coords.accuracy || 30);
  revealAt(ll, false, true);
  detectCity(ll);
}

function onPosErr(err) { toast('GPS недоступний: ' + err.message); }

export function locateOnce() {
  if (!('geolocation' in navigator)) return toast('Браузер без GPS');
  navigator.geolocation.getCurrentPosition(
    (p) => {
      const ll = L.latLng(p.coords.latitude, p.coords.longitude);
      revealAt(ll, true, true);
      detectCity(ll);
      toast('Позицію знайдено');
    },
    onPosErr, { enableHighAccuracy: true, timeout: 12000 }
  );
}

export function toggleTrack() {
  if (tracking) {
    navigator.geolocation.clearWatch(watchId);
    tracking = false;
    freeScreen();
    $('btnTrack').textContent = '▶ Трекінг';
    persistLocal(true);
    toast('Трекінг зупинено');
    return;
  }
  if (!('geolocation' in navigator)) return toast('Браузер без GPS');
  watchId = navigator.geolocation.watchPosition(onPos, onPosErr,
    { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 });
  tracking = true;
  holdScreen();
  $('btnTrack').textContent = '⏸ Стоп';
  toast('Трекінг увімкнено — іди, туман відкриється (екран не гасне)');
}

// Місто автоматично по першому GPS-фіксу.
let cityDone = false;
async function detectCity(ll) {
  if (cityDone) return;
  cityDone = true;
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${ll.lat}&lon=${ll.lng}&format=json`)
      .then((x) => x.json());
    const a = r.address || {};
    const city = a.city || a.town || a.village || a.municipality || a.county || r.display_name?.split(',')[0] || '';
    if (city) $('cityName').textContent = '— ' + city;
  } catch {}
}
