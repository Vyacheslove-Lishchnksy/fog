import 'leaflet/dist/leaflet.css';
import './style.css';
import './marker-icons';
import { initI18n, applyLang } from './i18n';
import { persistLocal } from './store';
import { drawFog, initFog } from './fog';
import { locateOnce } from './gps';
import { initUI } from './ui';
import { initDebug } from './debug';
import { tiles } from './world';

initI18n();
applyLang();

initFog();
initUI();
initDebug();
drawFog();
persistLocal(true);
locateOnce();
// Сплеш ховаємо коли тайли довантажились, або через 8с при поганій мережі.
const hideBoot = (): void => document.getElementById('boot')?.classList.add('hidden');
tiles.on('load', hideBoot);
window.setTimeout(hideBoot, 8000);
