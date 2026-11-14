import { DOMAINS, EARTH_ANALOGS } from './analogData.js';
import { evidenceQuality, profileFactor, TRANSFERABILITY } from './scoringReferences.js';
import { WORLD_SITES } from './siteData.js';

/**
 * CyberLeek's exploratory 0-100 analogue-task FIT INDEX (NOT a probability).
 * Keep evidence confidence outside the fit index: a location thousands of km
 * from a reference site is *unverified*, but shouldn't make all site scores 2/100.
 *
 * Domain fit = 100 * (0.7*goal coverage + 0.3*trait precision) * physics transfer.
 * Quality/context: domain fit weighted mean, plus a latitude-regime prior only
 * for thermal/resource/operations priorities (not a local climate measurement).
 * F1, confidence and original tags are reported for auditing.
 */
export function scoreAnalog(target, earth, weights, picked = null) {
  const breakdown = DOMAINS.map(domain => {
    const goalTags = [...new Set(target.domains[domain.id].goals)];
    const fieldTags = [...new Set(earth.domains[domain.id].features)];
    const matched = goalTags.filter(tag => fieldTags.includes(tag));
    const unmet = goalTags.filter(tag => !fieldTags.includes(tag));
    const precision = matched.length / Math.max(fieldTags.length, 1);
    const recall = matched.length / Math.max(goalTags.length, 1);
    const f1 = precision + recall > 0 ? 2 * precision * recall / (precision + recall) : 0;
    const evidence = evidenceQuality(target.domains[domain.id], earth.domains[domain.id], domain.id);
    const transfer = TRANSFERABILITY[target.world][domain.id];
    const rawCoveragePoints = 100 * (0.7 * recall + 0.3 * precision);
    const raw = Math.round(rawCoveragePoints * transfer * 10) / 10;
    const weight = Math.max(0, Number(weights[domain.id]) || 0);
    return {
      domain: domain.id, label: domain.label, score: raw, weight,
      matched, unmet, matchedCount: matched.length,
      targetCount: goalTags.length, earthTraitCount: fieldTags.length,
      target: target.domains[domain.id], earth: earth.domains[domain.id],
      precision: Number((precision * 100).toFixed(1)),
      recall: Number((recall * 100).toFixed(1)),
      f1: Number(f1.toFixed(4)), evidence, transfer,
      coveragePoints: Number(rawCoveragePoints.toFixed(1)),
      scoringInput: 'Human-curated research-goal tags from linked source descriptions; NOT matched physical rasters'
    };
  });
  const weightSum = breakdown.reduce((sum, row) => sum + row.weight, 0);
  const base = weightSum > 0
    ? breakdown.reduce((sum, row) => sum + row.score * row.weight, 0) / weightSum : 0;

  // Explicit location-driven ranking effect: very high latitude research targets
  // can benefit from high-latitude Earth expedition conditions. This is a *proxy*,
  // never an inference of local ice, light levels, temperature or biology.
  const reference = WORLD_SITES[target.world]?.[target.id];
  const targetLatitude = picked?.lat ?? reference?.lat ?? 0;
  const latitudeDifference = Math.abs(Math.abs(targetLatitude) - Math.abs(earth.lat));
  const latitudeScore = Math.round((1 - Math.min(90, latitudeDifference) / 90) * 1000) / 10;
  const relevant = ['thermal', 'resources', 'operations'].reduce((sum, domain) => sum + Math.max(0, Number(weights[domain]) || 0), 0);
  const missionFraction = weightSum ? relevant / weightSum : 0;
  const contextWeight = Math.min(picked ? 0.34 : 0.15, (picked ? 0.34 : 0.15) * (missionFraction / 0.35));
  const total = weightSum > 0 ? base * (1 - contextWeight) + latitudeScore * contextWeight : 0;
  const proximity = profileFactor(picked);
  return {
    earth, target,
    score: Number(total.toFixed(1)), baseScore: Number(base.toFixed(1)),
    breakdown, comparedDomains: breakdown.length, weightSum, proximity,
    locationContext: {
      targetLatitude, earthLatitude: earth.lat,
      latitudeDifference: Number(latitudeDifference.toFixed(1)),
      latitudeScore, contextWeight: Number(contextWeight.toFixed(4)),
      contribution: Number((latitudeScore * contextWeight).toFixed(1)),
      description: 'Absolute-latitude operational-regime heuristic; NOT measured temperature, ice or illumination'
    },
    methodology: '70% target-goal coverage + 30% trait precision per domain, transfer-adjusted; weighted mean blended with an explicitly labeled latitude-regime proxy. Confidence separately reported.'
  };
}

export function rankAnalogs(target, weights, candidates = EARTH_ANALOGS, picked = null) {
  return candidates.map(site => scoreAnalog(target, site, weights, picked))
    .sort((a, b) => b.score - a.score || a.earth.name.localeCompare(b.earth.name));
}

export function selectedCriteriaSummary(result) {
  const matched = result.breakdown.filter(item => item.matched.length && item.weight > 0)
    .sort((a, b) => b.score * b.weight - a.score * a.weight);
  const gaps = result.breakdown.filter(item => item.unmet.length && item.weight > 0)
    .sort((a, b) => a.score - b.score);
  const label = value => value.replaceAll('-', ' ');
  return {
    strengths: matched.length ? matched.slice(0, 2).map(item => `${item.label}: ${item.matched.slice(0,3).map(label).join(', ')}`) : ['No selected research features matched'],
    gaps: gaps.length ? gaps.slice(0, 2).map(item => `${item.label}: ${item.unmet.slice(0,3).map(label).join(', ')}`) : ['No tag-level gaps; fundamental planetary differences still apply']
  };
}
