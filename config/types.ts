// ============================================================
// Інтерфейс конфігурації (типи)
// ============================================================

export interface SystemConfig {
  CELL_METERS: number;
  REVEAL_RADIUS: number;
  R: number;
  MIN_FOG_ZOOM: number;
  MAX_CELLS_ON_SCREEN: number;
  LS_VISITED_KEY: string;
  LS_ROUTE_KEY: string;
  LS_LASTPOS_KEY: string;
  LS_POINTS_KEY: string;
  LS_STATS_KEY: string;
  LS_ACH_KEY: string;
  MAX_VISITED_STORED: number;
  MAX_ROUTE_STORED: number;
}

export interface AppConfig {
  system: SystemConfig;
  ui: ReturnType<typeof import('./ui')>['UI'];
  debug: ReturnType<typeof import('./debug')>['DEBUG'];
  cloud: ReturnType<typeof import('./cloud')>['CLOUD'];
}
