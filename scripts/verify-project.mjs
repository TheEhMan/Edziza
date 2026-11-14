import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { WORLD_SITES, WORLD_ORDER, DEFAULT_SITES } from '../src/siteData.js';
import { PARAMETERS } from '../src/parameters.js';

assert.equal(WORLD_ORDER.length, 3, 'Exactly three worlds must be available');
assert.deepEqual(WORLD_ORDER, ['earth', 'mars', 'moon']);
for (const world of WORLD_ORDER) {
  const sites = Object.values(WORLD_SITES[world]);
  assert.equal(sites.length, world === 'earth' ? 8 : 3, `Unexpected location count on ${world}`);
  assert.ok(WORLD_SITES[world][DEFAULT_SITES[world]], `Default location is missing for ${world}`);
  for (const site of sites) {
    assert.ok(Number.isFinite(site.lat) && site.lat >= -90 && site.lat <= 90, `${site.id}: invalid latitude`);
    assert.ok(Number.isFinite(site.lon) && site.lon >= -180 && site.lon <= 180, `${site.id}: invalid longitude`);
    assert.ok(site.label && site.terrain && site.ice && site.evidence, `${site.id}: missing site context`);
  }
}
assert.equal(PARAMETERS.length, 12, 'Exactly twelve parameters must be available');
assert.equal(new Set(PARAMETERS.map(item => item.id)).size, 12, 'Parameter ids must be unique');

const parser = (await import('@babel/parser')).parse;
const files = readdirSync(new URL('../src/', import.meta.url)).filter(file => /\.(jsx|js)$/.test(file));
for (const file of files) {
  const code = readFileSync(new URL('../src/' + file, import.meta.url), 'utf8');
  parser(code, { sourceType: 'module', plugins: ['jsx'] });
}
console.log(`Verification passed: ${WORLD_ORDER.length} worlds, 14 sites (8 Earth / 3 Mars / 3 Moon), legacy 12 raw parameters, ${files.length} parsed frontend modules.`);
