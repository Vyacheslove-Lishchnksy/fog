# AGENTS.md — Fog of War

Веб-додаток «туман війни» для міста. Leaflet + OpenStreetMap, Supabase.
GPS/трекінг відкриває клітинки 70×70м в радіусі 120м. Прогрес: localStorage + Supabase за акаунтом.

Стек: Vite + TypeScript (`npm run dev/build/preview/test`). Хеш в іменах файлів збірки — ручного версіонування URL більше нема; версія UI береться з `package.json`.

## Структура (бюджет: кожен файл < 100 рядків)

- `index.html` — шелл, модуль `/src/main.ts`, інлайн-реєстрація SW
- `src/main.ts` — тільки порядок запуску: initFog → initUI → initDebug → drawFog → persist → locate
- `src/core.ts` — константи (CELL_METERS=70, REVEAL_RADIUS=120, MIN_FOG_ZOOM=13), DEBUG/VER, `$`, `toast`
- `src/store.ts` — `visited: Set<cellId>`, маршрут (+сейв/рестор), `pendingSync`, `persistLocal` (тротл 5с + pagehide), ліміт 50000
- `src/world.ts` — карта (зуми 11–18), тайли OSM (`keepBuffer: 2`, `updateWhenIdle`), `lockToHome` (бокс ±25км, relock >20км), маркери, маршрут (>5м, max 1000)
- `src/grid.ts` — `cellsAround` (клітинки в колі), `revealAt` (додати → persist → draw → sync → маркер → замок → зум)
- `src/fog.ts` — canvas туману + `drawFog`, `initFog` (перемальовка на viewreset/moveend/zoomend/resize)
- `src/grain.ts` — перлинне зерно поверх туману (плитка 128px, `source-atop`, фаза по світу)
- `src/gps.ts` — `locateOnce`, трекінг `watchPosition`, авто-місто через Nominatim, фільтр стрибків, Wake Lock
- `src/cloud.ts` — Supabase auth + `pullFromCloud` (limit 60000) + `queueSync`/`pushToCloud` (батчі 1000, upsert ignoreDuplicates)
- `src/debug.ts` — debug-ходьба (dpad, WASD/стрілки, клік-телепорт, скидання, щільність зерна) — тільки dev
- `src/stats.ts` — статистика (`fow_stats_v1`: дистанція, дні, стрік) + 11 досягнень (`fow_ach_v1`), `bumpStats` з `revealAt`
- `src/ui.ts` — кнопки, auth-модалка, статистика-модалка, QR-шерінг (`qr.svg`), ховає debug в prod
- `src/style.css`, `public/` (manifest, `qr.svg`, `sw.js`), `tests/` (vitest + happy-dom, `setup.ts` з DOM-каркасом)
- Ключі: `.env.local` (не в репозиторії, див. `.env.example`) або env на Render (`VITE_*`)

## Критичні інваріанти (порушення = регресія, всі вже ловились)

1. **Layer-координати Leaflet ≠ глобальні пікселі.** Ланцюжок екран→клітинка: `C → L = C − panePos → G = L + pixelOrigin`, де `panePos` читається з живого DOM. Не «спрощувати» математику в `fog.ts`/`grid.ts` без наскрізного тесту дірок.
2. **Туман — canvas ВСЕРЕДИНІ `mapPane` (z-index 300).** Не виносити поверх контейнера (не їде при драгу) і не робити GridLayer-шаром (блимає при зумі).
3. **Краї дірок — м'які, але форма квадратна** (чіткі квадрати на прихованому шарі + блюр-копія ~18% клітинки, 4..12px; без радіальних градієнтів — круги помітні). Логіка підрахунку клітинок незмінна.
4. **Версії:** хеші Vite в іменах файлів; мітка UI з `package.json` (`__APP_VERSION__`). Ручних `?v=` більше нема.
5. **Локальний dev — `npm run dev`** (Vite, HMR). Кеш-стагнації як з голим http.server більше нема.
6. **DEBUG:** `VITE_APP_DEBUG` (default: true в dev, false в build). Prod ховає `#btnDebug` і `#appVer`, логіка спільна. Без ключів Supabase — режим `● local`.
7. **Пороги туману:** `MIN_FOG_ZOOM=13` (нижче — суцільний), гард 600 клітинок на екран.
8. **CDN більше нема:** leaflet і supabase-js бандляться з npm (запінені в `package.json`). Зовнішні запити тільки: тайли OSM, Nominatim (1 раз), Supabase API.

## Середовища

- Гілки: `dev` (робоча) → `main` (прод). Render: `fow-dev ← dev` (APP_DEBUG=true), `fow-prod ← main` (APP_DEBUG=false), див. `render.yaml`. Build: `npm ci && npm run build`, Publish: `dist`.
- Локально: `npm run dev` (:8000, DEBUG) / build+preview (:8001, prod). Різні порти = різне сховище.
- БД: `supabase-schema.sql` — таблиця `fog_cells(user_id, cell_id)` PK, RLS тільки свої рядки.

## Як тестувати

- Юніт: `npm run test` (grid/RADIUS-інваріанти).
- Наживо без GPS: `npm run dev` → debug-панель → «Старт з центру» → кроки. Очікувано: лічильник росте, дірка прозора в точці ходока, кут екрана непрозорий `#0b1120`, після драгу дірка на маркері до/під час/після. Консоль без помилок.
- Прод: `npm run build && npm run preview` → те саме на :8001.
