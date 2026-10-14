import { $, toast } from './core.js';
import { visited } from './store.js';

const STATS_KEY = 'fow_stats_v1';
const ACH_KEY = 'fow_ach_v1';
const CELL_M2 = 70 * 70;

// Досягнення: test отримує знімок статистики.
const ACH = [
  { id: 'step1', icon: '👣', name: 'Перший крок', desc: 'Відкрий першу клітинку', test: (s) => s.cells >= 1 },
  { id: 'c100', icon: '💯', name: 'Сотня', desc: '100 клітинок', test: (s) => s.cells >= 100 },
  { id: 'c1000', icon: '🏙️', name: 'Тисяча', desc: '1000 клітинок', test: (s) => s.cells >= 1000 },
  { id: 'km1', icon: '🚶', name: 'Кілометр', desc: 'Пройди 1 км', test: (s) => s.totalKm >= 1 },
  { id: 'km10', icon: '🥾', name: 'Десятка', desc: 'Пройди 10 км', test: (s) => s.totalKm >= 10 },
  { id: 'area1', icon: '🗺️', name: 'Квадратний кілометр', desc: 'Відкрий 1 км²', test: (s) => s.areaKm2 >= 1 },
  { id: 'streak3', icon: '🔥', name: 'Три дні поспіль', desc: 'Гуляй 3 дні підряд', test: (s) => s.streak >= 3 },
  { id: 'streak7', icon: '🌋', name: 'Тиждень без зупинки', desc: 'Гуляй 7 днів підряд', test: (s) => s.streak >= 7 },
  { id: 'days10', icon: '📅', name: 'Регулярний', desc: '10 активних днів', test: (s) => s.days >= 10 },
  { id: 'night', icon: '🦉', name: 'Нічний ходок', desc: 'Відкривай після 22:00', test: (s) => s.night },
  { id: 'early', icon: '🐦', name: 'Ранкова пташка', desc: 'Відкривай о 5–7 ранку', test: (s) => s.early },
];

let stats = loadStats();
let unlocked = loadAch();
let statsTimer = null;

function loadStats() {
  try { const s = JSON.parse(localStorage.getItem(STATS_KEY)); if (s && s.perDay) return s; } catch {}
  return { totalDistM: 0, perDay: {}, lastActive: '', streak: 0, night: false, early: false };
}
function loadAch() {
  try { return new Set(JSON.parse(localStorage.getItem(ACH_KEY)) || []); } catch { return new Set(); }
}
function saveStats() {
  try { localStorage.setItem(STATS_KEY, JSON.stringify(stats)); } catch {}
}
function saveAch() {
  try { localStorage.setItem(ACH_KEY, JSON.stringify([...unlocked])); } catch {}
}
function queueSaveStats() {
  clearTimeout(statsTimer);
  statsTimer = setTimeout(saveStats, 5000);
}
const dayKey = (d = new Date()) => d.toISOString().slice(0, 10);

// Викликається з revealAt на кожну точку (added може бути 0).
export function bumpStats(added, distM) {
  const today = dayKey();
  if (distM > 0) stats.totalDistM += distM;
  if (added > 0) {
    stats.perDay[today] = (stats.perDay[today] || 0) + added;
    const y = dayKey(new Date(Date.now() - 864e5));
    if (!stats.lastActive) stats.streak = 1;
    else if (stats.lastActive !== today) stats.streak = (stats.lastActive === y) ? stats.streak + 1 : 1;
    stats.lastActive = today;
    const h = new Date().getHours();
    if (h >= 22 || h < 5) stats.night = true;
    if (h >= 5 && h < 7) stats.early = true;
    const cutoff = dayKey(new Date(Date.now() - 90 * 864e5));
    for (const k of Object.keys(stats.perDay)) if (k < cutoff) delete stats.perDay[k];
  }
  queueSaveStats();
  checkAch(false);
}

export function getStats() {
  const days = Object.keys(stats.perDay);
  const best = days.reduce((m, d) => (stats.perDay[d] > (stats.perDay[m] || 0) ? d : m), days[0] || '');
  return {
    cells: visited.size,
    areaKm2: (visited.size * CELL_M2) / 1e6,
    totalKm: stats.totalDistM / 1000,
    streak: stats.streak,
    days: days.length,
    today: stats.perDay[dayKey()] || 0,
    best: best ? { date: best, n: stats.perDay[best] } : null,
    night: stats.night,
    early: stats.early,
  };
}

export function checkAch(silent) {
  const s = getStats();
  let changed = false;
  for (const a of ACH) {
    if (!unlocked.has(a.id) && a.test(s)) {
      unlocked.add(a.id);
      changed = true;
      if (!silent) toast(`🏆 ${a.icon} ${a.name}!`);
    }
  }
  if (changed) saveAch();
  return changed;
}

export function achList() {
  const s = getStats();
  return ACH.map((a) => ({ ...a, done: unlocked.has(a.id) }));
}
