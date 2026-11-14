// Optional official NASA asset cache for robust offline demos.
// Run: npm run fetch:global
// MOLA PDS binary (1440x720 signed BE int16) + 8x4 NASA Viking Trek tiles.
// No fabricated elevation cells or textures are emitted if downloads fail.
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { MARS_DEM_BYTES, MARS_GLOBAL_MOLA_SOURCE, MARS_VIKING_TILES } from '../src/marsGlobalData.js';

const root = new URL('../public/nasa-data/', import.meta.url);
const cache = async (url, relative, minBytes, exactBytes=null) => {
  const path = new URL(relative, root);
  await mkdir(new URL('./', path), { recursive: true });
  try {
    const info = await stat(path);
    if (info.size >= minBytes && (!exactBytes || info.size === exactBytes)) return readFile(path);
  } catch { /* fetch */ }
  const response = await fetch(url, { signal: AbortSignal.timeout(45_000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length < minBytes || (exactBytes && buffer.length !== exactBytes)) throw new Error(`Invalid NASA dataset length: ${url} (${buffer.length})`);
  await writeFile(path, buffer);
  return buffer;
};
const issues = [];
try {
  await cache(MARS_GLOBAL_MOLA_SOURCE, 'mars-megt90n000cb.img', MARS_DEM_BYTES, MARS_DEM_BYTES);
  console.log('NASA global MOLA MEGDR cached: 1440x720 pixels at 4 pixels/degree.');
} catch (error) { issues.push(`MOLA: ${error.message}`); }
const level = 2, columns = 8, rows = 4;
const tiles = Array.from({length: columns*rows}, (_, i) => ({x:i%columns, y:Math.floor(i/columns)}));
let index = 0, count = 0;
const worker = async () => {
  while (index < tiles.length) {
    const {x, y} = tiles[index++];
    const suffix = `/${level}/${y}/${x}.jpg`;
    try {
      const bytes = await cache(`${MARS_VIKING_TILES}${suffix}`, `mars-global-tiles${suffix}`, 300);
      if (bytes[0] !== 0xff || bytes[1] !== 0xd8) throw new Error('Not a JPEG');
      count++;
    } catch (e) { issues.push(`Tile ${level}/${y}/${x}: ${e.message}`); }
  }
};
await Promise.all(Array.from({ length: 5 }, worker));
if (count === tiles.length) await writeFile(new URL('mars-global-tiles/manifest.json', root), JSON.stringify({level, columns, rows, source: MARS_VIKING_TILES, tiles:count},null,2));
console.log(`NASA Mars Viking tiles cached: ${count}/${tiles.length}`);
if (issues.length) { console.error(issues.slice(0, 8).join('\n')); process.exitCode = 1; }
