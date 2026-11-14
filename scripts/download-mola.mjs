import fs from 'node:fs/promises';
import path from 'node:path';

// Real NASA PDS MOLA elevation from the 16 pixels-per-degree global MEGDR.
// The full download is ~33 MB. The derived Hecates Tholus JSON is much smaller.
// Archive information: https://pds-geosciences.wustl.edu/missions/mgs/megdr.html
const URL = 'https://pds-geosciences.wustl.edu/mgs/urn-nasa-pds-mgs_mola_topography_derived/meg016/megt90n000eb.img';
const PPD = 16;
const WIDTH = 360 * PPD;
const HEIGHT = 180 * PPD;
const EXPECTED_BYTES = WIDTH * HEIGHT * 2;

console.log('Downloading MOLA 16-ppd global data (~33 MB) from NASA PDS...');
const response = await fetch(URL);
if (!response.ok) throw new Error(`NASA PDS returned HTTP ${response.status}`);
const buffer = Buffer.from(await response.arrayBuffer());
if (buffer.length !== EXPECTED_BYTES) {
  throw new Error(`Incorrect binary size: got ${buffer.length}; expected ${EXPECTED_BYTES}. Read the PDS label before decoding.`);
}

// Hecates Tholus: approximately 32.1 N, 150.2 E.
// This crop includes the summit and parts of the surrounding volcanic flanks.
const bounds = { west: 145, east: 155, north: 37, south: 27 };
const stride = 1; // ~3.7 km N/S, ~3.1 km E/W at this latitude
const northRow = Math.round((90 - bounds.north) * PPD);
const southRow = Math.round((90 - bounds.south) * PPD);
const westCol = Math.round(bounds.west * PPD);
const eastCol = Math.round(bounds.east * PPD);

const heights = [];
let min = Infinity;
let max = -Infinity;
for (let row = northRow; row <= southRow; row += stride) {
  const values = [];
  for (let col = westCol; col <= eastCol; col += stride) {
    const i = (row * WIDTH + col) * 2;
    const z = buffer.readInt16BE(i);
    const valid = z !== -32768;
    values.push(valid ? z : null);
    if (valid) { min = Math.min(min, z); max = Math.max(max, z); }
  }
  heights.push(values);
}

const result = {
  region: 'Hecates Tholus, Mars',
  source: 'NASA PDS / Mars Global Surveyor MOLA MEGDR',
  dataURL: URL,
  bounds,
  center: { lat: 32.1, lonEast: 150.2 },
  nativePixelsPerDegree: PPD,
  displayedPixelsPerDegree: PPD / stride,
  minElevationMetres: min,
  maxElevationMetres: max,
  note: 'Regional MOLA topography (~3-4 km pixel spacing); unsuitable for individual rover paths or boulder scale.',
  heights
};

const folder = path.resolve('public');
await fs.mkdir(folder, { recursive: true });
await fs.writeFile(path.join(folder, 'mars-elevation.json'), JSON.stringify(result));
console.log(`Saved public/mars-elevation.json (${heights.length} rows x ${heights[0].length} columns).`);
console.log(`MOLA elevation range in crop: ${min} to ${max} metres.`);
console.log('Refresh the browser to see measured Hecates Tholus topography.');
