// ============================================================
// Конфігурація хмари (Supabase / синхронізація)
// Редагуй тут, якщо потрібно змінити ліміти батчів чи ключі
// ============================================================

export const CLOUD = {
  // Чи є у нас ключі Supabase (заповнюється з config.ts / env)
  enabled: false,

  // Ліміт завантаження клітинок з хмари
  pullLimit: 60000,

  // Розмір батча приpushToCloud
  pushBatchSize: 1000,

  // Зайобнки (ms) перед синхронізацією
  syncDelayMs: 5000,
  syncDelayImmediateMs: 500,

  // Чи ігнорувати дублікати при upsert
  ignoreDuplicates: true,

  // Конфліктний ключ для upsert
  upsertOnConflict: 'user_id,cell_id',

  // Таблиця в БД
  tableName: 'fog_cells',
};

export type CloudConfig = typeof CLOUD;
