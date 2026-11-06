import { $, DEBUG, VER } from './core';
import { locateOnce, toggleTrack } from './gps';
import { session, initSupabase, updateAuthUI } from './cloud';
import { getStats, achList, checkAch } from './stats';
import { initPoints } from './points';
import { initLeftPanel } from './left-panel';
import { initSettingsPanel } from './settings-panel';
import { t } from './i18n';
import { config } from './config';

// QR на прод-сайт (qr.svg згенеровано під прод-URL з VITE_SHARE_URL;
// якщо URL зміниться — перегенеруй qr.svg).
const SHARE_URL = config.shareUrl;
function renderShare(): void {
  let m = document.getElementById('shareModal'); // може ще не існувати — тут null ок
  if (!m) {
    m = document.createElement('div');
    m.id = 'shareModal';
    m.className = 'modal hidden';
    m.innerHTML = `<div class="modal-card" style="align-items:center;text-align:center"><b>${t('modal.share.title')}</b><img id="qrImg" src="./qr.svg" alt="${t('share.subtitle')}" /><div class="muted">${t('share.subtitle')}</div><div class="muted">${SHARE_URL}</div><button id="btnShareClose" class="btn ghost">${t('modal.share.close')}</button></div>`;
    document.body.appendChild(m);
    m.addEventListener('click', (e) => {
      const el = e.target as HTMLElement;
      if (el === m || el.id === 'btnShareClose') m?.classList.add('hidden');
    });
  }
  m.classList.remove('hidden');
}
function shareButton(): HTMLButtonElement {
  const b = document.createElement('button');
  b.id = 'btnShare';
  b.className = 'btn ghost small';
  b.title = t('share.button');
  b.textContent = '📱';
  b.onclick = renderShare;
  return b;
}
function renderStats(): void {
  const s = getStats();
  const rows = [
    [t('stats.cells'), String(s.cells)],
    [t('stats.area'), s.areaKm2.toFixed(2) + ' ' + t('unit.km2')],
    [t('stats.distance'), s.totalKm.toFixed(1) + ' ' + t('unit.km')],
    [t('stats.streak'), s.streak + ' ' + t('unit.days')],
    [t('stats.days'), String(s.days)],
    [t('stats.today'), '+' + s.today],
    [t('stats.best'), s.best ? `${s.best.n} (${s.best.date.slice(5)})` : '—'],
  ].map(([k, v]) => `<div class="stat-row"><span>${k}</span><b>${v}</b></div>`).join('');
  const list = achList();
  const ach = list.map((a) =>
    `<div class="ach${a.done ? ' on' : ''}"><span>${a.icon}</span><div><b>${t(a.name)}</b><i>${t(a.desc)}</i></div></div>`
  ).join('');
  $('statsCard').innerHTML =
    `<div class="dbg-head"><b>${t('stats.title')}</b><button id="btnStatsClose" class="btn small ghost">${t('stats.close')}</button></div>` +
    rows + `<h4>${t('stats.achievements')} ${list.filter((a) => a.done).length}/${list.length}</h4>` + ach;
  $('btnStatsClose').onclick = () => $('statsModal').classList.add('hidden');
}

export function initUI(): void {
  $('appVer').textContent = t('ver.prefix') + VER;
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
    if (!session.supabase) return $('authMsg').textContent = t('modal.auth.msg.no-keys');
    const email = ($('email') as HTMLInputElement).value, password = ($('password') as HTMLInputElement).value;
    const { error } = await session.supabase.auth.signUp({ email, password });
    $('authMsg').textContent = error ? error.message : t('modal.auth.msg.created');
  };
  $('btnLogin').onclick = async () => {
    if (!session.supabase) return $('authMsg').textContent = t('modal.auth.msg.no-keys');
    const email = ($('email') as HTMLInputElement).value, password = ($('password') as HTMLInputElement).value;
    const { error } = await session.supabase.auth.signInWithPassword({ email, password });
    $('authMsg').textContent = error ? error.message : t('modal.auth.msg.success');
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
  initSettingsPanel();
  initPoints();
  checkAch(true); // ретро-розблокування за старий прогрес, тихо
}
