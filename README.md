# Fog of War — моє місто

Веб-додаток: карта з туманом війни. GPS відкриває клітинки ~70м навколо тебе в радіусі ~120м. Прогрес зберігається локально + в онлайні (Supabase) за акаунтом.

## Запуск локально
- **Dev** (з debug-меню ходьби): подвійний клік `start-dev.bat` → http://localhost:8000
- **Prod** (чистий, як на телефоні): подвійний клік `start-prod.bat` → http://localhost:8001
- Або через npm: `npm run dev` / `npm run prod` (`npm start` = dev)
- Різні порти = різне локальне сховище, dev і prod не мішають прогрес один одному
- Режим перемикає `scripts/setmode.py` (пише DEBUG в `config.js`, ключі не чіпає)

> GPS в браузері працює тільки на `localhost` або `https://`. Тому для телефона краще одразу викласти онлайн.

## Як викласти в онлайн (безкоштовно, 10 хв)

### Варіант A: GitHub Pages (найпростіше)
1. Створи репозиторій на GitHub, залий ці файли
2. Settings → Pages → Deploy from branch → `main` / root
3. Отримаєш `https://твій-нік.github.io/fow/` — відкрий з телефона, увімкни GPS

### Варіант B: Netlify / Vercel
- Перетягни папку на https://app.netlify.com/drop — отримаєш https-посилання одразу

### Увімкнути онлайн-збереження (акаунт + база)
1. https://supabase.com → New Project (free)
2. Authentication → Sign in / Providers → увімкни Email
3. SQL Editor → встав і виконай `supabase-schema.sql`
4. Project Settings → API → скопіюй `URL` і `anon key` в `config.js`
5. Залий знову на хостинг. В додатку натисни «Увійти» → Реєстрація
6. Тепер зайшов з іншого телефона під тим же email — відкриті зони підтягнуться

Без Supabase-ключів додаток працює в режимі `● local` (прогрес тільки на цьому телефоні).

## Прод і дев збірки
- Гілки: `main` → прод, `dev` → дев. Працюй в `dev`, в `main` зливай коли стабільно.
- Два сайти на Render з одного репозиторія (`render.yaml` вже описує обидва):
  - **fow-prod** ← `main`, env `APP_DEBUG=false` — чистий інтерфейс без debug-меню
  - **fow-dev** ← `dev`, env `APP_DEBUG=true` — з кнопкою 🛠 ходьби і міткою версії
- Обидва: Build Command `bash inject-config.sh`, Publish Directory `.`
- Ключі Supabase задаються в Render як env (`SUPABASE_URL`, `SUPABASE_ANON_KEY`), в репозиторії їх нема (`config.js` в `.gitignore`, шаблон — `config.example.js`). Можна дати проду і деву різні Supabase-проєкти щоб не мішати дані.

## Як користуватись
- 📍 Де я? — центрує карту і відкриває зону
- ▶ Трекінг — стежить за тобою під час прогулянки, туман відкривається автоматично
- Місто визначається автоматично по GPS (Nominatim)
- 🛠 Debug — ходьба стрілками/кліком для перевірки без GPS (тільки dev)
