import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { $, toast } from './core';
import { visited, pendingSync, persistLocal } from './store';
import { drawFog } from './fog';

// Онлайн-прогрес за акаунтом. Без ключів — тільки локально.
export const session: { supabase: SupabaseClient | null; userId: string | null } = { supabase: null, userId: null };
let saveTimer = 0;

export function initSupabase(): void {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (!url || !key) {
    $('statSync').textContent = '● local';
    $('statSync').className = 'sync-off';
    return;
  }
  session.supabase = createClient(url, key);
  session.supabase.auth.onAuthStateChange((_ev, s) => {
    session.userId = s?.user?.id || null;
    updateAuthUI();
    if (session.userId) void pullFromCloud();
  });
  void session.supabase.auth.getSession().then(({ data }) => {
    session.userId = data.session?.user?.id || null;
    updateAuthUI();
    if (session.userId) void pullFromCloud();
  });
  $('statSync').textContent = '● online';
  $('statSync').className = 'sync-on';
}

async function pullFromCloud(): Promise<void> {
  const { supabase, userId } = session;
  if (!supabase || !userId) return;
  toast('Завантажую відкриті зони...');
  const { data, error } = await supabase.from('fog_cells').select('cell_id').limit(60000);
  if (error) return toast('Помилка завантаження: ' + error.message);
  let added = 0;
  for (const row of data as Array<{ cell_id: string }>) {
    if (!visited.has(row.cell_id)) { visited.add(row.cell_id); added++; }
  }
  persistLocal(true);
  drawFog();
  queueSync(true);
  toast(`Готово: ${visited.size} клітинок (${added} з хмари)`);
}

export function queueSync(immediate = false): void {
  const { supabase, userId } = session;
  if (!supabase || !userId || pendingSync.size === 0) return;
  clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => void pushToCloud(), immediate ? 500 : 5000);
}

async function pushToCloud(): Promise<void> {
  const { supabase, userId } = session;
  if (!supabase || !userId || pendingSync.size === 0) return;
  const rows = [...pendingSync].map((cell_id) => ({ user_id: userId, cell_id }));
  pendingSync.clear();
  for (let i = 0; i < rows.length; i += 1000) {
    const batch = rows.slice(i, i + 1000);
    const { error } = await supabase.from('fog_cells').upsert(batch, { onConflict: 'user_id,cell_id', ignoreDuplicates: true });
    if (error) {
      batch.forEach((r) => pendingSync.add(r.cell_id));
      return toast('Не вдалось зберегти онлайн: ' + error.message);
    }
  }
}

export function updateAuthUI(): void {
  $('btnAuth').textContent = session.userId ? 'Акаунт ✓' : 'Увійти';
}
