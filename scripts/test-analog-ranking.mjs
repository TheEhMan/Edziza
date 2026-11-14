import assert from 'node:assert/strict';
import { DOMAINS, EARTH_ANALOGS, TARGETS, DEFAULT_WEIGHTS } from '../src/analogData.js';
import { rankAnalogs, scoreAnalog } from '../src/analogRanking.js';
import { WORLD_SITES } from '../src/siteData.js';
import { PLANET_FACTS, numericScienceContext } from '../src/scienceFacts.js';

const ids = DOMAINS.map(domain => domain.id);
assert.equal(ids.length, 8);
assert.equal(new Set(ids).size, 8);
assert.equal(EARTH_ANALOGS.length, 8);
assert.equal(TARGETS.length, 6);
assert.equal(new Set(EARTH_ANALOGS.map(site => site.id)).size, 8);
for (const site of EARTH_ANALOGS) {
  assert.ok(WORLD_SITES.earth[site.id], `${site.id} Earth site missing on map`);
  assert.doesNotMatch(`${site.id} ${site.name} ${site.region}`, /snowshoe|desolation/i);
  assert.deepEqual(Object.keys(site.domains).sort(), [...ids].sort());
  for (const domain of ids) {
    assert.ok(site.domains[domain].summary.length >= 25);
    assert.ok(site.domains[domain].features.length > 0);
    assert.match(site.domains[domain].source, /^https:\/\//);
  }
}
for (const target of TARGETS) {
  assert.deepEqual(Object.keys(target.domains).sort(), [...ids].sort());
  assert.ok(WORLD_SITES[target.world][target.id]);
  const ranked = rankAnalogs(target, DEFAULT_WEIGHTS);
  assert.equal(ranked.length, EARTH_ANALOGS.length);
  assert.deepEqual([...ranked].sort((a,b) => b.score - a.score).map(a=>a.score), ranked.map(a=>a.score));
  for (const item of ranked) {
    assert.ok(item.score >= 0 && item.score <= 100);
    assert.equal(item.breakdown.length, 8);
    for (const row of item.breakdown) {
      assert.ok(row.score >= 0 && row.score <= 100);
      assert.ok(row.matchedCount <= row.targetCount);
      assert.equal(row.matchedCount + row.unmet.length, row.targetCount);
      assert.ok(Math.abs(row.score - Math.round((.7*row.recall/100+.3*row.precision/100)*row.transfer*1000)/10) <= 0.11, 'Rounded display percentages differ by at most 0.1 points');
      assert.match(row.target.source, /^https:\/\//);
    }
  }
  const noWeights = scoreAnalog(target, EARTH_ANALOGS[0], Object.fromEntries(ids.map(id=>[id,0])));
  assert.equal(noWeights.score,0);
}
assert.equal(rankAnalogs(TARGETS.find(x=>x.id==='shackleton'),DEFAULT_WEIGHTS)[0].earth.id,'haughton');
assert.equal(rankAnalogs(TARGETS.find(x=>x.id==='elysium'),DEFAULT_WEIGHTS)[0].earth.id,'cratersmoon');
const ref = TARGETS.find(x => x.id === 'apollo11');
const equator = rankAnalogs(ref, DEFAULT_WEIGHTS, EARTH_ANALOGS, {lat:0,lon:0,distanceKm:1000});
const middle = rankAnalogs(ref, DEFAULT_WEIGHTS, EARTH_ANALOGS, {lat:40,lon:0,distanceKm:1000});
const polar = rankAnalogs(ref, DEFAULT_WEIGHTS, EARTH_ANALOGS, {lat:85,lon:0,distanceKm:1000});
assert.notEqual(equator[0].earth.id, middle[0].earth.id, 'Actual clicked latitude must change Earth recommendation');
assert.notEqual(middle[0].earth.id, polar[0].earth.id, 'Different geographic regimes must alter order');
for (const item of equator) {
  const second = scoreAnalog(ref,item.earth,DEFAULT_WEIGHTS,{lat:0,lon:0,distanceKm:2500});
  assert.equal(second.score,item.score,'Clicked distance cannot uniformly shrink every score');
  assert.equal(second.proximity.status,'unsupported');
}
assert.equal(PLANET_FACTS.moon.gravity,1.62);
assert.equal(PLANET_FACTS.mars.gravity,3.73);
const metrics = numericScienceContext('operations','moon',null,EARTH_ANALOGS[0],null);
assert.equal(metrics[0].value,'1.62 / 9.80');
console.log('CyberLeek checks passed: 8 non-local Earth analogs, 6 target profiles, 8 fully audited task domains, dynamic clicked-location ranking and independent evidence confidence.');
