import { beforeEach, describe, expect, it } from 'vitest';
import * as L from 'leaflet';
import { cellsAround } from '../src/grid';

const kyiv = L.latLng(50.4501, 30.5234);

beforeEach(() => {
  document.body.innerHTML = '<div id="map" style="width:800px;height:600px"></div><div id="toast" class="hidden"></div>';
});

describe('cellsAround', () => {
  it('повертає непорожню множину клітинок', () => {
    expect(cellsAround(kyiv, 120).length).toBeGreaterThan(0);
  });
  it('всі центри клітинок в межах радіуса', () => {
    const c = L.CRS.EPSG3857.project(kyiv);
    for (const id of cellsAround(kyiv, 120)) {
      const [cx, cy] = id.split(':').map(Number);
      const d = Math.hypot((cx + 0.5) * 70 - c.x, (cy + 0.5) * 70 - c.y);
      expect(d).toBeLessThanOrEqual(120);
    }
  });
  it('детермінований', () => {
    expect(cellsAround(kyiv, 120)).toEqual(cellsAround(kyiv, 120));
  });
});
