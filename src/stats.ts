import { toast } from './core';
import { visited } from './store';

const STATS_KEY = 'fow_stats_v1';
const ACH_KEY = 'fow_ach_v1';
const CELL_M2 = 70 * 70;

export interface StatsSnapshot {
  cells: number; areaKm2: number; totalKm: number; streak: number;
  days: number; today: number; best: { date: string; n: number } | null;
  night: boolean; early: boolean;
}
interface Ach { id: string; icon: string; name: string; desc: string; test: (s: StatsSnapshot) => boolean }

// Досягнення: test отримує знімок статистики.
const ACH: Ach[] = [
  { id: 'step1', icon: '👣', name: 'ach.step1.name', desc: 'ach.step1.desc', test: (s) => s.cells >= 1 },
  { id: 'c100', icon: '💯', name: 'ach.c100.name', desc: 'ach.c100.desc', test: (s) => s.cells >= 100 },
  { id: 'c1000', icon: '🏙️', name: 'ach.c1000.name', desc: 'ach.c1000.desc', test: (s) => s.cells >= 1000 },
  { id: 'km1', icon: '🚶', name: 'ach.km1.name', desc: 'ach.km1.desc', test: (s) => s.totalKm >= 1 },
  { id: 'km10', icon: '🥾', name: 'ach.km10.name', desc: 'ach.km10.desc', test: (s) => s.totalKm >= 10 },
  { id: 'area1', icon: '🗺️', name: 'ach.area1.name', desc: 'ach.area1.desc', test: (s) => s.areaKm2 >= 1 },
  { id: 'streak3', icon: '🔥', name: 'ach.streak3.name', desc: 'ach.streak3.desc', test: (s) => s.streak >= 3 },
  { id: 'streak7', icon: '🌋', name: 'ach.streak7.name', desc: 'ach.streak7.desc', test: (s) => s.streak >= 7 },
  { id: 'days10', icon: '📅', name: 'ach.days10.name', desc: 'ach.days10.desc', test: (s) => s.days >= 10 },
  { id: 'night', icon: '🦉', name: 'ach.night.name', desc: 'ach.night.desc', test: (s) => s.night },
  { id: 'early', icon: '🐦', name: 'ach.early.name', desc: 'ach.early.desc', test: (s) => s.early },
];

interface StatsState { totalDistM: number; perDay: Record<string, number>; lastActive: string; streak: number; night: boolean; early: boolean }
let stats: StatsState = loadStats();
const unlocked: Set<string> = loadAch();
let statsTimer = 0;

function loadStats(): StatsState {
  try { const s = JSON.parse(localStorage.getItem(STATS_KEY) || 'null') as Partial<StatsState> | null; if (s && s.perDay) return s as StatsState; } catch { /* чистий старт */ }
  return { totalDistM: 0, perDay: {}, lastActive: '', streak: 0, night: false, early: false };
}
function loadAch(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(ACH_KEY) || '[]') as string[]); } catch { return new Set(); }
}
function saveStats(): void {
  try { localStorage.setItem(STATS_KEY, JSON.stringify(stats)); } catch { /* quota */ }
}
export function getStats(): StatsSnapshot {
  const days = Object.keys(stats.perDay);
  const best = days.reduce((m, d) => (stats.perDay[d] as number > (stats.perDay[m] || 0) ? d : m), days[0] || '');
  return {
    cells: visited.size, areaKm2: (visited.size * CELL_M2) / 1e6, totalKm: stats.totalDistM / 1000,
    streak: stats.streak, days: days.length, today: stats.perDay[dayKey()] || 0,
    best: best ? { date: best, n: stats.perDay[best] as number } : null,
    night: stats.night, early: stats.early,
  };
}

// Викликається з revealAt на кожну точку (added може бути 0).
export function bumpStats(added: number, distM: number): void {
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
  clearTimeout(statsTimer);
  statsTimer = window.setTimeout(saveStats, 5000);
  checkAch(false);
}

export function checkAch(silent: boolean): boolean {
  const s = getStats();
  let changed = false;
  for (const a of ACH) {
    if (!unlocked.has(a.id) && a.test(s)) {
      unlocked.add(a.id);
      changed = true;
      if (!silent) toast(`🏆 ${a.icon} ${a.name}!`);
    }
  }
  if (changed) { try { localStorage.setItem(ACH_KEY, JSON.stringify([...unlocked])); } catch { /* quota */ } }
  return changed;
}

export function achList(): Array<Ach & { done: boolean }> {
  return ACH.map((a) => ({ ...a, done: unlocked.has(a.id) }));
}
const dayKey = (d = new Date()): string => d.toISOString().slice(0, 10);
