import * as L from 'leaflet';
import { route, loadRoute, loadLastPos } from './store';
import { UI } from '../config/ui';
import { system } from '../config/index';

// Карта: стартуємо з останньої позиції (або Київ за замовчуванням).
const startPos = loadLastPos();
export const map = L.map('map', {
  zoomControl: false,
  minZoom: UI.minZoom,
  maxZoom: UI.maxZoom,
  maxBoundsViscosity: UI.worldBoundsViscosity,
  worldCopyJump: false,
}).setView(startPos || UI.defaultCenter, startPos ? 16 : UI.defaultZoom);
L.control.zoom({ position: 'topright' }).addTo(map);

export const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: UI.tileMaxZoom,
  minZoom: UI.tileMinZoom,
  keepBuffer: UI.tileKeepBuffer,
  updateWhenIdle: true,
  updateInterval: UI.tileUpdateInterval,
  attribution: '&copy; OpenStreetMap',
}).addTo(map);

// Замок на район міста (~±25км): тайли поза боксом не запитуються.
let homeCenter: L.LatLng | null = null;
export function lockToHome(ll: L.LatLng, force = false): void {
  if (!homeCenter || force || map.distance(homeCenter, ll) > UI.relockDistanceMeters) {
    homeCenter = ll;
    const box = L.latLngBounds([ll.lat - UI.homeBoxLat, ll.lng - UI.homeBoxLng], [ll.lat + UI.homeBoxLat, ll.lng + UI.homeBoxLng]);
    map.setMaxBounds(box);
    tiles.options.bounds = box.pad(0.5);
    tiles.redraw();
  }
}

export const routeLine = L.polyline([], { color: '#3b82f6', weight: 4, opacity: 0.9 }).addTo(map);
let meMarker: L.CircleMarker | null = null;
let accCircle: L.Circle | null = null;

// Відновлюємо вчорашній маршрут з localStorage.
for (const [la, ln] of loadRoute()) route.latlngs.push(L.latLng(la, ln));
if (route.latlngs.length) {
  route.last = route.latlngs[route.latlngs.length - 1];
  routeLine.setLatLngs(route.latlngs);
}

export function showMe(latlng: L.LatLng): void {
  if (!meMarker) {
    meMarker = L.circleMarker(latlng, { radius: 8, color: '#fff', fillColor: '#2563eb', fillOpacity: 1, weight: 3 }).addTo(map);
  } else meMarker.setLatLng(latlng);
}

export function showAccuracy(latlng: L.LatLng, meters: number): void {
  if (accCircle) accCircle.setLatLng(latlng).setRadius(meters);
  else accCircle = L.circle(latlng, { radius: meters, color: '#2563eb', opacity: 0.25, fillOpacity: 0.12 }).addTo(map);
}

// Маршрут: тільки при зсубі >5м, максимум 1000 точок.
export function pushRoute(latlng: L.LatLng): boolean {
  if (route.last && map.distance(route.last, latlng) <= UI.routeMinDistanceMeters) return false;
  route.last = latlng;
  routeLine.addLatLng(latlng);
  route.latlngs.push(latlng);
  if (route.latlngs.length > system.MAX_ROUTE_STORED) {
    route.latlngs.shift();
    routeLine.setLatLngs(route.latlngs);
  }
  return true;
}

export function clearRoute(): void {
  route.latlngs = [];
  route.last = null;
  routeLine.setLatLngs([]);
}
