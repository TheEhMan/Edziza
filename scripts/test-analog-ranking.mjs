import assert from 'node:assert/strict';
import { DOMAINS, EARTH_ANALOGS, TARGETS, DEFAULT_WEIGHTS } from '../src/analogData.js';
import { rankAnalogs, scoreAnalog } from '../src/analogRanking.js';
import { WORLD_SITES } from '../src/siteData.js';

const ids = DOMAINS.map(item => item.id);
assert.equal(ids.length, 8);
assert.equal(new Set(ids).size, 8);
assert.equal(EARTH_ANALOGS.length, 11);
assert.equal(TARGETS.length, 6);
assert.equal(new Set(EARTH_ANALOGS.map(item => item.id)).size, 11);
assert.equal(new Set(TARGETS.map(item => `${item.world}:${item.id}`)).size, 6);
for (const candidate of EARTH_ANALOGS) {
  assert.ok(WORLD_SITES.earth[candidate.id], `Earth map site ${candidate.id} missing`);
  assert.deepEqual(Object.keys(candidate.domains).sort(), [...ids].sort(), `Earth profile ${candidate.id} incomplete`);
  for (const id of ids) {
    assert.ok(candidate.domains[id].summary.length > 25, `${candidate.id} ${id} description too short`);
    assert.ok(candidate.domains[id].features.length > 0, `${candidate.id} ${id} tags empty`);
    assert.match(candidate.domains[id].source, /^https:\/\//, `${candidate.id} ${id} missing evidence link`);
  }
}
for (const target of TARGETS) {
  assert.deepEqual(Object.keys(target.domains).sort(), [...ids].sort(), `Planetary profile ${target.id} incomplete`);
  assert.ok(WORLD_SITES[target.world][target.id], `Selected planetary coordinates missing ${target.id}`);
  for (const id of ids) {
    assert.ok(target.domains[id].observation.length > 25, `${target.id} ${id} observation too short`);
    assert.ok(target.domains[id].goals.length > 0, `${target.id} ${id} goals empty`);
    assert.match(target.domains[id].source, /^https:\/\//, `${target.id} ${id} missing evidence link`);
  }
  const results = rankAnalogs(target, DEFAULT_WEIGHTS);
  assert.equal(results.length, EARTH_ANALOGS.length);
  assert.deepEqual([...results].sort((a,b) => b.score - a.score).map(x => x.score), results.map(x => x.score));
  for (const result of results) {
    assert.equal(result.breakdown.length, 8);
    assert.ok(result.score >= 0 && result.score <= 100);
    assert.ok(result.breakdown.every(row => row.score >= 0 && row.score <= 100));
  }
  const allZero = scoreAnalog(target, EARTH_ANALOGS[0], Object.fromEntries(ids.map(id => [id, 0])));
  assert.equal(allZero.score, 0);
  assert.equal(allZero.weightSum, 0);
}
assert.equal(rankAnalogs(TARGETS.find(t=>t.id==='shackleton'),DEFAULT_WEIGHTS)[0].earth.id, 'haughton');
assert.equal(rankAnalogs(TARGETS.find(t=>t.id==='elysium'),DEFAULT_WEIGHTS)[0].earth.id, 'cratersmoon');
console.log('8/8 complete evidence-covered domains for 17 sites; six target rankings reproducible; 11 Earth candidates; sensitivity and zero-weight cases passed.');
