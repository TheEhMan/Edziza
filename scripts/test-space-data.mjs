// No-network regression checks: protect against invented scientific values,
// wrong site coordinates, wrong zoom math, or accidental param-count changes.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { WORLD_SITES } from '../src/siteData.js';
import { PARAMETERS } from '../src/parameters.js';
import { atlasZoom } from '../src/moonZoomMath.js';
import { NASA_LOLA_PATH, NASA_LRO_COLOR_PATH, NASA_MOON_REFERENCE } from '../src/nasaRaster.js';

const data = JSON.parse(await readFile(new URL('../public/mars-wide-elevation.json', import.meta.url), 'utf8'));
const sitesData = JSON.parse(await readFile(new URL('../public/nasa-data/mars-mola-sites.json', import.meta.url), 'utf8'));
assert.match(sitesData.instrument, /NASA.*MOLA/);
assert.match(sitesData.sourceUrl, /^https:\/\//);
assert.equal(Object.keys(sitesData.sites).length, 3);
for (const site of Object.values(WORLD_SITES.mars)) {
  const sample = sitesData.sites[site.id];
  assert.ok(sample, `${site.id} does not have a MOLA sample`);
  assert.equal(sample.lat, site.lat);
  assert.equal(sample.lon, site.lon);
  assert.ok(Number.isInteger(sample.elevationMetres));
  const { west, east, north, south } = data.bounds;
  const heights = data.heights;
  const fx = (site.lon - west) / (east - west) * (heights[0].length - 1);
  const fy = (north - site.lat) / (north - south) * (heights.length - 1);
  const x = Math.floor(fx), y = Math.floor(fy);
  const a = heights[y][x] + (heights[y][x + 1] - heights[y][x]) * (fx - x);
  const b = heights[y + 1][x] + (heights[y + 1][x + 1] - heights[y + 1][x]) * (fx - x);
  const expected = Math.round(a + (b - a) * (fy - y));
  assert.equal(sample.elevationMetres, expected, `${site.id} MOLA value must be computed from actual raster cells`);
}
assert.equal(PARAMETERS.length, 12);
assert.ok(PARAMETERS.some(item => item.id === 'elevation'));
assert.ok(!PARAMETERS.some(item => item.id === 'orbitalSolar'));
assert.equal(Object.keys(WORLD_SITES.moon).length, 3);
assert.match(NASA_LOLA_PATH, /ldem_4\.tif/);
assert.match(NASA_LRO_COLOR_PATH, /lroc_color_2k\.jpg/);
assert.equal(NASA_MOON_REFERENCE, 'https://svs.gsfc.nasa.gov/4720/');
assert.deepEqual(atlasZoom({zoom:1,x:0,y:0},2,100,-20),{zoom:2,x:-100,y:20});
assert.equal(atlasZoom({zoom:12,x:100,y:40},3).zoom,12);
assert.equal(atlasZoom({zoom:1,x:3,y:4},0.1).zoom,1);
const scene = await readFile(new URL('../src/MoonScene.jsx', import.meta.url), 'utf8');
for (const behavior of ['onPointerMove','touch-action','enableZoom','zoomGlobe','addEventListener(\'wheel\'','ZoomButtons','Reference image (low res)','projectToReferenceDisk']) {
  assert.ok(scene.includes(behavior) || (behavior === 'touch-action' && (await readFile(new URL('../src/moon.css', import.meta.url), 'utf8')).includes(behavior)), `Missing Moon zoom behavior: ${behavior}`);
}
console.log('NASA data test passed: 3 MOLA DEM site heights verified against raster, 3 lunar sites, 12 parameters, Moon zoom math and controls.');

assert.match(await readFile(new URL('../src/MoonScene.jsx', import.meta.url), 'utf8'), /moon-topography-reference\.jpg/);
