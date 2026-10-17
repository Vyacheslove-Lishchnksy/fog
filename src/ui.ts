import { $, DEBUG, VER } from './core';
import { locateOnce, toggleTrack } from './gps';
import { session, initSupabase, updateAuthUI } from './cloud';
import { getStats, achList, checkAch } from './stats';
import { initPoints, togglePointMode, clearPoints, renderPointsList } from './points';

// QR на прод-сайт (qr.svg згенеровано під прод-URL з VITE_SHARE_URL;
// якщо URL зміниться — перегенеруй qr.svg).
const SHARE_URL = (import.meta.env.VITE_SHARE_URL as string | undefined) || 'https://fog-0tou.onrender.com/';
function renderShare(): void {
  let m = document.getElementById('shareModal'); // може ще не існувати — тут null ок
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

function initLeftPanel(): void {
  const panel = $('leftPanel');
  const tabPoints = panel.querySelector('[data-tab="points"]') as HTMLElement;
  const tabDebug = panel.querySelector('[data-tab="debug"]') as HTMLElement;
  const contentPoints = document.getElementById('tab-points')!;
  const contentDebug = document.getElementById('tab-debug')!;

  function openPanel(): void { panel.classList.remove('hidden'); panel.classList.add('open'); }
  function closePanel(): void { panel.classList.remove('open'); panel.classList.add('hidden'); }

  function showTab(tab: 'points' | 'debug'): void {
    tabPoints.classList.toggle('active', tab === 'points');
    tabDebug.classList.toggle('active', tab === 'debug');
    contentPoints.classList.toggle('hidden', tab !== 'points');
    contentDebug.classList.toggle('hidden', tab !== 'debug');
    if (tab === 'points') renderPointsList();
  }
  tabPoints.onclick = () => showTab('points');
  tabDebug.onclick = () => showTab('debug');

  // Кнопка відкриття панелі (під топбаром зліва)
  $('btnPanel').onclick = openPanel;

  // Закриття кліком поза зоною меню (але не на самому меню і не на кнопці виклику)
  document.addEventListener('click', (e) => {
    if (!panel.classList.contains('open')) return;
    const target = e.target as HTMLElement;
    if (target.id === 'btnPanel') return;
    if (panel.contains(target)) return;
    closePanel();
  });

  $('btnPointToggle')!.addEventListener('change', () => togglePointMode());
  $('btnPointListClear')!.onclick = () => clearPoints();

  // за замовчуванням показуємо вкладку Точок
  showTab('points');
}

export function initUI(): void {
  $('appVer').textContent = 'v' + VER;
  if (!DEBUG) {
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
  initLeftPanel();
  initPoints();
  checkAch(true); // ретро-розблокування за старий прогрес, тихо
}
