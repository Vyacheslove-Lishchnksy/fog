# Конфігурація проєкту Fog of War

Усі файли конфігурації знаходяться в папці `config/`. Кожен файл відповідає за свою область:
- `system.ts` — розміри клітинок, радіуси, ліміти localStorage, GPS-фільтри
- `ui.ts` — параметри інтерфейсу (кольори, розміри панелей, проміжки, туман, зерно)
- `debug.ts` — налаштування debug-панелі (кроки, дпад, телепорт, зерно)
- `cloud.ts` — Supabase / хмара (ліміти батчів, таймаути, назви таблиць)
- `achievements.ts` — список досягнень і їхні умови
- `stats.ts` — параметри статистики (площа клітинки, термін зберігання)
- `types.ts` — TypeScript типи для всіх конфігів
- `index.ts` — централізований імпорт всіх конфігів

## Змінні середовища (VITE_*)

Мають префікс `VITE_*` і читаються Vite на час збірки. Локально копіюйте `.env.example` як `.env.local`.

| Змінна | Обов'язкова | За замовчуванням | Опис |
|--------|-------------|------------------|------|
| `VITE_SUPABASE_URL` | Ні | — | URL Supabase проекту |
| `VITE_SUPABASE_ANON_KEY` | Ні | — | Anon key Supabase |
| `VITE_APP_DEBUG` | Ні | `true` (dev) / `false` (build) | Debug-панель і версія UI |
| `VITE_SHARE_URL` | Ні | `https://fog-0tou.onrender.com/` | URL для QR-коду шарінгу |

## Як редагувати параметри

Відкрийте відповідний файл в `config/` і змініть значення. Наприклад:

```ts
// config/system.ts
export const CELL_METERS = 70;      // змінити розмір клітинки
export const REVEAL_RADIUS = 120;   // змінити радіус відкриття
```

```ts
// config/ui.ts
export const UI = {
  leftPanelWidth: '260px',          // змінити ширину лівої панелі
  settingsPanelWidth: '260px',      // змінити ширину панелі налаштувань
  grainAlphaDefault: 0.08,          // щільність зерна за замовчуванням
};
```

## Як конфіги потрапляють в код

Усі модулі імпортують константи з `config/index.ts` (або з окремих файлів). Наприклад:

```ts
import { config } from '../config/index';
// config.system.CELL_METERS
// config.ui.leftPanelWidth
// config.debug.enabled
// config.cloud.pullLimit
```

## Безпека

- `.env.local` — **ніколи не комітьте** в git (вже в `.gitignore`).
- Без ключів Supabase додаток працює в режимі `● local` (тільки localStorage).
