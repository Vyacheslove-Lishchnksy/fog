// ============================================================
// Головний конфіг — збирає всі модулі конфігурації в одне місце
// Редагуй параметри в окримих файлах (system.ts, ui.ts, debug.ts, cloud.ts, achievements.ts, stats.ts)
// ============================================================

import { config as envConfig, hasSupabaseKeys } from '../src/config';
import * as System from './system';
import * as UI from './ui';
import * as Debug from './debug';
import * as Cloud from './cloud';
import * as Achievements from './achievements';
import * as Stats from './stats';

export const system = System;
export const ui = UI.UI;
export const debug = { ...Debug.DEBUG, enabled: envConfig.debug };
export const cloud = {
  ...Cloud.CLOUD,
  enabled: hasSupabaseKeys(),
};
export const achievements = Achievements.ACHIEVEMENTS;
export const stats = Stats.STATS;

export const config = {
  system,
  ui,
  debug,
  cloud,
  achievements,
  stats,
};

// Експорт для зручного імпорту: import { config } from './config';
export default config;
