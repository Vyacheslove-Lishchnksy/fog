import 'leaflet/dist/leaflet.css';
import './style.css';
import { persistLocal } from './store';
import { drawFog, initFog } from './fog';
import { locateOnce } from './gps';
import { initUI } from './ui';
import { initDebug } from './debug';

initFog();
initUI();
initDebug();
drawFog();
persistLocal(true);
locateOnce();
