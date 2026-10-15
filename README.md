# Fog of War — моє місто

Веб-додаток: карта з туманом війни. GPS відкриває клітинки ~70м навколо тебе в радіусі ~120м. Прогрес зберігається локально + в онлайні (Supabase) за акаунтом.

Стек: Vite + TypeScript, Leaflet + OpenStreetMap, Supabase. Тести: Vitest.

## Запуск локально
- Встанови залежності раз: `npm ci`
- **Dev** (з debug-меню, гаряче перезавантаження): `npm run dev` → http://localhost:8000
- **Prod-симуляція**: `npm run build`, потім `npm run preview` → http://localhost:8001 (чистий, без debug)
- Тести: `npm run test`, перевірка типів: `npm run typecheck`
- Ключі Supabase: скопіюй `.env.example` як `.env.local` і встав. Без ключів — режим `● local`
- DEBUG прапорець: `VITE_APP_DEBUG` (за замовчуванням true в dev, false в прод-збірці)

> GPS в браузері працює тільки на `localhost` або `https://`. Для телефона — дивись онлайн-варіант.

## Як викласти в онлайн (Render, безкоштовно)

1. Залий гілки `main` (прод) і `dev` на GitHub
2. `render.yaml` вже описує два сайти: `fow-prod` ← `main`, `fow-dev` ← `dev`
3. Dashboard → New → Blueprint → вибери репозиторій (або два Static Site вручну: Build `npm ci && npm run build`, Publish `dist`)
4. В кожному сайті задай env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_APP_DEBUG` (false/true)
5. Кожен push перезбирає автоматично, імена файлів з хешами — кеш не застрягає

### Увімкнути онлайн-збереження (акаунт + база)
1. https://supabase.com → New Project (free)
2. Authentication → Sign in / Providers → увімкни Email
3. SQL Editor → встав і виконай `supabase-schema.sql`
4. Project Settings → API → скопіюй `URL` і `anon key` в env на Render (або `.env.local` локально)
5. В додатку натисни «Увійти» → Реєстрація. З іншого телефона під тим же email зони підтягнуться

## Як користуватись
- 📍 Де я? — центрує карту і відкриває зону
- ▶ Трекінг — стежить під час прогулянки (екран не гасне завдяки Wake Lock)
- 📊 — статистика і досягнення
- 📱 — QR-код щоб відкрити сайт на телефоні
- 🛠 — debug-ходьба стрілками/кліком без GPS (тільки dev)
- Місто визначається автоматично по GPS
