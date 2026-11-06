// ============================================================
// Системні константи гри (туман, клітини, радіуси)
// Редагуй тут, якщо потрібно змінити розмір клітинки чи радіус відкриття
// ============================================================

export const CELL_METERS = 70; // розмір однієї клітинки туману, метри
export const REVEAL_RADIUS = 120; // радіус відкриття навколо користувача, метри
export const R = 6378137; // радіус Землі, метри (для проектування)
export const MIN_FOG_ZOOM = 13; // мінімальний zoom, при якому малюється туман (нижче — суцільний)
export const MAX_CELLS_ON_SCREEN = 600; // гард: якщо клітинок на екрані більше — не малюємо туман
export const LS_VISITED_KEY = 'fow_cells_v1'; // ключ localStorage для відвіданих клітинок
export const LS_ROUTE_KEY = 'fow_route_v1'; // ключ localStorage для маршруту
export const LS_LASTPOS_KEY = 'fow_lastpos_v1'; // ключ localStorage для останньої позиції
export const LS_POINTS_KEY = 'fow_points_v1'; // ключ localStorage для точок
export const LS_STATS_KEY = 'fow_stats_v1'; // ключ localStorage для статистики
export const LS_ACH_KEY = 'fow_ach_v1'; // ключ localStorage для досягнень
export const MAX_VISITED_STORED = 50000; // ліміт клітинок в localStorage
export const MAX_ROUTE_STORED = 1000; // ліміт точок маршруту в localStorage

// GPS / трекінг фільтри
export const GPS_MAX_ACCURACY_M = 150; // максимальна точність fix, метри
export const GPS_MAX_SPEED_MPS = 55; // максимальна швидкість, м/с (фільтр стрибків)
export const GPS_MAX_AGE_MS = 30000; // максимальний вік fix, мс
