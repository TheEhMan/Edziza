/**
 * Project EDZIZA: Download a wider NASA MOLA topography patch and NASA Viking
 * Orbiter color mosaic tiles. Run with Node 20+ from the project root:
 *
 *   node scripts/fetch-mars-wide.mjs
 *
 * Outputs live in public/ and require no extra npm packages.
 * All files are only created after successful network downloads.
 */
import fs from 'node:fs/promises';
import path from 'node:path';

const PUBLIC = path.resolve('public');
const DEM_URL = 'https://pds-geosciences.wustl.edu/mgs/urn-nasa-pds-mgs_mola_topography_derived/meg016/megt90n000eb.img';
const WMTS = 'https://trek.nasa.gov/tiles/Mars/EQ/Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0/default/default028mm';
const BOUNDS = { west: 139, east: 165, north: 43, south: 17 };
const PPD = 16;
const TILE_ZOOM = 6; // NASA Viking imagery: ~650 m/pixel near the equator at this zoom.
const TIMEOUT_MS = 30000;
const MAX_RETRIES = 3;
const tileColumns = 2 ** (TILE_ZOOM + 1);
const tileRows = 2 ** TILE_ZOOM;

async function getWithRetry(url) {
  let lastError;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      lastError = error;
      console.warn(`  Attempt ${attempt}/${MAX_RETRIES} failed: ${url} — ${error.message}`);
    }
  }
  throw lastError;
}

async function downloadTerrain() {
  const outputFile = path.join(PUBLIC, 'mars-wide-elevation.json');
  try {
    const existing = JSON.parse(await fs.readFile(outputFile, 'utf8'));
    if (JSON.stringify(existing.bounds) === JSON.stringify(BOUNDS)
        && existing.heights?.length === (BOUNDS.north - BOUNDS.south) * PPD + 1
        && existing.heights[0]?.length === (BOUNDS.east - BOUNDS.west) * PPD + 1) {
      console.log('Using cached verified-width NASA MOLA crop:', path.relative(process.cwd(), outputFile));
      return;
    }
  } catch { /* first run, or an incomplete/corrupted cached file */ }
  const WIDTH = 360 * PPD;
  const HEIGHT = 180 * PPD;
  const expectedBytes = WIDTH * HEIGHT * 2;
  console.log('Downloading NASA MOLA 16 pixels/degree global topography (about 33 MB)...');
  const bytes = await getWithRetry(DEM_URL);
  if (bytes.length !== expectedBytes) {
    throw new Error(`MOLA file has ${bytes.length} bytes; expected ${expectedBytes}. Not writing unverified terrain data.`);
  }
  const firstRow = Math.round((90 - BOUNDS.north) * PPD);
  const lastRow = Math.round((90 - BOUNDS.south) * PPD);
  const firstCol = Math.round(BOUNDS.west * PPD);
  const lastCol = Math.round(BOUNDS.east * PPD);
  const heights = [];
  let min = Infinity, max = -Infinity;
  for (let row = firstRow; row <= lastRow; row++) {
    const sample = [];
    for (let col = firstCol; col <= lastCol; col++) {
      const h = bytes.readInt16BE((row * WIDTH + col) * 2);
      const z = h === -32768 ? null : h;
      sample.push(z);
      if (z !== null) { min = Math.min(min, z); max = Math.max(max, z); }
    }
    heights.push(sample);
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) throw new Error('MOLA crop contained no valid elevations.');
  const result = {
    region: 'Elysium volcanic province, Mars',
    source: 'NASA PDS / Mars Global Surveyor MOLA MEGDR 16 ppd',
    sourceURL: DEM_URL,
    bounds: BOUNDS,
    displayedPixelsPerDegree: PPD,
    minElevationMetres: min,
    maxElevationMetres: max,
    note: 'MOLA regional-scale relief (~3–4 km per sample); not suitable for rover navigation.',
    heights
  };
  await fs.writeFile(outputFile, JSON.stringify(result));
  console.log(`  Saved ${path.relative(process.cwd(), outputFile)} (${heights[0].length} × ${heights.length} samples).`);
}

function tileUrl(x, y) {
  return `${WMTS}/${TILE_ZOOM}/${y}/${x}.jpg`;
}

async function downloadImagery() {
  const westX = Math.floor((BOUNDS.west + 180) / 360 * tileColumns);
  const eastX = Math.ceil((BOUNDS.east + 180) / 360 * tileColumns) - 1;
  const northY = Math.floor((90 - BOUNDS.north) / 180 * tileRows);
  const southY = Math.ceil((90 - BOUNDS.south) / 180 * tileRows) - 1;
  const tiles = [];
  for (let y = northY; y <= southY; y++) {
    for (let x = westX; x <= eastX; x++) {
      tiles.push({ z: TILE_ZOOM, x, y, file: `/mars-tiles/${TILE_ZOOM}/${y}/${x}.jpg` });
    }
  }
  console.log(`Downloading ${tiles.length} NASA Viking Orbiter imagery tiles from Mars Trek...`);
  let cursor = 0;
  let failures = 0;
  const worker = async () => {
    while (cursor < tiles.length) {
      const tile = tiles[cursor++];
      const file = path.join(PUBLIC, tile.file.slice(1));
      await fs.mkdir(path.dirname(file), { recursive: true });
      try {
        let bytes;
        try { bytes = await fs.readFile(file); } catch { /* tile is not cached */ }
        if (!bytes || bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
          bytes = await getWithRetry(tileUrl(tile.x, tile.y));
          if (bytes.length < 100 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
            throw new Error('Not a valid JPEG image');
          }
          await fs.writeFile(file, bytes);
        }
      } catch (error) {
        failures++;
        tile.failed = true;
        console.warn(`  Could not load tile ${tile.x}/${tile.y}: ${error.message}`);
      }
    }
  };
  await Promise.all(Array.from({ length: 5 }, worker));
  const available = tiles.filter(t => !t.failed);
  if (!available.length) {
    throw new Error('NASA Mars Trek imagery could not be downloaded. Check your connection and rerun the script.');
  }
  const manifest = {
    layer: 'NASA Mars Trek / Viking MDIM 2.1 global color mosaic',
    sourceURL: 'https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=mars',
    tileTemplate: WMTS + '/{z}/{y}/{x}.jpg',
    bounds: BOUNDS,
    zoom: TILE_ZOOM,
    tileSize: 256,
    tileColumns,
    tileRows,
    complete: failures === 0,
    tiles: available
  };
  const filename = path.join(PUBLIC, 'mars-orbital-tiles.json');
  await fs.writeFile(filename, JSON.stringify(manifest, null, 2));
  console.log(`  Saved ${available.length}/${tiles.length} imagery tiles and ${path.relative(process.cwd(), filename)}.`);
  if (failures) console.warn(`  ${failures} tiles missing. Re-run this script to retry and complete the mosaic.`);
}

await fs.mkdir(PUBLIC, { recursive: true });
let failures = 0;
try { await downloadTerrain(); }
catch (error) { failures++; console.error('MOLA download failed:', error.message); }
try { await downloadImagery(); }
catch (error) { failures++; console.error('Satellite mosaic download failed:', error.message); }
if (failures) {
  console.error('At least one download did not finish. Re-run node scripts/fetch-mars-wide.mjs, then refresh the web page.');
  process.exitCode = 1;
} else console.log('Mars wide-view setup complete. Refresh http://localhost:5173/.');
