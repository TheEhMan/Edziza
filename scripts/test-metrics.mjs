import assert from 'node:assert/strict';
import { terrainMetrics, matchScore, gridCoordinates } from './terrain-metrics.mjs';

const flat = Array.from({ length: 21 }, () => Array(21).fill(100));
const a = terrainMetrics(flat, 600);
assert.equal(a.meanSlopeDegrees, 0);
assert.equal(a.rmsRoughnessMetres, 0);
assert.equal(a.elevationVariationMetres, 0);
assert.equal(matchScore(a, a).total, 100);

const ramp = Array.from({ length: 21 }, (_, r) => Array.from({ length: 21 }, (_, c) => 100 + c * 60 + r * 30));
const b = terrainMetrics(ramp, 600);
assert.ok(Math.abs(b.meanSlopeDegrees - Math.atan(Math.hypot(60, 30) / 600) * 180 / Math.PI) < 1e-9);
assert.ok(b.rmsRoughnessMetres < 1e-9);
assert.ok(b.elevationVariationMetres > 0);
assert.ok(matchScore(a, b).total < 100);

const g = gridCoordinates({ lat: 32.4, lon: 148.9 }, 21, 600, 3396190);
assert.equal(g.length, 21);
assert.ok(Math.abs(g[10][10].lat - 32.4) < 1e-10);
assert.ok(g[0][0].lat > g[20][20].lat);
console.log('Terrain metrics self-tests passed.');
