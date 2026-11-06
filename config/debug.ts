// ============================================================
// Debug / розробницькі налаштування
// Редагуй тут, щоб змінити поведінку debug-панелі
// ============================================================

export const DEBUG = {
  // Чи увімкнуто debug-панель (зазвичай визначається через VITE_APP_DEBUG)
  enabled: false,

  // Крок ходівки за замовчуванням, метри
  defaultStepMeters: 70,

  // Допустимі кроки у селекті
  stepOptionsMeters: [20, 70, 200],

  // Чи слідкувати карта за ходком за замовчуванням
  followByDefault: true,

  // Початкова щільність зерна (0–100, у відсотках)
  grainAlphaPercentDefault: 8,

  // Чи показувати дебаг-маркер позиції
  showMarkerByDefault: true,

  // Клавіатурні коди (для зручності редагування)
  keys: {
    up: ['ArrowUp', 'w', 'ц'],
    down: ['ArrowDown', 's', 'і'],
    left: ['ArrowLeft', 'a', 'ф'],
    right: ['ArrowRight', 'd', 'в'],
  },
};

export type DebugConfig = typeof DEBUG;
