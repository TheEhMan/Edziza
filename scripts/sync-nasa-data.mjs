// Optional one-time local NASA asset download for offline demos and static builds.
// Run: npm run fetch:nasa
// Data comes from NASA SVS / LRO, not a third-party or manually invented raster.
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { WORLD_SITES } from '../src/siteData.js';
import { NASA_LRO_BASE, sampleLolaSites } from '../src/nasaRaster.js';

const dir = new URL('../public/nasa-data/', import.meta.url);
await mkdir(dir, { recursive: true });

async function download(url, file, minimumBytes) {
  try {
    const existing = await stat(new URL(file, dir));
    if (existing.size >= minimumBytes) {
      console.log(`Using cached NASA file: ${file} (${existing.size} bytes)`);
      return readFile(new URL(file, dir));
    }
  } catch { /* first-time download */ }
  console.log(`Downloading from NASA: ${url}`);
  const response = await fetch(url, { signal: AbortSignal.timeout(90_000) });
  if (!response.ok) throw new Error(`NASA returned HTTP ${response.status} for ${file}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < minimumBytes) throw new Error(`${file} is shorter than a valid NASA dataset`);
  await writeFile(new URL(file, dir), bytes);
  return bytes;
}

try {
  const color = await download(`${NASA_LRO_BASE}/lroc_color_2k.jpg`, 'lroc_color_2k.jpg', 50_000);
  if (color[0] !== 0xff || color[1] !== 0xd8) throw new Error('NASA lunar image is not a JPEG');
  const dem = await download(`${NASA_LRO_BASE}/ldem_4.tif`, 'ldem_4.tif', 1_000_000);
  const result = await sampleLolaSites(dem, WORLD_SITES.moon);
  await writeFile(new URL('moon-lola-sites.json', dir), JSON.stringify(result, null, 2) + '\n');
  console.log('Verified NASA LRO/LOLA site elevations:', Object.entries(result.sites)
    .map(([id, item]) => `${id}=${item.elevationMetres} m`).join(', '));
  console.log('Local assets are now available in public/nasa-data/.');
} catch (error) {
  console.error(`NASA download/validation failed: ${error.message}`);
  console.error('Check internet access and rerun npm run fetch:nasa. No elevation values were invented.');
  process.exitCode = 1;
}
