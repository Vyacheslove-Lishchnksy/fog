import { $, DEBUG } from './core.js';
import { locateOnce, toggleTrack } from './gps.js';
import { session, initSupabase, updateAuthUI } from './cloud.js';
import { getStats, achList, checkAch } from './stats.js';

function renderStats() {
  const s = getStats();
  const rows = [
    ['🧩 Клітинок', s.cells],
    ['🗺️ Площа', s.areaKm2.toFixed(2) + ' км²'],
    ['🚶 Пройдено', s.totalKm.toFixed(1) + ' км'],
    ['🔥 Стрік', s.streak + ' дн.'],
    ['📅 Активних днів', s.days],
    ['✨ Сьогодні', '+' + s.today],
    ['🏅 Рекорд дня', s.best ? `${s.best.n} (${s.best.date.slice(5)})` : '—'],
  ].map(([k, v]) => `<div class="stat-row"><span>${k}</span><b>${v}</b></div>`).join('');
  const list = achList();
  const ach = list.map((a) =>
    `<div class="ach${a.done ? ' on' : ''}"><span>${a.icon}</span><div><b>${a.name}</b><i>${a.desc}</i></div></div>`
  ).join('');
  $('statsCard').innerHTML =
    `<div class="dbg-head"><b>📊 Статистика</b><button id="btnStatsClose" class="btn small ghost">✕</button></div>` +
    rows + `<h4>Досягнення ${list.filter((a) => a.done).length}/${list.length}</h4>` + ach;
  $('btnStatsClose').onclick = () => $('statsModal').classList.add('hidden');
}

export function initUI() {
  if (!DEBUG) {
    $('btnDebug').style.display = 'none';
    $('appVer').style.display = 'none';
  }
  $('btnLocate').onclick = locateOnce;
  $('btnTrack').onclick = toggleTrack;
  $('btnStats').onclick = () => { renderStats(); $('statsModal').classList.remove('hidden'); };
  $('btnAuth').onclick = () => $('authModal').classList.remove('hidden');
  $('btnCloseAuth').onclick = () => $('authModal').classList.add('hidden');
  $('btnSignup').onclick = async () => {
    if (!session.supabase) return $('authMsg').textContent = 'Спочатку встав ключі Supabase в config.js';
    const { error } = await session.supabase.auth.signUp({ email: $('email').value, password: $('password').value });
    $('authMsg').textContent = error ? error.message : 'Акаунт створено. Увійди.';
  };
  $('btnLogin').onclick = async () => {
    if (!session.supabase) return $('authMsg').textContent = 'Спочатку встав ключі Supabase в config.js';
    const { error } = await session.supabase.auth.signInWithPassword({ email: $('email').value, password: $('password').value });
    $('authMsg').textContent = error ? error.message : 'Успішно!';
    if (!error) $('authModal').classList.add('hidden');
  };
  $('btnLogout').onclick = async () => {
    if (session.supabase) await session.supabase.auth.signOut();
    session.userId = null;
    updateAuthUI();
    $('authModal').classList.add('hidden');
  };
  initSupabase();
  checkAch(true); // ретро-розблокування за старий прогрес, тихо
}
