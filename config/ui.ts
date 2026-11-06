// ============================================================
// Налаштування інтерфейсу (UI)
// Редагуй тут, якщо потрібно змінити кольори, розміри панелей, проміжки
// ============================================================

export const UI = {
  // Карта
  minZoom: 11,
  maxZoom: 18,
  defaultZoom: 13,
  defaultCenter: [50.4501, 30.5234] as [number, number], // Київ

  // Топбар
  topbarTop: '10px',
  topbarLeftRight: '10px',
  topbarPadding: '10px 12px',
  topbarBorderRadius: '14px',

  // Ліва панель (Points + Debug)
  leftPanelTop: '74px',
  leftPanelBottom: '74px',
  leftPanelWidth: '260px',
  leftPanelBorderRadius: '16px',

  // Панель налаштувань
  settingsPanelTop: '74px',
  settingsPanelBottom: '74px',
  settingsPanelWidth: '260px',
  settingsPanelBorderRadius: '16px',

  // Кнопки панелей
  panelButtonSize: '40px',
  panelButtonZIndex: 1100,

  // Панель точок / дебагу
  panelToggleTop: '74px',
  panelToggleLeft: '10px',

  // Кнопка налаштувань
  settingsButtonTop: '128px',
  settingsButtonLeft: '10px',

  // Керування підому
  controlsBottom: '18px',
  controlsLeftRight: '10px',

  // 스플اش / boot
  bootBackground: '#0b1120',

  // Туман canvas
  fogMargin: 300, // запас навколо екрана, пікселі
  fogZIndex: 300,

  // Зерно
  grainTile: 128, // розмір плитки зерна, пікселі
  grainAlphaDefault: 0.08, // щільність зерна за замовчуванням
  grainAlphaMin: 0,
  grainAlphaMax: 0.25,

  // Край дірки туману
  blurCellPercent: 0.18, // ~18% від розміру клітинки
  blurMinPx: 4,
  blurMaxPx: 12,

  // Тайли
  tileKeepBuffer: 2,
  tileUpdateInterval: 200,
  tileMaxZoom: 18,
  tileMinZoom: 11,

  // Замок на район (lockToHome)
  homeBoxLat: 0.22, // ~±25 км по широті
  homeBoxLng: 0.32, // ~±25 км по довготі
  relockDistanceMeters: 20000, // перезамкнення якщо більше 20 км

  // Маршрут
  routeMinDistanceMeters: 5, // додавати точку тільки якщо зсунувся більше 5 м

  // Toasts
  toastDurationMs: 2600,

  // Persist
  persistThrottleMs: 5000,
  bootHideTimeoutMs: 8000,

  // Країни / межі світу
  worldBoundsViscosity: 0.9,
};

export type UiConfig = typeof UI;
