export type Lang = 'uk' | 'en';

// Основна мова — англійська. Українська вмикається в налаштуваннях (fow_lang).
const TR: Record<string, Record<Lang, string>> = {
  'app.title': { uk: 'Fog of War — моє місто', en: 'Fog of War — my city' },
  'boot.loading': { uk: 'Завантаження карти…', en: 'Loading map…' },
  'city.default': { uk: 'моє місто', en: 'my city' },
  'city.prefix': { uk: '— ', en: '— ' },
  'stat.cells': { uk: 'клітинок', en: 'cells' },
  'stat.sync.title': { uk: 'Статус синхронізації', en: 'Sync status' },
  'stat.sync.local': { uk: '● local', en: '● local' },
  'stat.sync.online': { uk: '● online', en: '● online' },
  'ver.title': { uk: 'Версія коду', en: 'Code version' },
  'ver.prefix': { uk: 'v', en: 'v' },
  'btn.auth': { uk: 'Увійти', en: 'Sign in' },
  'btn.account': { uk: 'Акаунт ✓', en: 'Account ✓' },
  'btn.locate': { uk: '📍 Де я?', en: '📍 Where am I?' },
  'btn.track': { uk: '▶ Трекінг', en: '▶ Tracking' },
  'btn.track.stop': { uk: '⏸ Стоп', en: '⏸ Stop' },
  'btn.stats': { uk: 'Статистика', en: 'Statistics' },
  'btn.panel': { uk: 'Меню', en: 'Menu' },
  'btn.settings': { uk: 'Налаштування', en: 'Settings' },
  'tab.points': { uk: '📌 Точки', en: '📌 Points' },
  'tab.debug': { uk: '🛠 Дебаг', en: '🛠 Debug' },
  'panel.points.title': { uk: '📌 Мої точки', en: '📌 My points' },
  'panel.debug.title': { uk: '🛠 Ходьба (debug)', en: '🛠 Walk (debug)' },
  'panel.settings.title': { uk: '⚙️ Налаштування', en: '⚙️ Settings' },
  'lang.label': { uk: 'Мова', en: 'Language' },
  'lang.uk': { uk: 'Українська', en: 'Ukrainian' },
  'lang.en': { uk: 'Англійська', en: 'English' },
  'lang.changed': { uk: 'Зберігається у локальному сховищі.', en: 'Saved in local storage.' },
  'hint.point.toggle': { uk: 'Режим поставити точку на карті', en: 'Place-a-point mode on the map' },
  'hint.point.click': {
    uk: 'Клік по відкритій частині карти — поставити точку',
    en: 'Click on the revealed part of the map to place a point',
  },
  'hint.point.off': { uk: 'Режим точок вимкнено', en: 'Point mode off' },
  'dbg.start': { uk: '📍 Старт з центру', en: '📍 Start from center' },
  'dbg.teleport.on': { uk: '👆 Клік=телепорт: увімк', en: '👆 Click=teleport: on' },
  'dbg.teleport.off': { uk: '👆 Клік=телепорт: вимк', en: '👆 Click=teleport: off' },
  'dbg.reset': { uk: 'Скинути туман', en: 'Reset fog' },
  'dbg.grain': { uk: 'Щільність зерна', en: 'Grain density' },
  'dbg.follow': { uk: 'слідкувати', en: 'follow' },
  'dbg.step20': { uk: 'крок 20м', en: 'step 20m' },
  'dbg.step70': { uk: 'крок 70м', en: 'step 70m' },
  'dbg.step200': { uk: 'крок 200м', en: 'step 200m' },
  'dbg.pos.hint': { uk: 'клікни «Старт» або клік по карті', en: 'click “Start” or click on the map' },
  'dbg.cellsUnit': { uk: 'кл.', en: 'cells' },
  'dbg.toast.start': { uk: 'Ходок на центрі — ходи стрілками', en: 'Walker at center — move with arrows' },
  'keyboard.hint': { uk: 'Клавіатура: стрілки / WASD = крок', en: 'Keyboard: arrows / WASD = step' },
  'modal.auth.title': { uk: 'Онлайн-прогрес', en: 'Online progress' },
  'modal.auth.hint': {
    uk: 'Без ключів Supabase працює локально. Додай їх в .env.local (дивись .env.example).',
    en: 'Without Supabase keys it works locally only. Add them to .env.local (see .env.example).',
  },
  'modal.auth.email': { uk: 'email', en: 'email' },
  'modal.auth.password': { uk: 'пароль', en: 'password' },
  'modal.auth.login': { uk: 'Увійти', en: 'Sign in' },
  'modal.auth.signup': { uk: 'Реєстрація', en: 'Sign up' },
  'modal.auth.logout': { uk: 'Вийти', en: 'Sign out' },
  'modal.auth.close': { uk: 'Закрити', en: 'Close' },
  'modal.auth.msg.no-keys': { uk: 'Додай ключі Supabase в .env.local', en: 'Add Supabase keys to .env.local' },
  'modal.auth.msg.created': { uk: 'Акаунт створено. Увійди.', en: 'Account created. Sign in.' },
  'modal.auth.msg.success': { uk: 'Успішно!', en: 'Success!' },
  'modal.share.title': { uk: '📱 На телефон', en: '📱 Open on phone' },
  'modal.share.close': { uk: 'Закрити', en: 'Close' },
  'share.subtitle': { uk: 'QR-код на телефон', en: 'QR code for phone' },
  'share.button': { uk: 'QR-код на телефон', en: 'QR code for phone' },
  'stats.title': { uk: '📊 Статистика', en: '📊 Statistics' },
  'stats.close': { uk: '✕', en: '✕' },
  'stats.cells': { uk: 'Клітинок', en: 'Cells' },
  'stats.area': { uk: 'Площа', en: 'Area' },
  'stats.distance': { uk: 'Пройдено', en: 'Distance' },
  'stats.streak': { uk: 'Стрік', en: 'Streak' },
  'stats.days': { uk: 'Активних днів', en: 'Active days' },
  'stats.today': { uk: 'Сьогодні', en: 'Today' },
  'stats.best': { uk: 'Рекорд дня', en: 'Best day' },
  'stats.achievements': { uk: 'Досягнення', en: 'Achievements' },
  'unit.km': { uk: 'км', en: 'km' },
  'unit.km2': { uk: 'км²', en: 'km²' },
  'unit.days': { uk: 'дн.', en: 'd' },
  'toast.gps.unavailable': { uk: 'Браузер без GPS', en: 'Browser without GPS' },
  'toast.gps.searching': { uk: '⏳ Пошук…', en: '⏳ Searching…' },
  'toast.gps.done': { uk: '📍 Де я?', en: '📍 Where am I?' },
  'toast.gps.found': { uk: 'Позицію знайдено', en: 'Position found' },
  'toast.gps.timeout': {
    uk: 'GPS мовчить 12с. На ПК без GPS це нормально — відкрий з телефона',
    en: 'GPS silent for 12s. On PC without GPS this is normal — open from phone',
  },
  'toast.gps.error': { uk: 'GPS недоступний: {{msg}}', en: 'GPS unavailable: {{msg}}' },
  'toast.track.on': {
    uk: 'Трекінг увімкнено — іди, туман відкриється (екран не гасне)',
    en: 'Tracking enabled — walk, fog will open (screen stays on)',
  },
  'toast.track.off': { uk: 'Трекінг зупинено', en: 'Tracking stopped' },
  'toast.reset': { uk: 'Туман скинуто', en: 'Fog reset' },
  'cloud.loading': { uk: 'Завантажую відкриті зони...', en: 'Loading revealed zones...' },
  'cloud.loaded': { uk: 'Готово: {{n}} клітинок ({{a}} з хмари)', en: 'Done: {{n}} cells ({{a}} from cloud)' },
  'cloud.error.load': { uk: 'Помилка завантаження: {{msg}}', en: 'Load error: {{msg}}' },
  'cloud.error.save': { uk: 'Не вдалось зберегти онлайн: {{msg}}', en: 'Could not save online: {{msg}}' },
  'points.list.empty': { uk: 'Точок немає', en: 'No points yet' },
  'points.clear.all': { uk: 'Очистити всі', en: 'Clear all' },
  'points.added': { uk: 'Точку додано', en: 'Point added' },
  'points.removed': { uk: 'Точку видалено', en: 'Point removed' },
  'points.removed.all': { uk: 'Усі точки видалені', en: 'All points cleared' },
  'points.exists': { uk: 'Така точка вже є', en: 'Such point already exists' },
  'points.fog': { uk: 'Туман: клітинка не відкрита', en: 'Fog: cell not revealed' },
  'points.delete': { uk: 'Видалити', en: 'Delete' },
  'points.marker.alt': { uk: 'Точка', en: 'Point' },
  'pointModal.title': { uk: '📌 Нова точка', en: '📌 New point' },
  'pointModal.hint': { uk: 'Назва точки (можна залишити порожнім):', en: 'Point name (optional):' },
  'pointModal.placeholder': { uk: 'наприклад: Дім, Парк, Робота', en: 'e.g. Home, Park, Work' },
  'pointModal.ok': { uk: 'ОК', en: 'OK' },
  'pointModal.cancel': { uk: 'Скасувати', en: 'Cancel' },
  'ach.step1.name': { uk: 'Перший крок', en: 'First step' },
  'ach.step1.desc': { uk: 'Відкрий першу клітинку', en: 'Reveal the first cell' },
  'ach.c100.name': { uk: 'Сотня', en: 'Hundred' },
  'ach.c100.desc': { uk: '100 клітинок', en: '100 cells' },
  'ach.c1000.name': { uk: 'Тисяча', en: 'Thousand' },
  'ach.c1000.desc': { uk: '1000 клітинок', en: '1000 cells' },
  'ach.km1.name': { uk: 'Кілометр', en: 'Kilometer' },
  'ach.km1.desc': { uk: 'Пройди 1 км', en: 'Walk 1 km' },
  'ach.km10.name': { uk: 'Десятка', en: 'Ten' },
  'ach.km10.desc': { uk: 'Пройди 10 км', en: 'Walk 10 km' },
  'ach.area1.name': { uk: 'Квадратний кілометр', en: 'Square kilometer' },
  'ach.area1.desc': { uk: 'Відкрий 1 км²', en: 'Reveal 1 km²' },
  'ach.streak3.name': { uk: 'Три дні поспіль', en: 'Three days in a row' },
  'ach.streak3.desc': { uk: 'Гуляй 3 дні підряд', en: 'Walk 3 days in a row' },
  'ach.streak7.name': { uk: 'Тиждень без зупинки', en: 'Week without stopping' },
  'ach.streak7.desc': { uk: 'Гуляй 7 днів підряд', en: 'Walk 7 days in a row' },
  'ach.days10.name': { uk: 'Регулярний', en: 'Regular' },
  'ach.days10.desc': { uk: '10 активних днів', en: '10 active days' },
  'ach.night.name': { uk: 'Нічний ходок', en: 'Night walker' },
  'ach.night.desc': { uk: 'Відкривай після 22:00', en: 'Reveal after 22:00' },
  'ach.early.name': { uk: 'Ранкова пташка', en: 'Early bird' },
  'ach.early.desc': { uk: 'Відкривай о 5–7 ранку', en: 'Reveal at 5–7 AM' },
};

let current: Lang = 'en';

export function getLang(): Lang { return current; }

export function setLang(lang: Lang): void {
  current = lang;
  try { localStorage.setItem('fow_lang', lang); } catch { /* noop */ }
}

export function t(key: string, params?: Record<string, string>): string {
  let val = TR[key]?.[current] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      val = val.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v);
    }
  }
  return val;
}

export function initI18n(): void {
  try {
    const saved = localStorage.getItem('fow_lang');
    if (saved === 'uk' || saved === 'en') current = saved;
  } catch { /* noop */ }
}

// Перекладає листові вузли. Не вішати data-i18n на контейнери з дітьми:
// textContent знищує вкладені елементи.
export function applyLang(): void {
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset['i18n'] as string);
  });
  document.querySelectorAll<HTMLElement>('[data-i18n-title]').forEach((el) => {
    el.title = t(el.dataset['i18nTitle'] as string);
  });
  document.querySelectorAll<HTMLElement>('[data-i18n-placeholder]').forEach((el) => {
    (el as HTMLInputElement).placeholder = t(el.dataset['i18nPlaceholder'] as string);
  });
  const sel = document.getElementById('settingsLang') as HTMLSelectElement | null;
  if (sel) sel.value = current;
  document.documentElement.lang = current;
  document.title = t('app.title');
}
