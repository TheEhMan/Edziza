// Cached NASA elevations for the three volcanic Mars sites and three Moon sites.
// Mars ships with derived MOLA samples; Moon first tries locally cached NASA LOLA
// samples, then downloads the NASA LOLA TIFF directly or through Vite's proxy.
import { WORLD_SITES } from './siteData.js';
import { NASA_LRO_BASE, NASA_LOLA_PATH, sampleLolaSites } from './nasaRaster.js';

const MOON_URLS = [
  '/nasa-data/ldem_4.tif',
  `/nasa-remote${NASA_LOLA_PATH}`,
  `${NASA_LRO_BASE}/ldem_4.tif`
];
let marsPromise;
let moonPromise;

async function getJson(url) {
  const response = await fetch(url, { cache: 'force-cache' });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const json = await response.json();
  if (!json?.sites || !json?.sourceUrl) throw new Error('Invalid cached NASA DEM JSON');
  return json;
}

export function getMarsElevations() {
  if (!marsPromise) marsPromise = getJson('/nasa-data/mars-mola-sites.json');
  return marsPromise;
}

export function getMoonElevations() {
  if (!moonPromise) moonPromise = (async () => {
    try { return await getJson('/nasa-data/moon-lola-sites.json'); }
    catch { /* NASA dataset has not yet been pre-downloaded */ }
    const failures = [];
    for (const url of MOON_URLS) {
      try {
        const response = await fetch(url, { cache: 'force-cache' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const mime = response.headers.get('content-type') || '';
        if (mime.includes('text/html')) throw new Error('Received HTML instead of NASA GeoTIFF');
        const bytes = await response.arrayBuffer();
        if (bytes.byteLength < 1_000_000) throw new Error('Truncated NASA LOLA DEM');
        return await sampleLolaSites(bytes, WORLD_SITES.moon);
      } catch (error) { failures.push(`${url}: ${error.message}`); }
    }
    throw new Error(`Could not load NASA LOLA source. ${failures.join(' | ')}`);
  })();
  return moonPromise;
}
