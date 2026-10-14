(() => {
  const CELL_METERS = 70;
  const REVEAL_RADIUS = 120;
  const LS_KEY = 'fow_cells_v1';
  const R = 6378137;
  const MIN_FOG_ZOOM = 13; // нижче — суцільний туман, без порізки на клітинки
  // DEBUG=true: локалка і dev-збірка (кнопка ходьби, мітка версії).
  // На prod (APP_DEBUG=false) debug ховається. Без config.js — увімкнено.
  const DEBUG = (window.FOW_CONFIG || {}).DEBUG !== false;

  const $ = (id) => document.getElementById(id);
  const toast = (msg) => {
    const el = $('toast');
    el.textContent = msg;
    el.classList.remove('hidden');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.add('hidden'), 2600);
  };

  // ---------- state ----------
  let visited = new Set();
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) visited = new Set(JSON.parse(raw));
  } catch {}
  let routeLatLngs = [];
  let lastRoutePt = null;
  let userId = null;
  let supabase = null;
  let pendingSync = new Set();
  let saveTimer = null;
  let persistTimer = null;

  // тротлований запис localStorage: не на кожну точку, а раз на 5с / при виході
  function persistLocal(immediate = false) {
    $('statCells').textContent = visited.size;
    if (!immediate) {
      clearTimeout(persistTimer);
      persistTimer = setTimeout(() => persistLocal(true), 5000);
      return;
    }
    try { localStorage.setItem(LS_KEY, JSON.stringify([...visited].slice(-50000))); } catch {}
  }
  window.addEventListener('pagehide', () => persistLocal(true));

  // ---------- map: вантажимо тільки місто, не весь світ ----------
  const map = L.map('map', {
    zoomControl: false,
    minZoom: 11,
    maxZoom: 18,
    maxBoundsViscosity: 0.9,
    worldCopyJump: false,
  }).setView([50.4501, 30.5234], 13);
  L.control.zoom({ position: 'topright' }).addTo(map);

  const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    minZoom: 11,
    keepBuffer: 2,        // менше тайлів у пам'яті (було 5 за замовчуванням)
    updateWhenIdle: true, // не вантажити під час панорами, тільки коли зупинився
    updateInterval: 200,
    attribution: '&copy; OpenStreetMap'
  }).addTo(map);

  // Замок на район міста. Debug-ходьба його НЕ ставить, а реальний GPS може
  // перезамкнути, якщо ти далеко (>20км) від старого дому — інакше
  // кнопка «Де я?» вперлась би в старі межі і не стрибнула б.
  let homeCenter = null;
  function lockToHome(ll, force = false) {
    // перезамкнути, якщо дому ще нема, force, або ти далеко (>20км) — нове місто
    if (!homeCenter || force || map.distance(homeCenter, ll) > 20000) applyLock(ll);
  }
  function applyLock(ll) {
    homeCenter = ll;
    const box = L.latLngBounds(
      [ll.lat - 0.22, ll.lng - 0.32],
      [ll.lat + 0.22, ll.lng + 0.32]
    );
    map.setMaxBounds(box);
    tiles.options.bounds = box.pad(0.5);
    tiles.redraw();
  }
  function unlockHome() {
    homeCenter = null;
    map.setMaxBounds(null);
    tiles.options.bounds = undefined;
    tiles.redraw();
  }

  const routeLine = L.polyline([], { color: '#3b82f6', weight: 4, opacity: 0.9 }).addTo(map);
  let meMarker = null, accCircle = null;

  // ---------- fog: canvas ВСЕРЕДИНІ map-pane — їде разом з картою ----------
  // Попередній варіант (canvas поверх усього) не рухався під час драгу, бо
  // координати карти в момент перетягування застарілі. Всередині pane туман
  // отримує той самий CSS-трансформ що й тайли: рухаються як одне ціле.
  const FOG_MARGIN = 300; // запас навколо екрана щоб драг не оголював краї
  const fogCanvas = document.createElement('canvas');
  fogCanvas.id = 'fogCanvas';
  map.getPane('mapPane').appendChild(fogCanvas);
  const fctx = fogCanvas.getContext('2d');

  function drawFog() {
    const size = map.getSize();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const z = map.getZoom();
    const W = Math.round(size.x + FOG_MARGIN * 2), H = Math.round(size.y + FOG_MARGIN * 2);
    if (fogCanvas.width !== Math.round(W * dpr) || fogCanvas.height !== Math.round(H * dpr)) {
      fogCanvas.width = Math.round(W * dpr);
      fogCanvas.height = Math.round(H * dpr);
      fogCanvas.style.width = W + 'px';
      fogCanvas.style.height = H + 'px';
    }
    fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // верхній лівий кут canvas у layer-координатах (система всередині pane)
    const topLeft = map.containerPointToLayerPoint([-FOG_MARGIN, -FOG_MARGIN]);
    L.DomUtil.setPosition(fogCanvas, topLeft);

    fctx.globalCompositeOperation = 'source-over';
    fctx.fillStyle = '#0b1120'; // повністю непрозорий — карту під туманом не видно
    fctx.fillRect(0, 0, W, H);
    if (z < MIN_FOG_ZOOM || visited.size === 0) return;

    // УВАГА: layer-координати Leaflet — це НЕ глобальні пікселі, а зсунута
    // система (rebase). Правильний ланцюжок: екран C -> шар L = C - panePos
    // -> глобаль G = L + pixelOrigin. panePos читаємо з живого DOM.
    const panePos = L.DomUtil.getPosition(map.getPane('mapPane'));
    const origin = map.getPixelOrigin();
    const scale = 256 * Math.pow(2, z);
    const k = 0.5 / (Math.PI * R);
    // canvas-local p -> екран C = p - M -> шар -> глобаль -> метри -> клітинка
    const toCx = (p) => {
      const G = (p - FOG_MARGIN - panePos.x) + origin.x;
      return Math.floor((((G / scale) - 0.5) / k) / CELL_METERS);
    };
    const toCy = (p) => {
      const G = (p - FOG_MARGIN - panePos.y) + origin.y;
      return Math.floor(((0.5 - (G / scale)) / k) / CELL_METERS);
    };
    const x0 = toCx(0), x1 = toCx(W);
    const y0 = toCy(H), y1 = toCy(0); // південь..північ
    if ((x1 - x0) > 600 || (y1 - y0) > 600) return; // страховка — лишаємо суцільний

    // стирання = дірки у тумані (обернене перетворення: клітинка -> canvas-пікселі)
    fctx.globalCompositeOperation = 'destination-out';
    for (let cx = x0; cx <= x1; cx++) {
      const gx0 = scale * ((cx * CELL_METERS) * k + 0.5);
      const gx1 = scale * (((cx + 1) * CELL_METERS) * k + 0.5);
      const px0 = (gx0 - origin.x) + panePos.x + FOG_MARGIN;
      const px1 = (gx1 - origin.x) + panePos.x + FOG_MARGIN;
      for (let cy = y0; cy <= y1; cy++) {
        if (!visited.has(cx + ':' + cy)) continue;
        const gyN = scale * (-((cy + 1) * CELL_METERS) * k + 0.5);
        const gyS = scale * (-(cy * CELL_METERS) * k + 0.5);
        const pyN = (gyN - origin.y) + panePos.y + FOG_MARGIN;
        const pyS = (gyS - origin.y) + panePos.y + FOG_MARGIN;
        fctx.fillRect(px0, pyN, (px1 - px0) + 1, (pyS - pyN) + 1);
      }
    }
    fctx.globalCompositeOperation = 'source-over';
  }

  // ---------- grid ----------
  function cellsAround(latlng, radiusM) {
    const c = L.CRS.EPSG3857.project(latlng);
    const steps = Math.ceil(radiusM / CELL_METERS);
    const cx0 = Math.floor(c.x / CELL_METERS), cy0 = Math.floor(c.y / CELL_METERS);
    const out = [];
    for (let dx = -steps; dx <= steps; dx++) {
      for (let dy = -steps; dy <= steps; dy++) {
        const px = (cx0 + dx) * CELL_METERS + CELL_METERS / 2;
        const py = (cy0 + dy) * CELL_METERS + CELL_METERS / 2;
        if (Math.hypot(px - c.x, py - c.y) <= radiusM) out.push((cx0 + dx) + ':' + (cy0 + dy));
      }
    }
    return out;
  }

  // doLock=true тільки для реального GPS. Debug-ходьба замок не ставить,
  // інакше тест з Києва блокував би стрибок до твого справжнього міста.
  function revealAt(latlng, moveMap = false, doLock = false) {
    const cells = cellsAround(latlng, REVEAL_RADIUS);
    let added = 0;
    for (let i = 0; i < cells.length; i++) {
      if (!visited.has(cells[i])) { visited.add(cells[i]); pendingSync.add(cells[i]); added++; }
    }
    // маршрут: тільки якщо відійшов >5м, максимум 1000 точок
    if (!lastRoutePt || map.distance(lastRoutePt, latlng) > 5) {
      lastRoutePt = latlng;
      routeLine.addLatLng(latlng);
      routeLatLngs.push(latlng);
      if (routeLatLngs.length > 1000) {
        routeLatLngs.shift();
        routeLine.setLatLngs(routeLatLngs); // перебудова лише при переповненні
      }
    }

    if (added > 0) {
      persistLocal();
      if (moveMap) drawFog(); // «Де я?» — відкрити дірку одразу
      else drawFog();
      queueSync();
    }
    else { $('statCells').textContent = visited.size; }

    if (!meMarker) {
      meMarker = L.circleMarker(latlng, { radius: 8, color: '#fff', fillColor: '#2563eb', fillOpacity: 1, weight: 3 }).addTo(map);
    } else meMarker.setLatLng(latlng);
    if (doLock) lockToHome(latlng, moveMap); // «Де я?» завжди перезамкує на твоє місто
    if (moveMap) map.setView(latlng, Math.max(map.getZoom(), 16)); // відкриту дірку має бути видно
  }

  // ---------- GPS ----------
  let watchId = null, tracking = false;
  function onPos(pos) {
    const ll = L.latLng(pos.coords.latitude, pos.coords.longitude);
    if (accCircle) accCircle.setLatLng(ll).setRadius(pos.coords.accuracy || 30);
    else accCircle = L.circle(ll, { radius: pos.coords.accuracy || 30, color: '#2563eb', opacity: 0.25, fillOpacity: 0.12 }).addTo(map);
    revealAt(ll, false, true);
    detectCity(ll);
  }
  function onPosErr(err) { toast('GPS недоступний: ' + err.message); }
  function locateOnce() {
    if (!('geolocation' in navigator)) return toast('Браузер без GPS');
    navigator.geolocation.getCurrentPosition(
      (p) => { const ll = L.latLng(p.coords.latitude, p.coords.longitude); revealAt(ll, true, true); detectCity(ll); toast('Позицію знайдено'); },
      onPosErr, { enableHighAccuracy: true, timeout: 12000 }
    );
  }
  function toggleTrack() {
    if (tracking) {
      navigator.geolocation.clearWatch(watchId);
      tracking = false;
      $('btnTrack').textContent = '▶ Трекінг';
      persistLocal(true);
      toast('Трекінг зупинено');
    } else {
      if (!('geolocation' in navigator)) return toast('Браузер без GPS');
      watchId = navigator.geolocation.watchPosition(onPos, onPosErr, { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 });
      tracking = true;
      $('btnTrack').textContent = '⏸ Стоп';
      toast('Трекінг увімкнено — іди, туман відкриється');
    }
  }

  // ---------- місто автоматично ----------
  let cityDone = false;
  async function detectCity(ll) {
    if (cityDone) return;
    cityDone = true;
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${ll.lat}&lon=${ll.lng}&format=json`, {
        headers: { 'Accept': 'application/json' }
      }).then((x) => x.json());
      const a = r.address || {};
      const city = a.city || a.town || a.village || a.municipality || a.county || r.display_name?.split(',')[0] || '';
      if (city) $('cityName').textContent = '— ' + city;
    } catch {}
  }

  // ---------- Supabase онлайн ----------
  function initSupabase() {
    const cfg = window.FOW_CONFIG || {};
    const ok = cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && window.supabase;
    if (!ok) {
      $('statSync').textContent = '● local';
      $('statSync').className = 'sync-off';
      return;
    }
    supabase = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
    supabase.auth.onAuthStateChange((_ev, session) => {
      userId = session?.user?.id || null;
      updateAuthUI();
      if (userId) pullFromCloud();
    });
    supabase.auth.getSession().then(({ data }) => {
      userId = data.session?.user?.id || null;
      updateAuthUI();
      if (userId) pullFromCloud();
    });
    $('statSync').textContent = '● online';
    $('statSync').className = 'sync-on';
  }

  async function pullFromCloud() {
    if (!supabase || !userId) return;
    toast('Завантажую відкриті зони...');
    const { data, error } = await supabase.from('fog_cells').select('cell_id').limit(60000);
    if (error) return toast('Помилка завантаження: ' + error.message);
    let added = 0;
    for (const row of data) if (!visited.has(row.cell_id)) { visited.add(row.cell_id); added++; }
    persistLocal(true); drawFog();
    queueSync(true);
    toast(`Готово: ${visited.size} клітинок (${added} з хмари)`);
  }

  function queueSync(immediate = false) {
    if (!supabase || !userId || pendingSync.size === 0) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(pushToCloud, immediate ? 500 : 5000);
  }

  async function pushToCloud() {
    if (!supabase || !userId || pendingSync.size === 0) return;
    const rows = [...pendingSync].map((cell_id) => ({ user_id: userId, cell_id }));
    pendingSync.clear();
    for (let i = 0; i < rows.length; i += 1000) {
      const batch = rows.slice(i, i + 1000);
      const { error } = await supabase.from('fog_cells').upsert(batch, { onConflict: 'user_id,cell_id', ignoreDuplicates: true });
      if (error) {
        batch.forEach((r) => pendingSync.add(r.cell_id));
        return toast('Не вдалось зберегти онлайн: ' + error.message);
      }
    }
  }

  function updateAuthUI() { $('btnAuth').textContent = userId ? 'Акаунт ✓' : 'Увійти'; }

  // ---------- UI ----------
  if (!DEBUG) {
    $('btnDebug').style.display = 'none';
    $('appVer').style.display = 'none';
  }
  $('btnLocate').onclick = locateOnce;
  $('btnTrack').onclick = toggleTrack;
  $('btnAuth').onclick = () => $('authModal').classList.remove('hidden');
  $('btnCloseAuth').onclick = () => $('authModal').classList.add('hidden');
  $('btnSignup').onclick = async () => {
    if (!supabase) return $('authMsg').textContent = 'Спочатку встав ключі Supabase в config.js';
    const { error } = await supabase.auth.signUp({ email: $('email').value, password: $('password').value });
    $('authMsg').textContent = error ? error.message : 'Акаунт створено. Увійди.';
  };
  $('btnLogin').onclick = async () => {
    if (!supabase) return $('authMsg').textContent = 'Спочатку встав ключі Supabase в config.js';
    const { error } = await supabase.auth.signInWithPassword({ email: $('email').value, password: $('password').value });
    $('authMsg').textContent = error ? error.message : 'Успішно!';
    if (!error) $('authModal').classList.add('hidden');
  };
  $('btnLogout').onclick = async () => {
    if (supabase) await supabase.auth.signOut();
    userId = null; updateAuthUI();
    $('authModal').classList.add('hidden');
  };

  // ---------- DEBUG: віртуальна ходьба без GPS ----------
  let dbgPos = null, dbgMarker = null, dbgTeleport = false;
  const dbgPanel = $('debugPanel');
  function dbgShow() {
    if (!dbgPos) dbgPos = map.getCenter();
    if (!dbgMarker) {
      dbgMarker = L.circleMarker(dbgPos, { radius: 9, color: '#fbbf24', fillColor: '#f59e0b', fillOpacity: 1, weight: 3 }).addTo(map);
    }
    $('dbgPos').textContent = dbgPos.lat.toFixed(5) + ', ' + dbgPos.lng.toFixed(5) + ' · ' + visited.size + ' кл.';
  }
  function dbgWalkTo(ll, moveMap) {
    dbgPos = ll;
    if (dbgMarker) dbgMarker.setLatLng(ll);
    else dbgMarker = L.circleMarker(ll, { radius: 9, color: '#fbbf24', fillColor: '#f59e0b', fillOpacity: 1, weight: 3 }).addTo(map);
    revealAt(ll, !!moveMap, false);
    if ($('dbgFollow').checked && !moveMap) map.panTo(ll);
    $('dbgPos').textContent = ll.lat.toFixed(5) + ', ' + ll.lng.toFixed(5) + ' · ' + visited.size + ' кл.';
  }
  function dbgStep(dxM, dyM) {
    if (!dbgPos) dbgShow();
    const step = parseInt($('dbgStep').value, 10) || 70;
    const lat = dbgPos.lat + (dyM * step) / 111320;
    const lng = dbgPos.lng + (dxM * step) / (111320 * Math.cos(dbgPos.lat * Math.PI / 180));
    dbgWalkTo(L.latLng(lat, lng), false);
  }
  $('btnDebug').onclick = () => { dbgPanel.classList.toggle('hidden'); if (!dbgPanel.classList.contains('hidden')) dbgShow(); };
  $('btnDbgClose').onclick = () => dbgPanel.classList.add('hidden');
  $('btnDbgStart').onclick = () => { dbgWalkTo(map.getCenter(), true); toast('Ходок на центрі карти — ходи стрілками'); };
  $('btnDbgTeleport').onclick = (e) => {
    dbgTeleport = !dbgTeleport;
    e.currentTarget.textContent = '👆 Клік=телепорт: ' + (dbgTeleport ? 'увімк' : 'вимк');
    e.currentTarget.classList.toggle('on', dbgTeleport);
  };
  $('btnDbgReset').onclick = () => {
    visited.clear(); pendingSync.clear();
    routeLatLngs = []; lastRoutePt = null; routeLine.setLatLngs([]);
    try { localStorage.removeItem(LS_KEY); } catch {}
    persistLocal(true); drawFog();
    dbgShow();
    toast('Туман скинуто');
  };
  dbgPanel.querySelectorAll('.dpad button').forEach((b) => {
    b.onclick = () => { const [dx, dy] = b.dataset.step.split(',').map(Number); dbgStep(dx, dy); };
  });
  map.on('click', (e) => { if (dbgTeleport && !dbgPanel.classList.contains('hidden')) dbgWalkTo(e.latlng, false); });
  document.addEventListener('keydown', (e) => {
    if (dbgPanel.classList.contains('hidden')) return;
    if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
    const k = e.key.toLowerCase();
    if (e.key === 'ArrowUp' || k === 'w' || k === 'ц') { e.preventDefault(); dbgStep(0, 1); }
    else if (e.key === 'ArrowDown' || k === 's' || k === 'і') { e.preventDefault(); dbgStep(0, -1); }
    else if (e.key === 'ArrowLeft' || k === 'a' || k === 'ф') { e.preventDefault(); dbgStep(-1, 0); }
    else if (e.key === 'ArrowRight' || k === 'd' || k === 'в') { e.preventDefault(); dbgStep(1, 0); }
  });

  // туман — дитина map-pane: під час драгу/зуму їде разом з тайлами,
  // перемальовка потрібна лише коли рух закінчився або з'явились візити
  map.on('viewreset moveend zoomend resize', drawFog);

  // ---------- start ----------
  drawFog();
  persistLocal(true);
  initSupabase();
  locateOnce();
})();
