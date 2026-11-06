import { $ } from './core';
import { togglePointMode, clearPoints } from './points';
import { renderPointsList } from './point-list';

export function initLeftPanel(): void {
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
    if (tab === 'points') renderPointsList((window as any).__points || []);
  }
  tabPoints.onclick = () => showTab('points');
  tabDebug.onclick = () => showTab('debug');

  // Кнопка відкриття панелі (під топбаром зліва)
  $('btnPanel').onclick = openPanel;

  // Закриття кліком поза зоною меню
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
