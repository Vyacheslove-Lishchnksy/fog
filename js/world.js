import { route, loadRoute } from './store.js';

// Карта: вантажимо тільки місто, не весь світ.
export const map = L.map('map', {
  zoomControl: false,
  minZoom: 11,
  maxZoom: 18,
  maxBoundsViscosity: 0.9,
  worldCopyJump: false,
}).setView([50.4501, 30.5234], 13);
L.control.zoom({ position: 'topright' }).addTo(map);

export const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18,
  minZoom: 11,
  keepBuffer: 2,        // менше тайлів у пам'яті
  updateWhenIdle: true, // вантажити тільки коли зупинився
  updateInterval: 200,
  attribution: '&copy; OpenStreetMap'
}).addTo(map);

// Замок на район міста (~±25км): тайли поза боксом не запитуються.
// Перезамкується, якщо ти далеко (>20км) — нове місто.
let homeCenter = null;
export function lockToHome(ll, force = false) {
  if (!homeCenter || force || map.distance(homeCenter, ll) > 20000) {
    homeCenter = ll;
    const box = L.latLngBounds([ll.lat - 0.22, ll.lng - 0.32], [ll.lat + 0.22, ll.lng + 0.32]);
    map.setMaxBounds(box);
    tiles.options.bounds = box.pad(0.5);
    tiles.redraw();
  }
}

export const routeLine = L.polyline([], { color: '#3b82f6', weight: 4, opacity: 0.9 }).addTo(map);
let meMarker = null, accCircle = null;

// Відновлюємо вчорашній маршрут з localStorage.
for (const [la, ln] of loadRoute()) route.latlngs.push(L.latLng(la, ln));
if (route.latlngs.length) {
  route.last = route.latlngs[route.latlngs.length - 1];
  routeLine.setLatLngs(route.latlngs);
}

export function showMe(latlng) {
  if (!meMarker) {
    meMarker = L.circleMarker(latlng, { radius: 8, color: '#fff', fillColor: '#2563eb', fillOpacity: 1, weight: 3 }).addTo(map);
  } else meMarker.setLatLng(latlng);
}

export function showAccuracy(latlng, meters) {
  if (accCircle) accCircle.setLatLng(latlng).setRadius(meters);
  else accCircle = L.circle(latlng, { radius: meters, color: '#2563eb', opacity: 0.25, fillOpacity: 0.12 }).addTo(map);
}

// Маршрут: тільки при зсуві >5м, максимум 1000 точок.
// Повертає true якщо точку записано (для чесного підрахунку дистанції).
export function pushRoute(latlng) {
  if (route.last && map.distance(route.last, latlng) <= 5) return false;
  route.last = latlng;
  routeLine.addLatLng(latlng);
  route.latlngs.push(latlng);
  if (route.latlngs.length > 1000) {
    route.latlngs.shift();
    routeLine.setLatLngs(route.latlngs);
  }
  return true;
}

export function clearRoute() {
  route.latlngs = [];
  route.last = null;
  routeLine.setLatLngs([]);
}
