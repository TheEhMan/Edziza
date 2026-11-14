// Derive the three Mars site elevations from the NASA MOLA MEGDR grid already
// bundled with CyberLeek. No elevations are authored by hand.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { WORLD_SITES } from '../src/siteData.js';

const path = new URL('../public/mars-wide-elevation.json', import.meta.url);
const dataset = JSON.parse(await readFile(path, 'utf8'));
const { bounds, heights } = dataset;
if (!Array.isArray(heights) || heights.length < 2 || !Array.isArray(heights[0])) {
  throw new Error('Missing valid NASA MOLA height grid');
}
const rows = heights.length;
const cols = heights[0].length;
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const sites = {};
for (const location of Object.values(WORLD_SITES.mars)) {
  if (location.lat > bounds.north || location.lat < bounds.south || location.lon < bounds.west || location.lon > bounds.east) {
    throw new Error(`MOLA map does not contain ${location.id}`);
  }
  const x = clamp((location.lon - bounds.west) / (bounds.east - bounds.west) * (cols - 1), 0, cols - 1);
  const y = clamp((bounds.north - location.lat) / (bounds.north - bounds.south) * (rows - 1), 0, rows - 1);
  const col = Math.min(Math.floor(x), cols - 2);
  const row = Math.min(Math.floor(y), rows - 2);
  const dx = x - col;
  const dy = y - row;
  const a = heights[row][col] * (1 - dx) + heights[row][col + 1] * dx;
  const b = heights[row + 1][col] * (1 - dx) + heights[row + 1][col + 1] * dx;
  const metres = a * (1 - dy) + b * dy;
  if (!Number.isFinite(metres)) throw new Error(`MOLA missing value at ${location.id}`);
  sites[location.id] = { lat: location.lat, lon: location.lon, elevationMetres: Math.round(metres) };
}
const output = {
  instrument: 'NASA Mars Global Surveyor - Mars Orbiter Laser Altimeter (MOLA)',
  sourceUrl: dataset.sourceURL,
  sourcePage: 'https://pds-geosciences.wustl.edu/missions/mgs/megdr.html',
  reference: 'Elevation relative to the Mars areoid / MOLA topography reference',
  resolution: `${dataset.displayedPixelsPerDegree} pixels per degree (approximately 3-4 km north-south grid spacing)`,
  method: 'Bilinear interpolation of four adjacent MOLA DEM grid cells at each site coordinate',
  precision: 'Regional orbital DEM estimate, not a point altimeter reading or landing-site hazard measurement',
  sites
};
const outPath = new URL('../public/nasa-data/mars-mola-sites.json', import.meta.url);
await mkdir(new URL('../public/nasa-data/', import.meta.url), { recursive: true });
await writeFile(outPath, JSON.stringify(output, null, 2) + '\n');
console.log('Wrote NASA MOLA site elevations:', Object.entries(sites).map(([key, value]) => `${key}=${value.elevationMetres} m`).join(', '));
