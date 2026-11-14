import { DOMAINS, EARTH_ANALOGS } from './analogData.js';

/**
 * A transparent, mission-task screening score, not a NASA lander-safety rating.
 * Every site is represented across all eight domains, though its descriptors
 * may derive from field analog context rather than direct physical measurements.
 * A goal tag represents an Earth experiment relevant to the planetary target.
 */
export function scoreAnalog(target, earth, weights) {
  const breakdown = DOMAINS.map(domain => {
    const goalTags = target.domains[domain.id].goals;
    const fieldTags = earth.domains[domain.id].features;
    const matched = goalTags.filter(tag => fieldTags.includes(tag));
    const unmet = goalTags.filter(tag => !fieldTags.includes(tag));
    const score = Math.round(100 * matched.length / goalTags.length);
    const weight = Math.max(0, Number(weights[domain.id]) || 0);
    return { domain: domain.id, label: domain.label, score, weight, matched, unmet,
      target: target.domains[domain.id], earth: earth.domains[domain.id] };
  });
  const weightSum = breakdown.reduce((sum, item) => sum + item.weight, 0);
  const total = weightSum > 0
    ? breakdown.reduce((sum, item) => sum + item.score * item.weight, 0) / weightSum
    : 0;
  return { earth, target, score: Number(total.toFixed(1)), breakdown,
    comparedDomains: breakdown.length, weightSum };
}

export function rankAnalogs(target, weights, candidates = EARTH_ANALOGS) {
  return candidates.map(site => scoreAnalog(target, site, weights))
    .sort((a, b) => b.score - a.score || a.earth.name.localeCompare(b.earth.name));
}

export function selectedCriteriaSummary(result) {
  const matched = result.breakdown.filter(item => item.matched.length && item.weight > 0)
    .sort((a,b) => b.score * b.weight - a.score * a.weight);
  const gaps = result.breakdown.filter(item => item.unmet.length && item.weight > 0)
    .sort((a,b) => a.score - b.score);
  const label = value => value.replaceAll('-', ' ');
  return {
    strengths: matched.length ? matched.slice(0, 2).map(item => `${item.label}: ${item.matched.slice(0,3).map(label).join(', ')}`) : ['No selected feature goals matched'],
    gaps: gaps.length ? gaps.slice(0, 2).map(item => `${item.label}: ${item.unmet.slice(0,3).map(label).join(', ')}`) : ['No unmatched tags under this limited ontology']
  };
}
