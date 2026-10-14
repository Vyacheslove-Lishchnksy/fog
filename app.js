import { persistLocal } from './js/store.js';
import { drawFog, initFog } from './js/fog.js';
import { locateOnce } from './js/gps.js';
import { initUI } from './js/ui.js';
import { initDebug } from './js/debug.js';

initFog();
initUI();
initDebug();
drawFog();
persistLocal(true);
locateOnce();
