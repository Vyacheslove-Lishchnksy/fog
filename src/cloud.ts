import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { $, toast } from './core';
import { visited, pendingSync, persistLocal } from './store';
import { drawFog } from './fog';
import { t } from './i18n';
import { config as envConfig } from './config';
import { cloud } from '../config/index';

// Онлайн-прогрес за акаунтом. Без ключів — тільки локально.
export const session: { supabase: SupabaseClient | null; userId: string | null } = { supabase: null, userId: null };
let saveTimer = 0;

export function initSupabase(): void {
  if (!cloud.enabled) {
    $('statSync').textContent = '● local';
    $('statSync').className = 'sync-off';
    return;
  }
  session.supabase = createClient(envConfig.supabaseUrl, envConfig.supabaseAnonKey);
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
  toast(t('cloud.loading'));
  const { data, error } = await supabase.from(cloud.tableName).select('cell_id').limit(cloud.pullLimit);
  if (error) return toast('Помилка завантаження: ' + error.message);
  let added = 0;
  for (const row of data as Array<{ cell_id: string }>) {
    if (!visited.has(row.cell_id)) { visited.add(row.cell_id); added++; }
  }
  persistLocal(true);
  drawFog();
  queueSync(true);
  toast(t('cloud.loaded', { n: String(visited.size), a: String(added) }));
}

export function queueSync(immediate = false): void {
  const { supabase, userId } = session;
  if (!supabase || !userId || pendingSync.size === 0) return;
  clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => void pushToCloud(), immediate ? cloud.syncDelayImmediateMs : cloud.syncDelayMs);
}

async function pushToCloud(): Promise<void> {
  const { supabase, userId } = session;
  if (!supabase || !userId || pendingSync.size === 0) return;
  const rows = [...pendingSync].map((cell_id) => ({ user_id: userId, cell_id }));
  pendingSync.clear();
  for (let i = 0; i < rows.length; i += cloud.pushBatchSize) {
    const batch = rows.slice(i, i + cloud.pushBatchSize);
    const { error } = await supabase.from(cloud.tableName).upsert(batch, { onConflict: cloud.upsertOnConflict, ignoreDuplicates: cloud.ignoreDuplicates });
    if (error) {
      batch.forEach((r) => pendingSync.add(r.cell_id));
      return toast('Не вдалось зберегти онлайн: ' + error.message);
    }
  }
}

export function updateAuthUI(): void {
  $('btnAuth').textContent = session.userId ? t('btn.account') : t('btn.auth');
}
