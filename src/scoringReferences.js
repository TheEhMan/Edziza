// These are comparisons of METHODS, not fabricated scores for the same Earth
// candidates. NASA landing-site assessments are different decisions from an
// Earth analog field campaign; they cannot be numerically benchmarked here.
export const METHOD_REFERENCES = {
  geology: {
    name: 'NASA Mars 2020 science workshops',
    summary: 'Site evidence for mineral and geologic science was evaluated against mission objectives. Workshop participants used low / medium / high votes against five science criteria, not a universal percent similarity score.',
    source: 'https://www.caltech.edu/about/news/where-land-mars-2020-conversation-ken-farley-47785',
    dataset: 'NASA/USGS planetary site descriptions plus the Earth field-site geological reports linked below. The app grades interpreted feature tags, not directly measured mineral abundances.',
    limitation: 'Do not treat basalt / impact / pyroclastic tags as matched laboratory mineral spectra.'
  },
  terrain: {
    name: 'NASA Mars Science Laboratory (MSL) landing assessment',
    summary: 'NASA used explicit engineering limits, including <30 degree slopes at 2-5 m baselines and relief thresholds at longer baselines. Such mission-specific safety gates are not analogous to our graded field-test match.',
    source: 'https://pubs.usgs.gov/publication/70047380',
    dataset: 'Mars MOLA MEGDR and Moon LOLA DEM are available for regional/global elevation; the current cross-body ranking uses documented landform tags. Earth Mapterhorn elevation is visualized but not reduced to a matched-resolution slope measurement.',
    limitation: 'No verified matched-footprint Earth/Mars/Moon slopes, roughness or landing ellipse hazard maps yet.'
  },
  thermal: {
    name: 'NASA MSL thermal design screening',
    summary: 'MSL constrained candidate landing latitudes to about 30 degrees north/south for rover thermal management; the mission did not assign the Earth analog scores shown here.',
    source: 'https://pubs.usgs.gov/publication/70047380',
    dataset: 'NASA POWER Earth grid climatology is fetched on demand for the selected Earth candidate. Lunar Diviner and Mars THEMIS are research references, not site-matched time series in this score.',
    limitation: 'No normalized day/night time series or cross-planet illumination model is in the ranking.'
  },
  resources: {
    name: 'NASA Mars 2020 mission-science prioritization',
    summary: 'NASA compared scientific context such as evidence for past habitable environments and mineral-bearing units; there is no directly comparable published resource-analog percentage for these Earth sites.',
    source: 'https://science.nasa.gov/resource/gale-crater-exploring-the-mars-science-laboratory-landing-site/',
    dataset: 'Agency sources linked below describe ice potential, regolith, basalt and prospecting concepts. The scores do not include verified concentrations of water ice or ore.',
    limitation: 'Resource presence in the same broad category is not evidence of equivalent abundance or extractability.'
  },
  dust: {
    name: 'NASA Mars Exploration Rover landing-site safety criteria',
    summary: 'Mission engineers preferred trafficable, load-bearing terrain not dominated by fine dust, while evaluating winds and rock abundance separately. This is a safety filter, not our analog similarity index.',
    source: 'https://www.usgs.gov/publications/selection-mars-exploration-rover-landing-sites',
    dataset: 'NASA planetary surface-process descriptions and Earth geologic field-site evidence; NASA POWER wind readings are supplemental and are not scored.',
    limitation: 'Lunar dust is not transported by atmospheric wind; grit handling is only a partial procedural analog.'
  },
  biology: {
    name: 'Mars 2020 biosignature science rubrics',
    summary: 'NASA prioritized potential to preserve evidence of past habitability and biosignatures, judged with geology and science objectives. The agency did not publish an equivalent analog-biology ranking for our eight curated Earth candidates.',
    source: 'https://www.caltech.edu/about/news/where-land-mars-2020-conversation-ken-farley-47785',
    dataset: 'NASA astrobiology field-site descriptions, candidate literature and contamination-control tasks. Biology tags describe Earth testing possibilities, never detected alien life.',
    limitation: 'No site-level microbial biomass, measured biomarkers or contamination experiments have been ingested.'
  },
  subsurface: {
    name: 'Mission-specific feature confirmation',
    summary: 'Published planetary site studies separate observed cave/skylight morphology from inferred subsurface cavities. No standard numeric cave-analog score exists for these Earth sites in the cited assessments.',
    source: 'https://science.nasa.gov/resource/seven-possible-cave-skylights-on-mars/',
    dataset: 'NASA imagery and terrestrial descriptions, with cave/ice-coring tag interpretations. At a clicked arbitrary planetary point, no nearby cave is assumed.',
    limitation: 'Possible lunar or Martian lava-tube systems must not be described as confirmed accessible cave networks.'
  },
  operations: {
    name: 'NASA/JPL Mars 2020 traversability modeling',
    summary: 'Researchers modeled drives using local terrain, hazard, slope and rock maps and compared route distance/time in sols. We have not run that operational simulation on any Earth candidate.',
    source: 'https://robotics.jpl.nasa.gov/media/documents/Data-driven%20surface%20traversability%20analysis%20for%20Mars%202020%20landing%20site%20selection.pdf',
    dataset: 'Documented field-site access, geomorphology and task opportunities from the linked agency sources. No local route execution telemetry or rover design is scored.',
    limitation: 'A high operations grade is not a safety certification, field permit or navigable traverse plan.'
  }
};

// EXPLICIT heuristic transfer discounts. These are CyberLeek design choices, not
// quantitative estimates of planetary physical equivalence.
export const TRANSFERABILITY = {
  // Domain-specific ceilings for procedural similarity, NOT measured physical equivalence.
  // Unlike earlier releases, documentation and clicked-distance confidence are NOT
  // multiplied into the fit index; they are independently displayed.
  mars: { geology: .96, terrain: .93, thermal: .74, resources: .86, dust: .82, biology: .72, subsurface: .86, operations: .90 },
  moon: { geology: .93, terrain: .89, thermal: .62, resources: .79, dust: .72, biology: .67, subsurface: .82, operations: .84 }
};

export function evidenceQuality(targetDomain, earthDomain, domainId) {
  // This is a conservative *documentation* tier, not sensor calibration.
  // Rich text and a URL do not automatically become a verified local data layer.
  const targetSpecific = /\/resource\/|\/image-detail\/|\/photojournal\/|\/4969\/|\/4720\//.test(targetDomain.source);
  const earthSpecific = /bcparks\.ca|nps\.gov|usgs\.gov|volcano\.si\.edu|parks\.canada\.ca|gov\.au|nasa\.gov\/mission_pages/.test(earthDomain.source);
  const both = targetSpecific && earthSpecific;
  let factor = both ? 0.75 : (targetSpecific || earthSpecific ? 0.67 : 0.57);
  // Categorical biology/cave matches are especially easy to overclaim.
  if (domainId === 'biology' || domainId === 'subsurface') factor = Math.min(factor, 0.64);
  return {
    factor,
    label: both ? 'Two context-specific sources; no matching numerical survey' : 'Qualitative / incomplete site validation',
    kind: 'editorial-feature-assessment',
    sourceCount: 2
  };
}

// Distance-to-reference is displayed as evidence-confidence, never a score multiplier.
// Arbitrary clicks are an exploratory shortlist, not a new local scientific survey.
export function profileFactor(picked) {
  if (!picked) return { factor: 1, label: 'Documented reference location', status: 'reference' };
  if (picked.distanceKm <= 1) return { factor: 1, label: 'At documented site center', status: 'reference' };
  if (picked.distanceKm <= 100) return { factor: 0.8, label: 'Nearby profile transfer - not locally verified', status: 'caution' };
  if (picked.distanceKm <= 500) return { factor: 0.4, label: 'Weak profile transfer - exploratory only', status: 'low' };
  return { factor: 0.1, label: 'No matching local research dataset - shortlist not validated', status: 'unsupported' };
}
