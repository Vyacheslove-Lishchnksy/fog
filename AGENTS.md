# AGENTS.md — Fog of War

Веб-додаток «туман війни» для міста. Leaflet + OpenStreetMap, чистий статик без збірки.
GPS/трекінг відкриває клітинки 70×70м в радіусі 120м. Прогрес: localStorage + Supabase за акаунтом.

## Структура (бюджет: кожен файл < 100 рядків)

- `index.html` — шелл, підключає CDN (Leaflet, supabase-js), `config.js`, модуль `app.js`
- `app.js` (12) — тільки порядок запуску: initFog → initUI → initDebug → drawFog → persist → locate
- `js/core.js` — константи (CELL_METERS=70, REVEAL_RADIUS=120, MIN_FOG_ZOOM=13), DEBUG-флаг, `$`, `toast`
- `js/store.js` — `visited: Set<cellId>`, маршрут, `pendingSync`, `persistLocal` (тротл 5с + pagehide), ліміт 50000
- `js/world.js` — карта (зуми 11–18), тайли OSM (`keepBuffer: 2`, `updateWhenIdle`), `lockToHome` (бокс ±25км, relock >20км), маркери, маршрут (>5м, max 1000)
- `js/grid.js` — `cellsAround` (клітинки в колі), `revealAt` (додати → persist → draw → sync → маркер → замок → зум)
- `js/fog.js` — canvas туману + `drawFog`, `initFog` (перемальовка на viewreset/moveend/zoomend/resize)
- `js/gps.js` — `locateOnce`, трекінг `watchPosition`, авто-місто через Nominatim
- `js/cloud.js` — Supabase auth + `pullFromCloud` (limit 60000) + `queueSync`/`pushToCloud` (батчі 1000, upsert ignoreDuplicates)
- `js/debug.js` — debug-ходьба (dpad, WASD/стрілки, клік-телепорт, скидання) — тільки dev
- `js/ui.js` — кнопки, auth-модалка, ховає debug в prod
- `config.js` — НЕ в репозиторії (`.gitignore`): генерується `inject-config.sh` з env на Render або лежить локально (див. `config.example.js`)

## Критичні інваріанти (порушення = регресія, всі вже ловились)

1. **Layer-координати Leaflet ≠ глобальні пікселі.** Ланцюжок екран→клітинка: `C → L = C − panePos → G = L + pixelOrigin`, де `panePos` читається з живого DOM (`L.DomUtil.getPosition(mapPane)`). Не «спрощувати» математику в `fog.js`/`grid.js` без наскрізного тесту дірок.
2. **Туман — canvas ВСЕРЕДИНІ `mapPane` (z-index 300).** Не виносити поверх контейнера (не їде при драгу) і не робити GridLayer-шаром (блимає при зумі: тайли карти й туману оновлюються в різний час).
3. **Краї дірок — чіткі, по сітці клітинок.** Без згладжування/feathering: логіка й вигляд клітинок заморожені за вимогою власника.
4. **Версіонування:** кожна user-facing зміна → bump `?v=N` в `index.html` (css/config/app) + мітка `#appVer`. Інакше старий код в кеші.
5. **Локальний dev тільки через `scripts/serve.py`** (шле `Cache-Control: no-store`). Голий `http.server` + евристичний кеш браузера = «все таке саме» після правок.
6. **DEBUG:** `(FOW_CONFIG || {}).DEBUG !== false` — без конфіга debug увімкнений. Prod ховає `#btnDebug` і `#appVer`, логіка спільна.
7. **Пороги туману:** `MIN_FOG_ZOOM=13` (нижче — суцільний), гард 600 клітинок на екран.

## Середовища

- Гілки: `dev` (робоча) → `main` (прод). Render: `fow-dev ← dev` (APP_DEBUG=true), `fow-prod ← main` (APP_DEBUG=false), див. `render.yaml`. Build: `bash inject-config.sh`, Publish: `.`
- Локально: `start-dev.bat` (:8000, DEBUG=true) / `start-prod.bat` (:8001, DEBUG=false), або `npm run dev/prod`. Різні порти = різне сховище. Режим ставить `scripts/setmode.py`.
- БД: `supabase-schema.sql` — таблиця `fog_cells(user_id, cell_id)` PK, RLS тільки свої рядки.

## Як тестувати (без GPS)

Через debug-панель (dev): «Старт з центру» → кроки/клік-телепорт. Очікувано: лічильник росте, дірка прозора в точці ходока (`0,0,0,0`), кут екрана непрозорий `#0b1120`, після синтетичного драгу дірка лишається на маркері до/під час/після. Консоль без помилок.
