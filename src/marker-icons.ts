import * as L from 'leaflet';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

// Leaflet сам шукає іконки через CSS (.leaflet-default-icon-path) і додає
// "marker-icon.png" до знайденого шляху. Vite інлайнить маленькі PNG у
// data:URI, тому виходить битий URL "data:image/png;base64,...marker-icon.png".
// Задаємо повні URL явно (працює і для data:URI, і для окремих файлів).
// _getIconUrl прибираємо, інакше Leaflet ігнорує options.iconUrl і додає префікс.
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });
