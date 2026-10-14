import { $, DEBUG } from './core.js';
import { locateOnce, toggleTrack } from './gps.js';
import { session, initSupabase, updateAuthUI } from './cloud.js';

export function initUI() {
  if (!DEBUG) {
    $('btnDebug').style.display = 'none';
    $('appVer').style.display = 'none';
  }
  $('btnLocate').onclick = locateOnce;
  $('btnTrack').onclick = toggleTrack;
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
}
