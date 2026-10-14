import { $, toast } from './core.js';
import { persistLocal } from './store.js';
import { revealAt } from './grid.js';
import { map, showAccuracy } from './world.js';

let watchId = null, tracking = false;

function onPos(pos) {
  const ll = L.latLng(pos.coords.latitude, pos.coords.longitude);
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
    $('btnTrack').textContent = '▶ Трекінг';
    persistLocal(true);
    toast('Трекінг зупинено');
    return;
  }
  if (!('geolocation' in navigator)) return toast('Браузер без GPS');
  watchId = navigator.geolocation.watchPosition(onPos, onPosErr,
    { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 });
  tracking = true;
  $('btnTrack').textContent = '⏸ Стоп';
  toast('Трекінг увімкнено — іди, туман відкриється');
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
