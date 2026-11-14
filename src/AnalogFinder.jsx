import React, { useEffect, useMemo, useState } from 'react';
import EarthMap from './EarthMap.jsx';
import MarsScene from './MarsScene.jsx';
import MoonScene from './MoonScene.jsx';
import { DOMAINS, EARTH_ANALOGS, TARGETS, DEFAULT_WEIGHTS, getTarget } from './analogData.js';
import { rankAnalogs, selectedCriteriaSummary } from './analogRanking.js';
import { METHOD_REFERENCES } from './scoringReferences.js';
import { WORLD_SITES, formatCoord } from './siteData.js';
import { getMarsElevations, getMoonElevations } from './nasaElevation.js';
import { PLANET_FACTS, numericScienceContext } from './scienceFacts.js';
import './analog.css';

const titleCaseTag = tag => tag.replaceAll('-', ' ');
const compareLabel = item => item.score >= 70 ? 'Strong task-based lead (not validated)' : item.score >= 45 ? 'Moderate task-based lead' : 'Weak research-task coverage';
const earthPowerCache = new Map();
const MISSION_MODES = [
  ['Balanced', DEFAULT_WEIGHTS],
  ['Polar base', { geology:2, terrain:4, thermal:5, resources:5, dust:1, biology:1, subsurface:4, operations:5 }],
  ['Volcanic science', { geology:5, terrain:4, thermal:1, resources:2, dust:3, biology:1, subsurface:3, operations:3 }],
  ['Rover mobility', { geology:2, terrain:5, thermal:2, resources:1, dust:4, biology:0, subsurface:2, operations:5 }],
  ['Astrobiology', { geology:2, terrain:2, thermal:3, resources:3, dust:2, biology:5, subsurface:4, operations:3 }],
  ['Cave exploration', { geology:3, terrain:4, thermal:1, resources:2, dust:1, biology:2, subsurface:5, operations:4 }]
];
const SRC_POWER = 'https://power.larc.nasa.gov/docs/services/api/temporal/climatology/';

// Supplemental numeric NASA Earth measurements. The eight-domain finder never
// depends on this API, so a network outage does not silently invent any values.
function EarthPowerMetrics({ earth }) {
  const [state, setState] = useState({ status: 'loading', data: null });
  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({
      parameters: 'T2M,WS10M,ALLSKY_SFC_SW_DWN', community: 'RE',
      latitude: String(earth.lat), longitude: String(earth.lon), format: 'JSON'
    });
    if (earthPowerCache.has(earth.id)) { setState({ status: 'ready', data: earthPowerCache.get(earth.id) }); return () => controller.abort(); }
    setState({ status: 'loading', data: null });
    fetch(`https://power.larc.nasa.gov/api/temporal/climatology/point?${params}`, { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error('NASA POWER request failed'); return response.json(); })
      .then(data => { const params = data?.properties?.parameter || null; if (params) earthPowerCache.set(earth.id, params); setState({ status: 'ready', data: params }); })
      .catch(error => { if (error.name !== 'AbortError') setState({ status: 'error', data: null }); });
    return () => controller.abort();
  }, [earth.id, earth.lat, earth.lon]);

  const metrics = [
    ['T2M', 'Air temperature', '°C', 1],
    ['WS10M', '10 m wind', 'm/s', 1],
    ['ALLSKY_SFC_SW_DWN', 'Solar energy', 'kWh/m²/day', 2]
  ].map(([key, label, unit, digits]) => ({
    key, label, unit, digits, value: state.data?.[key]?.ANN == null ? NaN : Number(state.data[key].ANN)
  })).filter(item => Number.isFinite(item.value) && item.value > -900);

  return <div className="analog-nasa-power">
    <div className="analog-power-title"><strong>NASA POWER / Earth climatology</strong>
      <a href={SRC_POWER} target="_blank" rel="noreferrer">Dataset ↗</a></div>
    <p>Supplementary modeled grid averages at this Earth coordinate, not sensor data, and not directly transferable to Mars or the Moon.</p>
    {state.status === 'ready' && metrics.length > 0
      ? <div className="analog-power-metrics">{metrics.map(metric => <div key={metric.key}><small>{metric.label}</small><strong>{metric.value.toFixed(metric.digits)} <span>{metric.unit}</span></strong></div>)}</div>
      : <p className="analog-power-note">{state.status === 'loading' ? 'Checking the NASA POWER service…' : 'Live NASA POWER climatology is offline. All eight research profiles and the analog ranking remain available.'}</p>}
  </div>;
}

function PlanetEvidenceMetrics({ world, site }) {
  const [state, setState] = useState({ status: 'loading', value: null, source: null });
  useEffect(() => {
    let active = true;
    setState({ status: 'loading', value: null, source: null });
    const load = world === 'mars' ? getMarsElevations : getMoonElevations;
    load().then(data => {
      if (!active) return;
      const value = data.sites?.[site]?.elevationMetres;
      setState({ status: Number.isFinite(value) ? 'ready' : 'offline', value, source: data.sourceUrl });
    }).catch(() => { if (active) setState({ status: 'offline', value: null, source: null }); });
    return () => { active = false; };
  }, [world, site]);
  return <span className="analog-dem-value">{state.status === 'ready' ? <>
    NASA {world === 'mars' ? 'MOLA' : 'LOLA'} grid elevation: <strong>{Math.round(state.value).toLocaleString('en-US')} m</strong>
    {' '}<a href={state.source} target="_blank" rel="noreferrer">source ↗</a>
  </> : <>
    NASA {world === 'mars' ? 'MOLA' : 'LOLA'} DEM: {state.status === 'loading' ? 'checking source…' : 'remote grid not loaded'}
    {' '}<a href={world === 'mars' ? 'https://pds-geosciences.wustl.edu/missions/mgs/megdr.html' : 'https://svs.gsfc.nasa.gov/4720/'} target="_blank" rel="noreferrer">dataset ↗</a>
  </>}</span>;
}

function downloadMissionBrief(result, picked, targetElevation) {
  const { earth, target, score, breakdown, baseScore, proximity, locationContext } = result;
  const facts = PLANET_FACTS[target.world];
  const lines = [
    '# CyberLeek | Planetary analog field-test screening brief', '',
    `Planetary reference: ${target.name} (${target.world})`,
    ...(picked ? [`Clicked coordinate: ${picked.lat}, ${picked.lon}`, `NASA DEM clicked elevation: ${Number.isFinite(picked.elevationMetres) ? picked.elevationMetres + ' m' : 'not available'}`, `Nearest curated profile: ${picked.referenceName} (${picked.distanceKm} km away)`, 'At this clicked point, rock/ice/biology characteristics are NOT locally measured by this prototype.'] : []),
    `Earth analog: ${earth.name}, ${earth.region}`, `Earth location: ${earth.lat}, ${earth.lon}`,
    `Research-task match index: ${score}/100 (not a scientific probability or NASA approval).`,
    `Profile/documentation confidence: ${proximity.label} (separate from the match score).`,
    `Eight-domain weighted score before latitude context: ${baseScore}/100.`,
    `Latitude-regime proxy: ${locationContext.latitudeScore}/100 (target |lat|=${Math.abs(locationContext.targetLatitude).toFixed(1)} deg, Earth |lat|=${Math.abs(earth.lat).toFixed(1)} deg).`,
    `Latitude blend weight: ${locationContext.contextWeight.toFixed(3)} (context coefficient is a provisional project assumption, not a measured temperature).`,
    `Formula: overall = weighted domain score * (1 - context weight) + latitude proxy * context weight.`,
    `NASA planetary reference: gravity ${facts.gravity} m/s2; solar day ${facts.solHours.toFixed(1)} hours; source ${facts.source}`,
    `NASA regional elevation available: ${Number.isFinite(targetElevation) ? targetElevation.toLocaleString('en-US') + ' m' : 'not downloaded'} (not part of domain-match index).`,
    '', '## Research objective', target.mission, '', '## Field reason', earth.reason, '',
    '## Domain numerical audit'
  ];
  for (const row of breakdown) {
    lines.push(`### ${row.label} — ${row.score.toFixed(1)} / 100`);
    lines.push(`Shared tags ${row.matchedCount}/${row.targetCount}; Earth tags ${row.earthTraitCount}; uncovered target tags ${row.unmet.length}`);
    lines.push(`Target coverage R=${row.recall.toFixed(1)}%; tag precision P=${row.precision.toFixed(1)}%; F1=${row.f1.toFixed(4)}`);
    lines.push(`Transfer adjustment T=${row.transfer.toFixed(2)}; qualitative documentation indicator=${row.evidence.factor.toFixed(2)} (does not multiply fit)`);
    lines.push(`Score = 100 * (0.70*R_fraction + 0.30*P_fraction) * T = ${row.score.toFixed(1)}`);
    lines.push(`NASA / agency target record: ${row.target.source}`);
    lines.push(`Earth geology/field-site record: ${row.earth.source}`);
    lines.push(`Matched interpreted tags: ${row.matched.join(', ') || 'none'}`);
    lines.push(`Unmatched goals: ${row.unmet.join(', ') || 'none'}`);
    const prior = METHOD_REFERENCES[row.domain];
    lines.push(`Other methodology (NOT comparable scores): ${prior.name}; ${prior.summary}; ${prior.source}`);
    lines.push(`Quantitative NASA context (NOT used in domain fit):`);
    numericScienceContext(row.domain, target.world, picked, earth, targetElevation).forEach(metric => {
      lines.push(`- ${metric.label}: ${metric.value} ${metric.unit}; ${metric.note}; ${metric.source}`);
    });
    lines.push('');
  }
  lines.push('## Limitations', target.limitations,
    'Matched descriptors are research-task tags interpreted by CyberLeek, not measured composition, terrain safety, ice concentration or biosignature detection.',
    'Global NASA reference values are not local site measurements. Evidence confidence is independent of the fit index.',
    'Comparative published methods are reported without fabricating scores for these specific pairs.',
    '', `Generated ${new Date().toISOString()}`);
  const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `cyberleek-${target.id}-${earth.id}-field-brief.md`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

function BreakdownBars({ result }) {
  return <div className="analog-rank-bars">{result.breakdown.map(item => <span key={item.domain} title={`${item.label}: ${item.score}/100 project feature coverage`}>
    <span style={{ width: `${item.score}%` }} />
  </span>)}</div>;
}

function EarthCandidateCard({ rank, result, active, onSelect }) {
  const { earth, score } = result;
  return <button className={`analog-candidate ${active ? 'active' : ''}`} type="button" onClick={() => onSelect(earth.id)}
    aria-pressed={active}>
    <span className="analog-candidate-rank">{String(rank).padStart(2,'0')}</span>
    <span className="analog-candidate-main"><strong>{earth.name}</strong><small>{earth.region}</small><BreakdownBars result={result} /></span>
    <span className="analog-candidate-score"><strong>{score.toFixed(0)}</strong><small>/100*</small></span>
  </button>;
}

function DomainComparison({ domain, item, world, earth, picked, siteElevation, weightSum }) {
  const reading = numericScienceContext(item.domain, world, picked, earth, siteElevation);
  const cited = METHOD_REFERENCES[item.domain];
  const weightedContribution = weightSum ? item.score * item.weight / weightSum : 0;
  return <article className="analog-domain-card">
    <div className="analog-domain-title"><span className="analog-domain-symbol">{String(DOMAINS.indexOf(domain) + 1).padStart(2, '0')}</span>
      <h3>{domain.label}</h3><span className="analog-domain-pct">{item.score.toFixed(1)}/100</span></div>
    <div className="analog-domain-track"><div style={{ width: `${item.score}%` }} /></div>
    <p className="analog-domain-result">{compareLabel(item)} · {item.matchedCount}/{item.targetCount} target features</p>
    <div className="analog-scoring-audit analog-scoring-compact">
      <div><small>Shared / goal tags</small><strong>{item.matchedCount} / {item.targetCount}</strong></div>
      <div><small>Goal coverage</small><strong>{item.recall.toFixed(0)}%</strong></div>
      <div><small>Trait precision</small><strong>{item.precision.toFixed(0)}%</strong></div>
      <div><small>Transfer factor</small><strong>{item.transfer.toFixed(2)}×</strong></div>
      <div><small>Earth traits recorded</small><strong>{item.earthTraitCount}</strong></div>
      <div><small>Weighted points</small><strong>+{weightedContribution.toFixed(1)}</strong></div>
    </div>
    <div className="analog-physical-metrics">
      <div className="analog-metric-heading">Numerical NASA context — separate from calculated match score</div>
      <div className="analog-physical-grid">{reading.map(metric => <div key={metric.label} className="analog-physical-item">
        <small>{metric.label}</small><strong>{metric.value} <span>{metric.unit}</span></strong>
        <em>{metric.note}</em><a href={metric.source} target="_blank" rel="noreferrer">NASA / source ↗</a>
      </div>)}</div>
    </div>
    <details className="analog-audit-details">
      <summary>Open dataset, exact calculation, gaps and outside methods</summary>
      <div className="analog-method-comparison">
        <strong>1. Dataset used</strong>
        <p>{cited.dataset}</p>
        <p><b>Actual scoring input:</b> researcher-curated feature tags based on two linked context records, NOT source measurements or a lab spectrum. <a href={item.target.source} target="_blank" rel="noreferrer">Planetary record ↗</a> · <a href={item.earth.source} target="_blank" rel="noreferrer">Earth record ↗</a></p>
        <strong>2. How CyberLeek scores it</strong>
        <p>Feature match ({item.matchedCount} matches), target recall R={item.recall.toFixed(1)}%, tag precision P={item.precision.toFixed(1)}%; transfer T={item.transfer.toFixed(2)}. Calculated score = 100 × (0.70 × { (item.recall / 100).toFixed(3) } + 0.30 × { (item.precision / 100).toFixed(3) }) × {item.transfer.toFixed(2)} = <b>{item.score.toFixed(1)} / 100</b>. Documentation context indicator {item.evidence.factor.toFixed(2)} ({item.evidence.label}) is reported separately, not multiplied into the score.</p>
        <p><b>Target observation:</b> {item.target.observation}</p>
        <p><b>Earth context:</b> {item.earth.summary}</p>
        <p><b>Matches:</b> {item.matched.length ? item.matched.map(titleCaseTag).join(' · ') : 'none'}</p>
        <p><b>Unmatched:</b> {item.unmet.length ? item.unmet.map(titleCaseTag).join(' · ') : 'none'}</p>
        <strong>3. How other researchers evaluated related problems</strong>
        <p>{cited.name}: {cited.summary}</p>
        <a href={cited.source} target="_blank" rel="noreferrer">Published assessment / rubric ↗</a>
        <p>No published numerical score for this particular Earth/planet pair was found; we do not represent a NASA engineering threshold as an equivalent analogue index.</p>
        <p className="analog-evidence-limit">Remaining data gap: {cited.limitation}</p>
      </div>
    </details>
  </article>;
}

export default function AnalogFinder({ targetWorld, onWorldChange, sites, onSiteChange, onPlanetPick, pickedPoints, earthId, onEarthChange,
  weights, onWeightChange, onOpenMap }) {
  const target = getTarget(targetWorld, sites[targetWorld]);
  const picked = pickedPoints[targetWorld];
  const ranked = useMemo(() => rankAnalogs(target, weights, EARTH_ANALOGS, picked), [target, weights, picked]);
  // The top-ranked recommendation is the default until a user manually compares another candidate.
  const selected = ranked.find(item => item.earth.id === earthId) || ranked[0];
  const [showAllCandidates, setShowAllCandidates] = useState(false);
  const [showEarthMap, setShowEarthMap] = useState(false);
  const [showWeights, setShowWeights] = useState(false);
  const [showDomains, setShowDomains] = useState(true);
  const [targetDem, setTargetDem] = useState(null);
  useEffect(() => {
    let active = true;
    setTargetDem(null);
    (targetWorld === 'mars' ? getMarsElevations() : getMoonElevations())
      .then(data => {
        const value = data?.sites?.[target.id]?.elevationMetres;
        if (active && Number.isFinite(value)) setTargetDem(value);
      }).catch(() => {});
    return () => { active = false; };
  }, [targetWorld, target.id]);
  const siteElevation = picked ? picked.elevationMetres : targetDem;
  const leaders = showAllCandidates ? ranked : ranked.slice(0, 6);
  const { strengths, gaps } = selectedCriteriaSummary(selected);
  const weightSum = Object.values(weights).reduce((sum, n) => sum + Number(n || 0), 0);

  return <div className="analog-finder">
    <section className="analog-hero">
      <div><span className="eyebrow">NASA SPACE APPS · TERRESTRIAL ANALOG DISCOVERY</span>
        <h1>Find Earth’s best testing ground <em>for another world.</em></h1>
        <p>Click any location on the 3D globe of Mars or the Moon. CyberLeek compares it to documented planetary research context and ranks Earth field-test sites across eight scientific domains.</p>
        <div className="mission-pills"><span>CLICK TO PICK A 3D LOCATION</span><span>06 curated planetary profiles</span><span>{EARTH_ANALOGS.length} Earth candidates</span><span>08 / 08 documented domains</span><span>Custom mission priorities</span></div>
      </div>
      <div className="analog-hero-side"><span>THE QUESTION</span><strong>Where should we test before we go?</strong>
        <p>An interpretable scientific screening tool — not a NASA-endorsed landing-site decision.</p></div>
    </section>

    <section className="analog-query" aria-label="Choose a planetary research target">
      <div className="analog-query-step"><span>01 / DESTINATION</span><div className="analog-body-switch">
        <button type="button" className={targetWorld === 'mars' ? 'selected' : ''} onClick={() => onWorldChange('mars')}>Mars</button>
        <button type="button" className={targetWorld === 'moon' ? 'selected' : ''} onClick={() => onWorldChange('moon')}>Moon</button>
      </div></div>
      <div className="analog-query-step wide"><label htmlFor="analog-target-select">02 / OR CHOOSE A DOCUMENTED SITE</label>
        <select id="analog-target-select" value={target.id} onChange={event => onSiteChange(targetWorld, event.target.value)}>
          {TARGETS.filter(item => item.world === targetWorld).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select></div>
      <div className="analog-query-step launch"><span>03 / MATCHING ENGINE</span><strong>8 scientific domains</strong>
        <button type="button" className="subtle-button" onClick={() => setShowWeights(previous => !previous)} aria-expanded={showWeights}>
          {showWeights ? 'Hide mission weights' : 'Tune priorities'}
        </button></div>
    </section>
    <section className="analog-mission-presets" aria-label="Choose research mission priority">
      <div><strong>Research objective</strong><small>Choose a mission and watch the Earth ranking recalculate.</small></div>
      <div className="analog-mission-buttons">{MISSION_MODES.map(([label, preset]) => <button type="button" key={label}
        className={DOMAINS.every(domain => weights[domain.id] === preset[domain.id]) ? 'active' : ''}
        onClick={() => onWeightChange({ ...preset })}>{label}</button>)}</div>
    </section>
    <section className="analog-picker-shell" aria-label="Interactive 3D planetary location picker">
      <div className="analog-picker-top"><div><span className="eyebrow">SELECT YOUR TARGET ON THE TERRAIN</span>
        <h2>{targetWorld === 'mars' ? 'Explore the whole planet of Mars in 3D.' : 'Explore the 3D Moon globe.'}</h2>
        <p>{targetWorld === 'mars'
          ? 'Spin the entire Mars globe and choose any point. NASA global Viking/MOLA layers load when available; Elysium regional detail is optional. Uncharacterized points receive a LOW-confidence notice, not a hidden 10× score penalty.'
          : 'Click any point on the lunar globe. NASA LOLA supplies real elevation relief when the DEM is loaded; drag to rotate, scroll to zoom.'}</p></div>
        <span className="analog-picked-live">{picked ? 'NEW MAP POINT SELECTED' : 'CURATED RESEARCH SITE'}</span></div>
      <div className="analog-picker-view" key={targetWorld}>
        {targetWorld === 'mars'
          ? <MarsScene site={target.id} picked={picked} onSiteChange={id => onSiteChange('mars', id)} onPick={(lat, lon, elevationMetres) => onPlanetPick('mars', lat, lon, elevationMetres)} exaggeration={1.15} />
          : <MoonScene site={target.id} picked={picked} onSiteChange={id => onSiteChange('moon', id)} onPick={(lat, lon, elevationMetres) => onPlanetPick('moon', lat, lon, elevationMetres)} />}
      </div>
      <div className="analog-picked-panel">
        <div className="analog-picked-coords"><small>{picked ? 'CLICKED COORDINATES' : 'REFERENCE SITE COORDINATES'}</small>
          <strong>{formatCoord(picked?.lat ?? WORLD_SITES[targetWorld][target.id].lat, 'lat')} · {formatCoord(picked?.lon ?? WORLD_SITES[targetWorld][target.id].lon, 'lon')}</strong>
          {picked && <p className="analog-picked-elevation">NASA {targetWorld === 'mars' ? 'MOLA' : 'LOLA'} DEM at selected grid cell: {Number.isFinite(picked.elevationMetres) ? `${picked.elevationMetres.toLocaleString()} m` : 'not loaded'}</p>}</div>
        <div className="analog-picked-reference"><small>SCIENTIFIC COMPARISON PROFILE</small>
          <strong>{target.name}</strong>
          <p>{picked ? `Closest documented profile is ${picked.distanceKm.toLocaleString()} km away. ${picked.inResearchVicinity ? 'Research vicinity — site-specific data still need verification.' : 'Outside the nearby research area: exploratory extrapolation with LOW confidence.'}`
            : 'A curated planetary science reference; select a new point or choose a preset.'}</p></div>
        <div className="analog-picked-action"><div className="analog-best-match"><small>CURRENT TOP EARTH MATCH</small>
          <strong>{ranked[0]?.earth.name}</strong><span>{ranked[0]?.score.toFixed(1)}/100 · research-task fit, not a measured match probability</span></div>
          <a href="#analog-ranked-results" className="primary-button">View Earth matches ↓</a>
          {picked && <button className="subtle-button" onClick={() => onSiteChange(targetWorld, target.id)}>Use reference site</button>}</div>
      </div>
    </section>
    <div className="analog-target-description"><strong>{picked ? 'Reference science profile:' : 'Selected science site:'} {target.name}</strong><p>{target.mission}</p>
      <a href={target.source} target="_blank" rel="noreferrer">Planetary site evidence ↗</a>
      <PlanetEvidenceMetrics world={targetWorld} site={target.id} /></div>
    {picked && <p className="analog-spatial-warning">⚠ The clicked coordinate is real. The Earth ranking uses the nearest documented {target.name} eight-domain profile—not new geological, ice, cave or biology measurements at this pixel. Distance: {picked.distanceKm.toLocaleString()} km. Evidence confidence: {selected.proximity.label}; it does not multiply the match score.</p>}

    {showWeights && <section className="analog-weight-panel">
      <header><div><h2>What does your mission care most about?</h2><p>Weight each domain from 0 (ignore) to 5 (highest priority). The ranking changes instantly.</p></div>
        <button className="subtle-button" onClick={() => onWeightChange(DEFAULT_WEIGHTS)}>Restore defaults</button></header>
      <div className="analog-weight-grid">{DOMAINS.map(domain => <label key={domain.id}>
        <span>{domain.label}</span><strong>{weights[domain.id]}</strong>
        <input type="range" min="0" max="5" step="1" value={weights[domain.id]}
          onChange={event => onWeightChange({ ...weights, [domain.id]: Number(event.target.value) })}/>
      </label>)}</div>
      {weightSum === 0 && <p className="analog-zero-weight">All priorities are zero. Increase at least one weight to get a meaningful ranking.</p>}
    </section>}

    <div className="analog-results-heading" id="analog-ranked-results"><div><span className="eyebrow">EARTH CANDIDATES · RANKED</span>
      <h2>Recommended field sites</h2><p>Scores reflect matching research tasks and physical-transfer limits. Evidence confidence is separate and shown explicitly. These are not physical similarity percentages or NASA safety ratings.</p></div>
      <button className="subtle-button" onClick={() => setShowAllCandidates(value => !value)}>{showAllCandidates ? 'Show top 6' : `Show all ${ranked.length}`}</button></div>

    <div className="analog-results-layout">
      <div className="analog-candidate-list" aria-label="Earth analog rankings">
        {leaders.map((item, index) => <EarthCandidateCard key={item.earth.id} rank={index + 1}
          result={item} active={item.earth.id === selected.earth.id} onSelect={onEarthChange} />)}
        <p className="analog-list-foot">* 0–100 is a research-task fit index. The location-distance warning is a confidence flag, never an arbitrary 10× score reduction. All eight areas are documented, but not uniformly instrument-measured.</p>
      </div>
      <div className="analog-selected">
        <div className="analog-selected-head"><div><span className="eyebrow">SELECTED EARTH ANALOG</span>
          <h2>{selected.earth.name}</h2><p>{selected.earth.region}</p></div>
          <div className="analog-selected-total"><strong>{selected.score.toFixed(1)}</strong><span>TASK-FIT INDEX / 100</span></div></div>
        {showEarthMap
          ? <div className="analog-earth-map"><EarthMap site={selected.earth.id} basemap="satellite" exaggeration={1} resetKey={0} /></div>
          : <div className="analog-earth-map-gate"><div><strong>Earth satellite and 3D terrain</strong><p>Load this interactive map only when you need it. This avoids running two heavy WebGL scenes at once and improves mobile performance.</p>
              <button type="button" className="primary-button" onClick={() => setShowEarthMap(true)}>Load 3D Earth terrain</button></div></div>}
        <div className="analog-selected-coords"><span>{formatCoord(selected.earth.lat, 'lat')} · {formatCoord(selected.earth.lon, 'lon')}</span>
          <button onClick={() => onOpenMap(selected.earth.id)} className="subtle-button">Open full maps</button></div>
        <div className="analog-score-components">
          <div><small>8-domain task fit</small><strong>{selected.baseScore.toFixed(1)}<span>/100</span></strong></div>
          <div><small>Latitude context prior</small><strong>{selected.locationContext.latitudeScore.toFixed(1)}<span>/100</span></strong></div>
          <div><small>Latitude blend weight</small><strong>{(selected.locationContext.contextWeight * 100).toFixed(0)}<span>%</span></strong></div>
          <div><small>Evidence confidence</small><strong className="confidence-text">{selected.proximity.status === 'reference' ? 'Reference' : selected.proximity.status === 'caution' ? 'Caution' : 'Low'}</strong></div>
        </div>
        <p className="analog-context-caption">Latitude comparison uses |{selected.locationContext.targetLatitude.toFixed(1)}°| on {targetWorld} and |{selected.earth.lat.toFixed(1)}°| on Earth as a research-logistics proxy. It does not measure ice, thermal, terrain or lighting equivalence.</p>
        <p className="analog-selected-reason">{selected.earth.reason}</p>
        <div className="analog-strengths"><div><strong>Strongest coverage</strong>{strengths.map(text => <p key={text}>{text}</p>)}</div>
          <div><strong>Main gaps</strong>{gaps.map(text => <p key={text}>{text}</p>)}</div></div>
        <div className="analog-selected-links"><a href={selected.earth.source} target="_blank" rel="noreferrer">Earth site evidence ↗</a>
          <a href={target.source} target="_blank" rel="noreferrer">Planetary site evidence ↗</a></div>
        <button type="button" className="primary-button analog-export" onClick={() => downloadMissionBrief(selected, picked, siteElevation)}>Download this field-test brief (.md)</button>
        <EarthPowerMetrics earth={selected.earth} />
      </div>
    </div>

    <section className="analog-domain-section">
      <header><div><span className="eyebrow">THE EIGHT-DOMAIN SCIENCE CHECK</span>
        <h2>Why {selected.earth.name} was matched to {target.name}</h2>
        <p>Each category displays six numerical grading inputs, official NASA context where available, and a collapsible explanation of the dataset, formula and outside methodology. The score is an evidence-guided task match, not a percentage of physical sameness.</p></div>
        <button className="subtle-button" onClick={() => setShowDomains(value => !value)}>{showDomains ? 'Collapse details' : 'Show all 8 domains'}</button>
      </header>
      {showDomains && <div className="analog-domain-grid">{DOMAINS.map(domain => <DomainComparison key={domain.id} domain={domain} world={targetWorld} earth={selected.earth} picked={picked}
        siteElevation={siteElevation} weightSum={selected.weightSum}
        item={selected.breakdown.find(item => item.domain === domain.id)} />)}</div>}
    </section>
    <section className="analog-method-summary"><h2>What the /100 numbers mean</h2>
      <p><strong>Per domain:</strong> 100 × (70% × target-goal coverage + 30% × trait precision) × a published-data-independent, project-defined physical-transfer adjustment. <strong>Overall:</strong> mission-weighted mean of eight domain results, blended with a displayed latitude-regime proxy (normally 15%, up to 34% for a clicked point and relevant mission tasks).</p>
      <p><strong>Source confidence is not a number deducted from the ranking.</strong> A faraway clicked point is flagged as an unverified extrapolation. Satellite elevation, NASA fact-sheet physics and NASA POWER climatology are displayed as separate measured/modelled context; without matched Earth and planetary measurements, they do not enter the eight-category score. No NASA validation or safe landing determination is claimed.</p>
    </section>
    <section className="analog-limits"><strong>Where Earth's analogy stops</strong><p>{target.limitations}</p>
      <p>Orbital maps, geological descriptions and analog mission experience are mixed evidence types. The algorithm does not determine actual resource concentrations, radiation risk, safe landing ellipses, cave access, legal field access or confirmed biosignatures.</p></section>
  </div>;
}
