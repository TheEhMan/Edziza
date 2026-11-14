import React, { useEffect, useMemo, useState } from 'react';
import EarthMap from './EarthMap.jsx';
import MarsScene from './MarsScene.jsx';
import MoonScene from './MoonScene.jsx';
import { DOMAINS, EARTH_ANALOGS, TARGETS, DEFAULT_WEIGHTS, getTarget } from './analogData.js';
import { rankAnalogs, selectedCriteriaSummary } from './analogRanking.js';
import { WORLD_SITES, formatCoord } from './siteData.js';
import { getMarsElevations, getMoonElevations } from './nasaElevation.js';
import './analog.css';

const titleCaseTag = tag => tag.replaceAll('-', ' ');
const compareLabel = item => item.score >= 80 ? 'Strong goal coverage' : item.score >= 50 ? 'Partial goal coverage' : 'Limited goal coverage';
const SRC_POWER = 'https://power.larc.nasa.gov/docs/services/api/temporal/climatology/';

// Supplemental numeric NASA Earth measurements. The eight-domain finder never
// depends on this API, so a network outage does not silently invent any values.
function EarthPowerMetrics({ earth }) {
  const [state, setState] = useState({ status: 'loading', data: null });
  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({
      parameters: 'T2M,WS10M,ALLSKY_SFC_SW_DWN', community: 'AG',
      latitude: String(earth.lat), longitude: String(earth.lon), format: 'JSON'
    });
    setState({ status: 'loading', data: null });
    fetch(`https://power.larc.nasa.gov/api/temporal/climatology/point?${params}`, { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error('NASA POWER request failed'); return response.json(); })
      .then(data => setState({ status: 'ready', data: data?.properties?.parameter || null }))
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

function downloadMissionBrief(result, picked) {
  const { earth, target, score, breakdown } = result;
  const lines = [
    `# EDZIZA Earth analog field-test brief`,
    '',
    `Planetary research target (documented profile): ${target.name} (${target.world})`,
    ...(picked ? [`Picked planetary coordinate: ${picked.lat}, ${picked.lon}`, `DEM grid-cell elevation at clicked pixel: ${Number.isFinite(picked.elevationMetres) ? picked.elevationMetres + " m" : "not loaded"}`, `Nearest documented profile: ${picked.referenceName} (${picked.distanceKm} km away)`, 'The eight-domain analogy is inherited from this research profile, NOT directly sampled at the clicked coordinate.'] : []),
    `Candidate Earth field site: ${earth.name}, ${earth.region}`,
    `Earth coordinates (representative): ${earth.lat}, ${earth.lon}`,
    `Project research-suitability screening score: ${score}/100 (heuristic, not NASA-certified)`,
    '', `## Suggested study question`, target.mission, '',
    `## Why consider this Earth site`, earth.reason, '',
    `## Eight-domain evidence and target/field gaps`, ''
  ];
  for (const row of breakdown) {
    lines.push(`### ${row.label} — ${row.score}/100 project coverage`);
    lines.push(`Planetary context: ${row.target.observation}`);
    lines.push(`Earth analog field context: ${row.earth.summary}`);
    lines.push(`Matching research tasks: ${row.matched.join(', ') || 'none in current tag vocabulary'}`);
    lines.push(`Uncovered tasks: ${row.unmet.join(', ') || 'none in current tag vocabulary'}`);
    lines.push(`Planetary evidence: ${row.target.source}`);
    lines.push(`Earth evidence: ${row.earth.source}`, '');
  }
  lines.push('## Planetary physics and validation limits', target.limitations,
    'The site and criteria are a transparent project-screening hypothesis, not NASA acceptance, verified current resource estimates, a safe landing recommendation or permission for field research.',
    'The biological and subsurface domains reflect test opportunities, not detected life or proven caves at the planetary point.',
    '', 'Score method: 100 * matched domain goal tags / all domain goal tags; weighted mean using researcher-selected priorities.',
    `Generated: ${new Date().toISOString()}`, '');
  const markdown = lines.join('\n');
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `edziza-${target.id}-${earth.id}-field-brief.md`;
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

function DomainComparison({ domain, item }) {
  return <article className="analog-domain-card">
    <div className="analog-domain-title"><span className="analog-domain-symbol">{String(DOMAINS.indexOf(domain) + 1).padStart(2, '0')}</span>
      <h3>{domain.label}</h3><span className="analog-domain-pct">{item.score}/100</span></div>
    <div className="analog-domain-track"><div style={{ width: `${item.score}%` }} /></div>
    <p className="analog-domain-result">{compareLabel(item)} · {item.matched.length}/{item.target.goals.length} relevant field-test traits</p>
    <div className="analog-domain-columns">
      <div><small>PLANETARY TARGET · SOURCE-DERIVED CONTEXT</small><p>{item.target.observation}</p>
        <a href={item.target.source} target="_blank" rel="noreferrer">Planetary source ↗</a></div>
      <div><small>EARTH · EVIDENCE-GUIDED INTERPRETATION</small><p>{item.earth.summary}</p>
        <a href={item.earth.source} target="_blank" rel="noreferrer">Field-site source ↗</a></div>
    </div>
    <div className="analog-trait-lines">
      <span><strong>Matches:</strong> {item.matched.length ? item.matched.map(titleCaseTag).join(' · ') : 'No matching goals in this screening vocabulary'}</span>
      <span><strong>Doesn't cover:</strong> {item.unmet.length ? item.unmet.map(titleCaseTag).join(' · ') : 'All selected feature goals (planetary differences still remain)'}</span>
    </div>
  </article>;
}

export default function AnalogFinder({ targetWorld, onWorldChange, sites, onSiteChange, onPlanetPick, pickedPoints, earthId, onEarthChange,
  weights, onWeightChange, onOpenMap }) {
  const target = getTarget(targetWorld, sites[targetWorld]);
  const picked = pickedPoints[targetWorld];
  const ranked = useMemo(() => rankAnalogs(target, weights), [target, weights]);
  // The top-ranked recommendation is the default until a user manually compares another candidate.
  const selected = ranked.find(item => item.earth.id === earthId) || ranked[0];
  const [showAllCandidates, setShowAllCandidates] = useState(false);
  const [showWeights, setShowWeights] = useState(false);
  const [showDomains, setShowDomains] = useState(true);
  const leaders = showAllCandidates ? ranked : ranked.slice(0, 6);
  const { strengths, gaps } = selectedCriteriaSummary(selected);
  const weightSum = Object.values(weights).reduce((sum, n) => sum + Number(n || 0), 0);

  return <div className="analog-finder">
    <section className="analog-hero">
      <div><span className="eyebrow">NASA SPACE APPS · TERRESTRIAL ANALOG DISCOVERY</span>
        <h1>Find Earth’s best testing ground <em>for another world.</em></h1>
        <p>Click a location on the 3D Mars terrain or 3D Moon globe. EDZIZA matches it to documented planetary research context and ranks Earth field-test sites across eight scientific domains.</p>
        <div className="mission-pills"><span>CLICK TO PICK A 3D LOCATION</span><span>06 verified research profiles</span><span>{EARTH_ANALOGS.length} Earth candidates</span><span>08 / 08 documented domains</span><span>Custom mission priorities</span></div>
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
    <section className="analog-picker-shell" aria-label="Interactive 3D planetary location picker">
      <div className="analog-picker-top"><div><span className="eyebrow">SELECT YOUR TARGET ON THE TERRAIN</span>
        <h2>{targetWorld === 'mars' ? 'Explore the 3D volcanic terrain of Mars.' : 'Explore the 3D Moon globe.'}</h2>
        <p>{targetWorld === 'mars'
          ? 'Click any part of the NASA MOLA 3D terrain within Elysium (139–165°E, 17–43°N). Drag to orbit, scroll to zoom.'
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
          <strong>{ranked[0]?.earth.name}</strong><span>{ranked[0]?.score.toFixed(1)}/100 · research-task score</span></div>
          <a href="#analog-ranked-results" className="primary-button">View Earth matches ↓</a>
          {picked && <button className="subtle-button" onClick={() => onSiteChange(targetWorld, target.id)}>Use reference site</button>}</div>
      </div>
    </section>
    <div className="analog-target-description"><strong>{picked ? 'Reference science profile:' : 'Selected science site:'} {target.name}</strong><p>{target.mission}</p>
      <a href={target.source} target="_blank" rel="noreferrer">Planetary site evidence ↗</a>
      <PlanetEvidenceMetrics world={targetWorld} site={target.id} /></div>
    {picked && <p className="analog-spatial-warning">⚠ The picked coordinates are genuine map coordinates. The Earth matching score uses the nearest documented {target.name} eight-domain profile—not new geological, ice, cave or biology measurements at this pixel. Distance: {picked.distanceKm.toLocaleString()} km.</p>}

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
      <h2>Recommended field sites</h2><p>Scores reflect coverage of project-defined, research-useful traits — not a physical similarity percentage or a NASA safety rating.</p></div>
      <button className="subtle-button" onClick={() => setShowAllCandidates(value => !value)}>{showAllCandidates ? 'Show top 6' : `Show all ${ranked.length}`}</button></div>

    <div className="analog-results-layout">
      <div className="analog-candidate-list" aria-label="Earth analog rankings">
        {leaders.map((item, index) => <EarthCandidateCard key={item.earth.id} rank={index + 1}
          result={item} active={item.earth.id === selected.earth.id} onSelect={onEarthChange} />)}
        <p className="analog-list-foot">* The 0–100 score is a transparent, project-defined weighted tag match, not an official NASA assessment. Complete category descriptions do not mean complete measured datasets.</p>
      </div>
      <div className="analog-selected">
        <div className="analog-selected-head"><div><span className="eyebrow">SELECTED EARTH ANALOG</span>
          <h2>{selected.earth.name}</h2><p>{selected.earth.region}</p></div>
          <div className="analog-selected-total"><strong>{selected.score.toFixed(1)}</strong><span>SCREENING SCORE / 100</span></div></div>
        <div className="analog-earth-map"><EarthMap site={selected.earth.id} basemap="satellite" exaggeration={1.15} resetKey={0} /></div>
        <div className="analog-selected-coords"><span>{formatCoord(selected.earth.lat, 'lat')} · {formatCoord(selected.earth.lon, 'lon')}</span>
          <button onClick={() => onOpenMap(selected.earth.id)} className="subtle-button">Open full maps</button></div>
        <p className="analog-selected-reason">{selected.earth.reason}</p>
        <div className="analog-strengths"><div><strong>Strongest coverage</strong>{strengths.map(text => <p key={text}>{text}</p>)}</div>
          <div><strong>Main gaps</strong>{gaps.map(text => <p key={text}>{text}</p>)}</div></div>
        <div className="analog-selected-links"><a href={selected.earth.source} target="_blank" rel="noreferrer">Earth site evidence ↗</a>
          <a href={target.source} target="_blank" rel="noreferrer">Planetary site evidence ↗</a></div>
        <button type="button" className="primary-button analog-export" onClick={() => downloadMissionBrief(selected, picked)}>Download this field-test brief (.md)</button>
        <EarthPowerMetrics earth={selected.earth} />
      </div>
    </div>

    <section className="analog-domain-section">
      <header><div><span className="eyebrow">THE EIGHT-DOMAIN SCIENCE CHECK</span>
        <h2>Why {selected.earth.name} was matched to {target.name}</h2>
        <p>Eight evidence categories are compared at the selected documented profile. A clicked point away from that profile does not create eight new measurements.</p></div>
        <button className="subtle-button" onClick={() => setShowDomains(value => !value)}>{showDomains ? 'Collapse details' : 'Show all 8 domains'}</button>
      </header>
      {showDomains && <div className="analog-domain-grid">{DOMAINS.map(domain => <DomainComparison key={domain.id} domain={domain}
        item={selected.breakdown.find(item => item.domain === domain.id)} />)}</div>}
    </section>
    <section className="analog-limits"><strong>Where Earth's analogy stops</strong><p>{target.limitations}</p>
      <p>Orbital maps, geological descriptions and analog mission experience are mixed evidence types. The algorithm does not determine actual resource concentrations, radiation risk, safe landing ellipses, cave access, legal field access or confirmed biosignatures.</p></section>
  </div>;
}
