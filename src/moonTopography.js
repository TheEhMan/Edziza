// Official NASA SVS CGI Moon Kit LRO/LOLA dataset, ldem_4.tif.
// Elevation samples are in KILOMETRES relative to the 1737.4 km lunar sphere.
// This is ~7.6 km north/south grid spacing, NOT rover-scale topography.
// The code does not manufacture an elevation model if the NASA raster is absent.
import { NASA_LOLA_PATH } from './nasaRaster.js';

export const MOON_REFERENCE_RADIUS_KM = 1737.4;
const SOURCES = [
  '/nasa-data/ldem_4.tif',
  `/nasa-remote${NASA_LOLA_PATH}`,
  `https://svs.gsfc.nasa.gov${NASA_LOLA_PATH}`
];
let cachedPromise;
export async function loadMoonElevationGrid() {
  if (cachedPromise) return cachedPromise;
  cachedPromise = (async () => {
    let error;
    for (const url of SOURCES) {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const buffer = await response.arrayBuffer();
        // Vite may return index.html for an absent file: don't parse this as DEM.
        if (buffer.byteLength < 1_000_000) throw new Error('Lunar data missing or incomplete');
        const { fromArrayBuffer } = await import('geotiff');
        const file = await fromArrayBuffer(buffer);
        const image = await file.getImage();
        const width = image.getWidth(), height = image.getHeight();
        if (width !== 1440 || height !== 720) throw new Error('Unexpected NASA LOLA grid dimensions');
        const values = await image.readRasters({ samples: [0], interleave: true });
        if (values.length !== width * height) throw new Error('Incomplete lunar DEM grid');
        return { width, height, values, source: url };
      } catch (e) { error = e; }
    }
    throw new Error(`NASA LOLA raster could not be loaded: ${error?.message || 'unknown error'}`);
  })();
  return cachedPromise;
}

export function sampleMoonHeightKm(grid, latitude, longitude) {
  if (!grid || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  const x = Math.min(grid.width - 1, Math.max(0, Math.floor((((longitude + 180) % 360 + 360) % 360) / 360 * grid.width)));
  const y = Math.min(grid.height - 1, Math.max(0, Math.floor((90 - latitude) / 180 * grid.height)));
  const value = Number(grid.values[y * grid.width + x]);
  return Number.isFinite(value) && Math.abs(value) <= 30 ? value : null;
}
