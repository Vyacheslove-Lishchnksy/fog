// ============================================================
// Досягнення (achievements)
// Редагуй тут, щоб додати/змінити досягнення
// ============================================================

export const ACHIEVEMENTS = [
  { id: 'step1', icon: '👣', name: 'ach.step1.name', desc: 'ach.step1.desc', test: (s: any) => s.cells >= 1 },
  { id: 'c100', icon: '💯', name: 'ach.c100.name', desc: 'ach.c100.desc', test: (s: any) => s.cells >= 100 },
  { id: 'c1000', icon: '🏙️', name: 'ach.c1000.name', desc: 'ach.c1000.desc', test: (s: any) => s.cells >= 1000 },
  { id: 'km1', icon: '🚶', name: 'ach.km1.name', desc: 'ach.km1.desc', test: (s: any) => s.totalKm >= 1 },
  { id: 'km10', icon: '🥾', name: 'ach.km10.name', desc: 'ach.km10.desc', test: (s: any) => s.totalKm >= 10 },
  { id: 'area1', icon: '🗺️', name: 'ach.area1.name', desc: 'ach.area1.desc', test: (s: any) => s.areaKm2 >= 1 },
  { id: 'streak3', icon: '🔥', name: 'ach.streak3.name', desc: 'ach.streak3.desc', test: (s: any) => s.streak >= 3 },
  { id: 'streak7', icon: '🌋', name: 'ach.streak7.name', desc: 'ach.streak7.desc', test: (s: any) => s.streak >= 7 },
  { id: 'days10', icon: '📅', name: 'ach.days10.name', desc: 'ach.days10.desc', test: (s: any) => s.days >= 10 },
  { id: 'night', icon: '🦉', name: 'ach.night.name', desc: 'ach.night.desc', test: (s: any) => s.night },
  { id: 'early', icon: '🐦', name: 'ach.early.name', desc: 'ach.early.desc', test: (s: any) => s.early },
];

export type Achievement = (typeof ACHIEVEMENTS)[number];
