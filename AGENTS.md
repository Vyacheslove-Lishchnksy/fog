# AGENTS.md — Fog of War

Веб-додаток «туман війни» для міста. Leaflet + OpenStreetMap, Supabase.
GPS/трекінг відкриває клітинки 70×70м в радіусі 120м. Прогрес: localStorage + Supabase за акаунтом.

Стек: Vite + TypeScript (`npm run dev/build/preview/test`). Хеш в іменах файлів збірки — ручного версіонування URL більше нема; версія UI береться з `package.json`.

## Структура (бюджет: кожен файл < 100 рядків; словник `src/i18n.ts` — виняток)

- `index.html` — шелл (англійські fallback-тексти + `data-i18n*`), модуль `/src/main.ts`, інлайн-реєстрація SW
- `src/main.ts` — порядок запуску: initI18n/applyLang → initFog → initUI → initDebug → drawFog → persist → locate
- `src/core.ts` — константи (з `config/`), DEBUG/VER, `$`, `toast`
- `src/store.ts` — `visited: Set<cellId>`, маршрут (+сейв/рестор), `pendingSync`, `persistLocal` (тротл 5с + pagehide), ліміт 50000
- `src/world.ts` — карта (зуми 11–18), тайли OSM, `lockToHome` (бокс ±25км, relock >20км), маркери, маршрут (>5м, max 1000)
- `src/grid.ts` — `cellOf`, `cellsAround` (клітинки в колі), `revealAt` (додати → persist → draw → sync → маркер → замок → зум)
- `src/fog.ts` — canvas туману + `drawFog`, `initFog` (перемальовка на viewreset/moveend/zoomend/resize)
- `src/grain.ts` — перлинне зерно поверх туману (плитка 128px, `source-atop`, фаза по світу)
- `src/gps.ts` — `locateOnce`, трекінг `watchPosition`, авто-місто через Nominatim, фільтр стрибків, Wake Lock, `isTracking`
- `src/cloud.ts` — Supabase auth + `pullFromCloud` (limit 60000) + `queueSync`/`pushToCloud` (батчі 1000, upsert ignoreDuplicates), `updateAuthUI`
- `src/debug.ts` — debug-ходьба (dpad, WASD/стрілки, клік-телепорт, скидання, щільність зерна); вкладка в `#leftPanel`
- `src/stats.ts` — статистика (`fow_stats_v1`: дистанція, дні, стрік) + 11 досягнень (`fow_ach_v1`), `bumpStats` з `revealAt`
- `src/points.ts`, `src/point-list.ts`, `src/point-modal.ts` — точки: модель/маркери (tooltip-підпис), список з видаленням, модалка назви
- `src/left-panel.ts`, `src/settings-panel.ts` (+ `settings-panel.html` — шаблон) — ліві панелі «Точки/Дебаг» і налаштування
- `src/i18n.ts` — словник, `t()`, `applyLang()`, `getLang()/setLang()` (EN — основна, UK — опційна)
- `src/marker-icons.ts` — явні URL іконок Leaflet (фікс Vite data:URI)
- `src/ui.ts` — кнопки, auth-модалка, статистика-модалка, QR-шерінг (`qr.svg`)
- `src/style.css`, `src/util.ts` (`escapeHtml`), `src/globals.d.ts`, `public/` (manifest, `qr.svg`, `sw.js`), `tests/` (vitest + happy-dom, `setup.ts` з DOM-каркасом)
- `config/` — `system.ts`, `ui.ts`, `cloud.ts`, `debug.ts`, `achievements.ts`, `stats.ts`, `types.ts`, `README.md` (константи гри/UI/хмари)
- Ключі: `.env.local` (не в репозиторії, див. `.env.example`) або env на Render (`VITE_*`)

## Мова інтерфейсу (i18n)

- Основна мова — **англійська** (`current = 'en'` у `src/i18n.ts`). Українська вмикається в ⚙️ Налаштування; вибір зберігається в `localStorage.fow_lang`.
- Усі видимі рядки — тільки через `t('key')`. Ключі та переклади обох мов — в `src/i18n.ts`. Хардкод UI-текстів у TS/HTML заборонений (коментарі — можна).
- Статичний HTML: англійський fallback + `data-i18n`, `data-i18n-title`, `data-i18n-placeholder`. `applyLang()` перекладає листові вузли.
- Не вішати `data-i18n` на контейнери з дочірніми елементами (наприклад `.brand` з `#cityName`) — `textContent` знищує дітей.
- Динамічні елементи (статистика, модалка точки, список точок, тости, cloud-помилки) перекладаються `t()` у момент створення/рендеру; не покладатись на повторний `applyLang`.
- Новий рядок = новий ключ в обох мовах; у UI не повинні з'являтися сирі ключі.


## Критичні інваріанти (порушення = регресія, всі вже ловились)

1. **Layer-координати Leaflet ≠ глобальні пікселі.** Ланцюжок екран→клітинка: `C → L = C − panePos → G = L + pixelOrigin`, де `panePos` читається з живого DOM. Не «спрощувати» математику в `fog.ts`/`grid.ts` без наскрізного тесту дірок.
2. **Туман — canvas ВСЕРЕДИНІ `mapPane` (z-index 300).** Не виносити поверх контейнера (не їде при драгу) і не робити GridLayer-шаром (блимає при зумі).
3. **Краї дірок — м'які, але форма квадратна** (чіткі квадрати на прихованому шарі + блюр-копія ~18% клітинки, 4..12px; без радіальних градієнтів — круги помітні). Логіка підрахунку клітинок незмінна.
4. **Версії:** хеші Vite в іменах файлів; мітка UI з `package.json` (`__APP_VERSION__`). Ручних `?v=` більше нема.
5. **Локальний dev — `npm run dev`** (Vite, HMR). Кеш-стагнації як з голим http.server більше нема.
6. **DEBUG:** `VITE_APP_DEBUG` (default: true в dev, false в build). Prod ховає `#appVer`; debug-вкладка живе в `#leftPanel` (окремого `#btnDebug` більше нема). Без ключів Supabase — режим `● local`.
7. **Пороги туману:** `MIN_FOG_ZOOM=13` (нижче — суцільний), гард 600 клітинок на екран.
8. **CDN більше нема:** leaflet і supabase-js бандляться з npm (запінені в `package.json`). Зовнішні запити тільки: тайли OSM, Nominatim (1 раз), Supabase API.
9. **Іконки Leaflet:** тільки через `src/marker-icons.ts` (явні URL). Vite інлайнить дрібні PNG у `data:URI`, і штатний `_getIconUrl` робить битий URL — не повертати CSS-детект.

## Середовища

- Гілки: `dev` (робоча) → `main` (прод). Render: `fow-dev ← dev` (APP_DEBUG=true), `fow-prod ← main` (APP_DEBUG=false), див. `render.yaml`. Build: `npm ci && npm run build`, Publish: `dist`.
- Локально: `npm run dev` (:8000, DEBUG) / build+preview (:8001, prod). Різні порти = різне сховище.
- БД: `supabase-schema.sql` — таблиця `fog_cells(user_id, cell_id)` PK, RLS тільки свої рядки.

## Як тестувати

- Юніт: `npm run test` (grid/RADIUS-інваріанти).
- Мова: за замовчуванням EN; ⚙️ → Ukrainian → перевірити підписи/тости/модалки/статистику українською, після reload вибір зберігся; сирих ключів у UI бути не повинно.
- Наживо без GPS: `npm run dev` → debug-панель → «Старт з центру» → кроки. Очікувано: лічильник росте, дірка прозора в точці ходока, кут екрана непрозорий `#0b1120`, після драгу дірка на маркері до/під час/після. Консоль без помилок.
- Прод: `npm run build && npm run preview` → те саме на :8001.
