import { $ } from './core';
import { setLang, getLang, applyLang } from './i18n';
import type { Lang } from './i18n';

export function initSettingsPanel(): void {
  const panel = $('settingsPanel');

  function openPanel(): void { panel.classList.remove('hidden'); panel.classList.add('open'); }
  function closePanel(): void { panel.classList.remove('open'); panel.classList.add('hidden'); }

  $('btnSettings')!.onclick = (e) => {
    e.stopPropagation();
    openPanel();
    applyLang();
    const sel = document.getElementById('settingsLang') as HTMLSelectElement;
    if (sel) sel.value = getLang();
  };

  // Закриття кліком поза панелю
  document.addEventListener('click', (e) => {
    if (!panel.classList.contains('open')) return;
    const target = e.target as HTMLElement;
    if (target.id === 'btnSettings') return;
    if (panel.contains(target)) return;
    closePanel();
  });

  // Перемикач мови
  const langSelect = document.getElementById('settingsLang') as HTMLSelectElement;
  langSelect.value = getLang();
  langSelect.addEventListener('change', (e) => {
    const val = (e.target as HTMLSelectElement).value as Lang;
    setLang(val);
    applyLang();
    const sel = document.getElementById('settingsLang') as HTMLSelectElement;
    if (sel) sel.value = getLang();
  });
}
