// Централізоване читання всіх VITE_* змінних середовища.
// Отримуємо значення з import.meta.env (Vite підміняє їх на час збірки).

function envString(key: string, fallback: string): string {
  const v = import.meta.env[key] as string | undefined;
  return v !== undefined ? v : fallback;
}

function envBoolean(key: string, fallback: boolean): boolean {
  const v = import.meta.env[key] as string | undefined;
  if (v === undefined) return fallback;
  return v === 'true';
}

export const config = {
  // Supabase
  supabaseUrl: envString('VITE_SUPABASE_URL', ''),
  supabaseAnonKey: envString('VITE_SUPABASE_ANON_KEY', ''),

  // Debug
  debug: envBoolean('VITE_APP_DEBUG', import.meta.env.DEV),

  // Share / QR
  shareUrl: envString('VITE_SHARE_URL', 'https://fog-0tou.onrender.com/'),

  // Чи є онлайн-режим (маємо обидва ключі Supabase)
  get isOnline(): boolean {
    return Boolean(this.supabaseUrl && this.supabaseAnonKey);
  },
};

export function hasSupabaseKeys(): boolean {
  return config.isOnline;
}
