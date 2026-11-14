import { writeFile, mkdir } from 'node:fs/promises';
import { DOMAINS, TARGETS, EARTH_ANALOGS, DEFAULT_WEIGHTS } from '../src/analogData.js';
import { rankAnalogs } from '../src/analogRanking.js';

const out = new URL('../public/analog-research-catalog.json', import.meta.url);
const dataset = {
  title: 'EDZIZA eight-domain research screening catalogue',
  challenge: '2026 Space Apps - Identify Earth Locations that Analog the Permanent Moon Base Locations and Mars',
  scientificStatus: 'Expert-curated qualitative research experiment suitability profiles. Not universally measured NASA physical readings, not a validated lander safety model, not a global exhaustive search.',
  domainCount: DOMAINS.length, earthCount: EARTH_ANALOGS.length, planetaryTargets: TARGETS.length,
  featureTags: 'Controlled project tags describing possible Earth field-test utility, not field-measured abundances.',
  scoring: 'For each domain: 100 × matched planetary research-goal tags / number of goals. Weighted mean over enabled domain priorities.',
  defaultWeights: DEFAULT_WEIGHTS,
  domains: DOMAINS,
  earth: EARTH_ANALOGS,
  targets: TARGETS,
  rankings: Object.fromEntries(TARGETS.map(target => [`${target.world}:${target.id}`,
    rankAnalogs(target, DEFAULT_WEIGHTS).map(result => ({
      earthId: result.earth.id, earthName: result.earth.name,
      projectScreeningScore: result.score,
      categoryFeatureCoverageScores: Object.fromEntries(result.breakdown.map(row => [row.domain, row.score]))
    }))]))
};
await mkdir(new URL('../public/',import.meta.url), { recursive: true });
await writeFile(out, JSON.stringify(dataset, null, 2) + '\n');
console.log(`Wrote ${out.pathname} for ${TARGETS.length} targets, ${EARTH_ANALOGS.length} Earth areas and ${DOMAINS.length} complete domains`);
