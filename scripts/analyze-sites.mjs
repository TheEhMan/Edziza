/**
 * Project EDZIZA - reproducible regional terrain analysis.
 *
 * Usage (from the React project root):
 *   npm install geotiff@^2
 *   node scripts/analyze-sites.mjs
 *
 * Optional local-data fallbacks:
 *   node scripts/analyze-sites.mjs --earth C:\\path\\N57W131.tif --mars C:\\path\\megt44n090hb.img
 *
 * Writes: public/analysis-results.json
 *
 * No invented measurements: throws on missing files, missing valid cells,
 * unsupported Mars byte-range responses, or failed downloads.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import {
  gridCoordinates, terrainMetrics, matchScore, squareFootprint, SCORING
} from './terrain-metrics.mjs';

const GRID_COUNT = 21;
const CELL_M = 600;
const FOOTPRINT_KM = (GRID_COUNT - 1) * CELL_M / 1000;
const EARTH_RADIUS_M = 6371008.8;
const MARS_RADIUS_M = 3396190;
const NATIVE_MOLA_PPD = 128;
const MOLA_WIDTH = 90 * NATIVE_MOLA_PPD; // 11520 columns
const MOLA_HEIGHT = 44 * NATIVE_MOLA_PPD; // 5632 rows
const MOLA_BYTES = MOLA_WIDTH * MOLA_HEIGHT * 2;
const MARS_URL = 'https://pds-geosciences.wustl.edu/mgs/urn-nasa-pds-mgs_mola_topography_derived/meg128/megt44n090hb.img';

const CANDIDATES = [
  {
    id: 'snowshoe', name: 'Snowshoe Lava Field', center: { lat: 57.650000, lon: -130.666667 },
    geology: 'Young basaltic lava fields and cones; lava-ice interactions documented regionally.',
    evidence: 'https://science.nasa.gov/earth/earth-observatory/snowshoe-lava-field-152269/'
  },
  {
    id: 'summit', name: 'Mount Edziza summit area', center: { lat: 57.720000, lon: -130.630000 },
    geology: 'Glaciated composite volcano with varied volcanic materials.',
    evidence: 'https://bcparks.ca/mount-edziza-park/'
  },
  {
    id: 'desolation', name: 'Desolation Lava Field', center: { lat: 57.816667, lon: -130.616667 },
    geology: 'Northern basaltic lava field and pyroclastic cones.',
    evidence: 'https://volcano.si.edu/volcano.cfm?vn=320060'
  }
];

// A selected screening patch within the lower NW flank studied in published
// geomorphology research. Exact patch suitability must be checked in imagery.
// The published NW-flank study extent includes lat 31.8 to 33.08 and lon 148.37 to 149.38.
const MARS_TARGET = {
  id: 'hecates-nw', name: 'Hecates Tholus, lower NW flank',
  center: { lat: 32.40, lon: 148.90 },
  evidence: 'https://portalcientifico.uah.es/documentos/5d1df63f29995204f7665df7'
};

function argValue(flag) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : null;
}

const earthFile = argValue('--earth');
const marsFile = argValue('--mars');

function rounded(metrics) {
  return Object.fromEntries(Object.entries(metrics).map(([k, v]) => [k,
    typeof v === 'number' ? Number(v.toFixed(3)) : v
  ]));
}

function lonLatToPixel(image, coords) {
  const origin = image.getOrigin();
  const resolution = image.getResolution();
  if (!resolution[0] || !resolution[1]) throw new Error('Earth DEM has invalid georeferencing.');
  return coords.map(row => row.map(({ lat, lon }) => ({
    x: (lon - origin[0]) / resolution[0],
    y: (lat - origin[1]) / resolution[1]
  })));
}

function bilinear(getValue, x, y) {
  const x0 = Math.floor(x), y0 = Math.floor(y);
  const wx = x - x0, wy = y - y0;
  const values = [getValue(x0, y0), getValue(x0 + 1, y0),
    getValue(x0, y0 + 1), getValue(x0 + 1, y0 + 1)];
  if (values.some(v => !Number.isFinite(v) || Math.abs(v) > 20000)) return null;
  const top = values[0] * (1 - wx) + values[1] * wx;
  const bottom = values[2] * (1 - wx) + values[3] * wx;
  return top * (1 - wy) + bottom * wy;
}

function copernicusUrl(resolution) {
  const arcseconds = resolution === 30 ? '10' : '30';
  const bucket = resolution === 30 ? 'copernicus-dem-30m' : 'copernicus-dem-90m';
  const name = `Copernicus_DSM_COG_${arcseconds}_N57_00_W131_00_DEM`;
  return `https://${bucket}.s3.amazonaws.com/${name}/${name}.tif`;
}

async function openEarthImage() {
  // geotiff.js is a pure JavaScript reader, avoiding native Python GIS packages.
  const { fromUrl, fromFile } = await import('geotiff');
  if (earthFile) {
    console.log('Reading local Copernicus GeoTIFF:', earthFile);
    const image = await (await fromFile(path.resolve(earthFile))).getImage();
    return { image, sourceURL: `local:${path.basename(earthFile)}`, resolution: 'user provided' };
  }
  let firstError;
  for (const resolution of [30, 90]) {
    const url = copernicusUrl(resolution);
    try {
      console.log(`Opening Copernicus GLO-${resolution} Earth DEM (cloud-optimized):`, url);
      const image = await (await fromUrl(url)).getImage();
      // A missing tile typically fails when the image metadata is requested.
      const bounds = image.getBoundingBox();
      if (bounds[0] > -130.95 || bounds[2] < -130.4 || bounds[1] > 57.5 || bounds[3] < 57.95) {
        throw new Error('Retrieved Earth DEM does not cover the study area.');
      }
      return { image, sourceURL: url, resolution: `GLO-${resolution}` };
    } catch (error) {
      firstError ||= error;
      console.warn(`GLO-${resolution} could not be opened: ${error.message}`);
    }
  }
  throw new Error('Unable to open public Copernicus DEM from AWS. You can download the N57 W131 GeoTIFF manually and pass --earth path\\to\\file.tif. First error: ' + firstError?.message);
}

async function earthGrid(image, center) {
  const coords = gridCoordinates(center, GRID_COUNT, CELL_M, EARTH_RADIUS_M);
  const positions = lonLatToPixel(image, coords);
  const all = positions.flat();
  const left = Math.max(0, Math.floor(Math.min(...all.map(p => p.x))) - 2);
  const right = Math.min(image.getWidth(), Math.ceil(Math.max(...all.map(p => p.x))) + 3);
  const top = Math.max(0, Math.floor(Math.min(...all.map(p => p.y))) - 2);
  const bottom = Math.min(image.getHeight(), Math.ceil(Math.max(...all.map(p => p.y))) + 3);
  const width = right - left;
  const height = bottom - top;
  if (width < GRID_COUNT || height < GRID_COUNT) throw new Error('Earth DEM window is too small or outside the tile.');
  const raster = await image.readRasters({ window: [left, top, right, bottom], samples: [0], interleave: true });
  const nodata = image.getGDALNoData();
  const read = (x, y) => {
    if (x < left || x >= right || y < top || y >= bottom) return NaN;
    const val = raster[(y - top) * width + (x - left)];
    if (nodata !== null && nodata !== undefined && val === nodata) return NaN;
    return val;
  };
  return positions.map(row => row.map(p => bilinear(read, p.x, p.y)));
}

function molaPixel({ lat, lon }) {
  // Product: 44 N to 0 N, 90 E to 180 E, 128 pixels/degree.
  // Pixel centers are half a pixel inside the nominal tile boundary.
  return {
    x: (lon - 90) * NATIVE_MOLA_PPD - 0.5,
    y: (44 - lat) * NATIVE_MOLA_PPD - 0.5
  };
}

async function readMarsRows(minRow, maxRow) {
  if (minRow < 0 || maxRow >= MOLA_HEIGHT) throw new Error('Mars study patch lies outside the NASA MOLA tile.');
  const start = minRow * MOLA_WIDTH * 2;
  const length = (maxRow - minRow + 1) * MOLA_WIDTH * 2;
  if (marsFile) {
    const handle = await fs.open(path.resolve(marsFile), 'r');
    try {
      const stat = await handle.stat();
      if (stat.size !== MOLA_BYTES) throw new Error(`Local NASA MOLA file size was ${stat.size}; expected ${MOLA_BYTES} bytes.`);
      const buffer = Buffer.alloc(length);
      let cursor = 0;
      while (cursor < length) {
        const result = await handle.read(buffer, cursor, length - cursor, start + cursor);
        if (result.bytesRead === 0) throw new Error('Unexpected end of NASA MOLA file.');
        cursor += result.bytesRead;
      }
      return buffer;
    } finally { await handle.close(); }
  }
  console.log(`Requesting only ${(length / 1024 / 1024).toFixed(2)} MiB from NASA's 128-ppd MOLA image using HTTP Range...`);
  const end = start + length - 1;
  const response = await fetch(MARS_URL, { headers: { Range: `bytes=${start}-${end}` } });
  if (response.status === 206) {
    const range = response.headers.get('content-range') || '';
    if (!range.startsWith(`bytes ${start}-${end}/`)) throw new Error('NASA server returned a mismatched Content-Range.');
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length !== length) throw new Error('NASA MOLA byte range length is incorrect.');
    return buffer;
  }
  if (response.status === 200) {
    console.warn('NASA server ignored HTTP Range. Reading its entire 130 MB image before extracting rows.');
    const file = Buffer.from(await response.arrayBuffer());
    if (file.length !== MOLA_BYTES) throw new Error('Full NASA MOLA download has an unexpected size.');
    return file.subarray(start, end + 1);
  }
  throw new Error(`NASA MOLA server returned HTTP ${response.status}. Try downloading the source IMG and using --mars local-file-path.`);
}

async function marsGrid(center) {
  const coords = gridCoordinates(center, GRID_COUNT, CELL_M, MARS_RADIUS_M);
  const positions = coords.map(row => row.map(molaPixel));
  const all = positions.flat();
  const minRow = Math.max(0, Math.floor(Math.min(...all.map(p => p.y))) - 2);
  const maxRow = Math.min(MOLA_HEIGHT - 1, Math.ceil(Math.max(...all.map(p => p.y))) + 2);
  const bytes = await readMarsRows(minRow, maxRow);
  const get = (x, y) => {
    if (y < minRow || y > maxRow || x < 0 || x >= MOLA_WIDTH) return NaN;
    const offset = ((y - minRow) * MOLA_WIDTH + x) * 2;
    const z = bytes.readInt16BE(offset);
    return z === -32768 ? NaN : z;
  };
  return positions.map(row => row.map(p => bilinear(get, p.x, p.y)));
}

function compare(earthMetrics, targetMetrics) {
  const raw = matchScore(earthMetrics, targetMetrics);
  return {
    score: Number(raw.total.toFixed(1)),
    components: Object.fromEntries(Object.entries(raw.components).map(([k, v]) => [k, Number(v.toFixed(1))]))
  };
}

async function main() {
  const { image, sourceURL, resolution } = await openEarthImage();
  console.log('Reading high-resolution NASA Mars reference region...');
  const marsHeights = await marsGrid(MARS_TARGET.center);
  const marsMetrics = terrainMetrics(marsHeights, CELL_M);
  console.log('Mars patch metrics:', rounded(marsMetrics));
  const candidates = [];
  for (const site of CANDIDATES) {
    console.log('Analyzing Earth study region:', site.name);
    const heights = await earthGrid(image, site.center);
    const metrics = terrainMetrics(heights, CELL_M);
    const comparison = compare(metrics, marsMetrics);
    candidates.push({ ...site, footprint: squareFootprint(site.center, FOOTPRINT_KM),
      metrics: rounded(metrics), ...comparison });
    console.log(`  Terrain match: ${comparison.score}/100`);
  }
  candidates.sort((a, b) => b.score - a.score);
  candidates.forEach((item, i) => { item.rank = i + 1; });

  const result = {
    generatedAt: new Date().toISOString(),
    project: 'Project EDZIZA',
    mission: 'Regional screening for a volcanic-terrain robotic field test',
    isMeasured: true,
    disclaimer: 'Relative terrain-match screening, NOT a validated rover navigability or landing-safety score. Geology and ice evidence are reviewed separately.',
    methods: {
      squareWidthKm: FOOTPRINT_KM,
      sampleSpacingMetres: CELL_M,
      grid: `${GRID_COUNT}x${GRID_COUNT}`,
      metrics: {
        meanSlopeDegrees: 'Mean arctangent of the central finite-difference elevation gradient',
        p90SlopeDegrees: '90th percentile of local slope values in degrees',
        rmsRoughnessMetres: 'RMS elevation residual from a centered 3x3 local mean on the common grid',
        elevationVariationMetres: '95th minus 5th percentile elevation (metres) in the patch'
      },
      scoring: SCORING,
      caveats: [
        'MOLA 128-ppd grid spacing is about 463 m north-south and about 392 m east-west at 32 degrees N, but underlying laser observations can be sparse and gridded gaps are interpolated; these cells do not guarantee 463-m measured detail.',
        'Earth source is Copernicus DSM (surface model) rather than bare-earth survey and may contain snow, vegetation, or data editing artifacts.',
        'Both grids are sampled at 600 metres; source resolutions and effective smoothing still differ.',
        'Ice evidence and rock composition are not computed from DEMs and do not enter this numerical score.',
        'Coordinates represent proposed study patches, NOT pre-validated landable or accessible sites. Snowshoe and summit patches partly overlap.',
        'Terrain-match scores depend on chosen tolerances and mission objectives.'
      ]
    },
    sources: {
      earthDEM: sourceURL, earthProduct: resolution,
      marsDEM: marsFile ? `local:${path.basename(marsFile)}` : MARS_URL,
      marsPPD: NATIVE_MOLA_PPD,
      earthGeology: 'https://volcano.si.edu/volcano.cfm?vn=320060',
      marsGeology: MARS_TARGET.evidence
    },
    mars: { ...MARS_TARGET, metrics: rounded(marsMetrics),
      footprint: squareFootprint(MARS_TARGET.center, FOOTPRINT_KM, (2 * Math.PI * MARS_RADIUS_M) / 360) },
    candidates
  };
  const output = path.resolve('public', 'analysis-results.json');
  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.writeFile(output, JSON.stringify(result, null, 2));
  console.log(`SUCCESS: ${output}`);
  console.log(`Best terrain match among tested sites: ${candidates[0].name} (${candidates[0].score}/100).`);
}

main().catch(error => {
  console.error('\nANALYSIS FAILED:', error.stack || error.message);
  console.error('No analysis-results.json was written. Check the source URL, local network, and download permissions.');
  process.exitCode = 1;
});
