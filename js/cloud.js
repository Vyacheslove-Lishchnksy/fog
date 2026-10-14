import { $, toast } from './core.js';
import { visited, pendingSync, persistLocal } from './store.js';
import { drawFog } from './fog.js';

// Онлайн-прогрес за акаунтом (Supabase). Без ключів — тільки локально.
export const session = { supabase: null, userId: null };
let saveTimer = null;

export function initSupabase() {
  const cfg = window.FOW_CONFIG || {};
  const ok = cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && window.supabase;
  if (!ok) {
    $('statSync').textContent = '● local';
    $('statSync').className = 'sync-off';
    return;
  }
  session.supabase = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
  session.supabase.auth.onAuthStateChange((_ev, s) => {
    session.userId = s?.user?.id || null;
    updateAuthUI();
    if (session.userId) pullFromCloud();
  });
  session.supabase.auth.getSession().then(({ data }) => {
    session.userId = data.session?.user?.id || null;
    updateAuthUI();
    if (session.userId) pullFromCloud();
  });
  $('statSync').textContent = '● online';
  $('statSync').className = 'sync-on';
}

async function pullFromCloud() {
  const { supabase, userId } = session;
  if (!supabase || !userId) return;
  toast('Завантажую відкриті зони...');
  const { data, error } = await supabase.from('fog_cells').select('cell_id').limit(60000);
  if (error) return toast('Помилка завантаження: ' + error.message);
  let added = 0;
  for (const row of data) if (!visited.has(row.cell_id)) { visited.add(row.cell_id); added++; }
  persistLocal(true);
  drawFog();
  queueSync(true);
  toast(`Готово: ${visited.size} клітинок (${added} з хмари)`);
}

export function queueSync(immediate = false) {
  const { supabase, userId } = session;
  if (!supabase || !userId || pendingSync.size === 0) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(pushToCloud, immediate ? 500 : 5000);
}

async function pushToCloud() {
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

export function updateAuthUI() {
  $('btnAuth').textContent = session.userId ? 'Акаунт ✓' : 'Увійти';
}
