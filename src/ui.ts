import { $, DEBUG, VER } from './core';
import { locateOnce, toggleTrack } from './gps';
import { session, initSupabase, updateAuthUI } from './cloud';
import { getStats, achList, checkAch } from './stats';

// QR на прод-сайт (qr.svg згенеровано під прод-URL з VITE_SHARE_URL;
// якщо URL зміниться — перегенеруй qr.svg).
const SHARE_URL = (import.meta.env.VITE_SHARE_URL as string | undefined) || 'https://fog-0tou.onrender.com/';
function renderShare(): void {
  let m = $('shareModal');
  if (!m) {
    m = document.createElement('div');
    m.id = 'shareModal';
    m.className = 'modal hidden';
    m.innerHTML = `<div class="modal-card" style="align-items:center;text-align:center"><b>📱 На телефон</b><img id="qrImg" src="./qr.svg" alt="QR на сайт" /><div class="muted">${SHARE_URL}</div><button id="btnShareClose" class="btn ghost">Закрити</button></div>`;
    document.body.appendChild(m);
    m.addEventListener('click', (e) => {
      const t = e.target as HTMLElement;
      if (t === m || t.id === 'btnShareClose') m?.classList.add('hidden');
    });
  }
  m.classList.remove('hidden');
}
function shareButton(): HTMLButtonElement {
  const b = document.createElement('button');
  b.id = 'btnShare';
  b.className = 'btn ghost small';
  b.title = 'QR-код на телефон';
  b.textContent = '📱';
  b.onclick = renderShare;
  return b;
}
function renderStats(): void {
  const s = getStats();
  const rows = [
    ['🧩 Клітинок', String(s.cells)],
    ['🗺️ Площа', s.areaKm2.toFixed(2) + ' км²'],
    ['🚶 Пройдено', s.totalKm.toFixed(1) + ' км'],
    ['🔥 Стрік', s.streak + ' дн.'],
    ['📅 Активних днів', String(s.days)],
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

export function initUI(): void {
  $('appVer').textContent = 'v' + VER;
  if (!DEBUG) {
    $('btnDebug').style.display = 'none';
    $('appVer').style.display = 'none';
  }
  $('btnLocate').onclick = locateOnce;
  $('btnTrack').onclick = toggleTrack;
  $('btnStats').onclick = () => { renderStats(); $('statsModal').classList.remove('hidden'); };
  ($('topbar') as HTMLElement).insertBefore(shareButton(), $('btnAuth'));
  $('btnAuth').onclick = () => $('authModal').classList.remove('hidden');
  $('btnCloseAuth').onclick = () => $('authModal').classList.add('hidden');
  $('btnSignup').onclick = async () => {
    if (!session.supabase) return $('authMsg').textContent = 'Додай ключі Supabase в .env.local';
    const email = ($('email') as HTMLInputElement).value, password = ($('password') as HTMLInputElement).value;
    const { error } = await session.supabase.auth.signUp({ email, password });
    $('authMsg').textContent = error ? error.message : 'Акаунт створено. Увійди.';
  };
  $('btnLogin').onclick = async () => {
    if (!session.supabase) return $('authMsg').textContent = 'Додай ключі Supabase в .env.local';
    const email = ($('email') as HTMLInputElement).value, password = ($('password') as HTMLInputElement).value;
    const { error } = await session.supabase.auth.signInWithPassword({ email, password });
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
