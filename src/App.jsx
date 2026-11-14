import React, { useEffect, useRef, useState } from 'react';
import EarthMap from './EarthMap.jsx';
import MarsScene from './MarsScene.jsx';
import MoonScene from './MoonScene.jsx';
import ScienceAnalysis from './ScienceAnalysis.jsx';
import AnalogFinder from './AnalogFinder.jsx';
import { rankAnalogs } from './analogRanking.js';
import { DOMAINS, EARTH_ANALOGS, TARGETS, DEFAULT_WEIGHTS, getTarget, getEarthAnalog } from './analogData.js';
import { DEFAULT_SITES, getSite, WORLD_LABELS, WORLD_ORDER, WORLD_SITES } from './siteData.js';
import { nearestReferenceSite } from './planetarySelection.js';

const PAGES = [
  ['finder', '01 Find Earth analog'],
  ['explore', '02 Interactive maps'],
  ['evidence', '03 Eight data domains'],
  ['analysis', '04 Measured terrain'],
  ['method', '05 Research & method']
];

function WorldMap({ world, site, picked, onPick, onSiteChange, basemap, exaggeration, resetKey }) {
  if (world === 'earth') return <EarthMap site={site} basemap={basemap} exaggeration={exaggeration} resetKey={resetKey} />;
  if (world === 'mars') return <MarsScene key={resetKey} exaggeration={exaggeration} site={site} picked={picked} onPick={(lat, lon, elev) => onPick('mars', lat, lon, elev)} onSiteChange={value => onSiteChange('mars', value)} />;
  return <MoonScene key={resetKey} site={site} picked={picked} onPick={(lat, lon, elev) => onPick('moon', lat, lon, elev)} onSiteChange={value => onSiteChange('moon', value)} />;
}

function MapCard({ world, site, picked, onPick, onFindAnalog, onSiteChange, basemap, exaggeration, resetKey }) {
  const location = world === 'earth'
    ? (EARTH_ANALOGS.find(item => item.id === site) || getSite(world, site))
    : getSite(world, site);
  const tags = { earth: 'FIELD SITE / TERRAIN', mars: 'NASA VIKING / MOLA', moon: 'NASA LRO / LOLA' };
  return <article className={`world-card large ${world}`}>
    <div className="world-card-head">
      <div className="card-site-heading"><span className="world-kicker">{WORLD_LABELS[world]}</span><h2>{location.label || location.name}</h2></div>
      <div className="card-map-actions">
        <label className="map-location-label">LOCATION
          <select aria-label={`Select ${world} map site`} value={site} onChange={event => onSiteChange(world, event.target.value)}>
            {(world === 'earth' ? EARTH_ANALOGS : Object.values(WORLD_SITES[world])).map(item => <option value={item.id} key={item.id}>{item.label || item.name}</option>)}
          </select>
        </label><span className="world-tag">{tags[world]}</span>
      </div>
    </div>
    <div className="world-card-map"><WorldMap world={world} site={site} picked={picked} onPick={onPick} onSiteChange={onSiteChange}
      basemap={basemap} exaggeration={exaggeration} resetKey={resetKey} /></div>
    {picked && world !== 'earth' && <div className="map-picked-action"><span>Picked: {picked.lat.toFixed(3)}°, {picked.lon.toFixed(3)}° · comparison profile: {picked.referenceName}</span>
      <button type="button" className="primary-button" onClick={() => onFindAnalog(world)}>Find Earth analogs</button></div>}
    <div className="world-card-foot">{world === 'moon'
      ? 'Moon: 3D globe; measured NASA LOLA relief when loaded. Click to choose coordinates; profiles are nearby reference estimates, not exact-pixel geology.'
      : world === 'mars' ? 'Mars: click anywhere within the displayed Elysium 3D regional NASA Viking/MOLA map; this is not a global globe or rover-scale survey.'
      : 'Earth imagery, terrain and pins are map visualizations; confirm field-site access independently.'}</div>
  </article>;
}

function EvidencePage({ targetWorld, targetId, earthId }) {
  const target = getTarget(targetWorld, targetId);
  const earth = getEarthAnalog(earthId);
  const rows = [
    ['geology', 'NASA/USGS geologic context + local geology', 'USGS Mars map, THEMIS mineral imagery', 'Unified lunar geology, LRO/WAC', 'Detailed mineral fractions are not uniformly sampled'],
    ['terrain', 'Copernicus DEM; Earth terrain models', 'NASA MOLA elevation grids', 'NASA LOLA/SLDEM elevation grids', 'Different horizontal resolutions and vertical datums'],
    ['thermal', 'NASA POWER climatic temperature and solar energy', 'THEMIS/TES thermal observations', 'LRO Diviner, LROC polar illumination', 'No same-time temperature series for all selected sites'],
    ['resources', 'Earth ice/permafrost and field geological records', 'SWIM/SHARAD regional ice evidence', 'LRO polar ice/cold-trap context', 'Potential resources ≠ measured extractable inventory'],
    ['dust', 'NASA POWER wind, desert field observations', 'THEMIS dust/aeolian evidence', 'Regolith and electrostatic science; no atmospheric wind', 'Different dust transport mechanisms'],
    ['biology', 'NASA astrobiology and field laboratory research', 'No confirmed life; test biosignature methods', 'No confirmed life; contamination-control research', 'Planetary biological quantities cannot be populated by inventing a life signal'],
    ['subsurface', 'Documented Earth lava tubes, cave geology, ice-cemented ground', 'NASA THEMIS candidate skylights, subsurface sounding', 'LRO pits and rilles, lunar subsurface hypotheses', 'A feature near a site is not a confirmed accessible cave'],
    ['operations', 'NASA field-operation analog reports; maps', 'Slope, roughness, mission constraints from orbital data', 'Lunar polar illumination, rover terrain and surface science', 'Not a formal landing site, safety, permits or mission feasibility review']
  ];
  const reference = [
    ['NASA POWER', 'https://power.larc.nasa.gov/docs/services/api/temporal/climatology/'],
    ['NASA Moon Trek', 'https://trek.nasa.gov/moon/'],
    ['NASA Mars Trek', 'https://trek.nasa.gov/mars/'],
    ['NASA MOLA archive', 'https://pds-geosciences.wustl.edu/missions/mgs/megdr.html'],
    ['NASA LRO/LOLA elevation & imagery', 'https://svs.gsfc.nasa.gov/4720/'],
    ['NASA Diviner temperature datasets', 'https://www.diviner.ucla.edu/data'],
    ['NASA astrobiology Earth field-site catalogue', 'https://astrobiology.nasa.gov/research-locations/'],
    ['USGS 2020 unified lunar geologic map', 'https://astrogeology.usgs.gov/search/map/Moon/Geology/Unified_Geologic_Map_of_the_Moon_GIS_v2/'],
    ['USGS 2014 geologic map of Mars', 'https://pubs.usgs.gov/sim/3292/']
  ];
  return <section className="analog-research-hero">
    <span className="eyebrow">03 / SCIENTIFIC INPUT COVERAGE</span>
    <h1>Eight categories, always documented.</h1>
    <p>Both the selected planetary target and every Earth candidate have eight evidence-backed descriptions. This is <strong>complete profile coverage</strong>, not a claim that eight comparable NASA measurements exist at every point.</p>
    <div className="mission-pills"><span>{TARGETS.length} Mars / Moon profiles</span><span>{EARTH_ANALOGS.length} Earth profiles</span><span>8 / 8 domain categories</span><span>Sources per domain</span></div>
    <h2>Dataset strategy</h2>
    <div style={{overflowX:'auto'}}><table className="analog-research-table">
      <thead><tr><th>DOMAIN</th><th>EARTH</th><th>MARS</th><th>MOON</th><th>IMPORTANT LIMIT</th></tr></thead>
      <tbody>{rows.map(row => <tr key={row[0]}><td><strong>{DOMAINS.find(item => item.id === row[0]).label}</strong></td>
        {row.slice(1).map((value,index) => <td key={index}>{value}</td>)}</tr>)}</tbody>
    </table></div>
    <div className="analog-research-grid">
      <article className="analog-research-card"><span className="analog-research-label">CURRENT TARGET</span><h2>{target.name}</h2>
        <p>{target.mission}</p>{DOMAINS.map(domain => <p key={domain.id}><strong>{domain.short}:</strong> {target.domains[domain.id].observation}</p>)}</article>
      <article className="analog-research-card"><span className="analog-research-label">CURRENT EARTH CANDIDATE</span><h2>{earth.name}</h2>
        <p>{earth.region}</p>{DOMAINS.map(domain => <p key={domain.id}><strong>{domain.short}:</strong> {earth.domains[domain.id].summary}</p>)}</article>
    </div>
    <div className="analog-research-card"><h2>Primary reference catalogues</h2>
      <div className="source-buttons">{reference.map(([name, url]) => <a key={name} href={url} target="_blank" rel="noreferrer">{name} ↗</a>)}</div>
      <p>For the actual measurement-backed 12 km matched terrain demonstration, see the separate Measured terrain tab. Do not treat this eight-domain tag ranking as an orbital numerical extraction.</p>
    </div>
  </section>;
}

function MethodPage({ onFind }) {
  return <section className="analog-research-hero">
    <span className="eyebrow">05 / MISSION USERS, PREEXISTING WORK & LIMITS</span>
    <h1>Not another planet map. A decision-support research shortlist.</h1>
    <p>NASA already maintains powerful lunar and Martian data viewers. This tool addresses the next practical question: which Earth landscape would help a mission team practice a particular planetary task?</p>
    <div className="analog-research-grid">
      <div className="analog-research-card"><span className="analog-research-label">THE PROBLEM</span><h2>From planetary mission need to testable Earth field site</h2>
        <p>Site researchers must combine geology, morphology, environmental extremes, possible resources and the experimental purpose. A visually similar site can be a scientifically poor analog.</p>
        <p><strong>Primary user:</strong> planetary field-science or instrument-validation team preparing a study or a field campaign. Also useful to educators and rover-test engineers.</p>
        <a href="https://www.nasa.gov/core-capability-6-analog-research-instrument-development/" target="_blank" rel="noreferrer">NASA fieldwork and instrument testing ↗</a></div>
      <div className="analog-research-card"><span className="analog-research-label">WHAT THE USER RECEIVES</span><h2>A defendable research starting point</h2>
        <p>Select Mars or Moon site → choose mission-priority weights → rank Earth candidates → inspect all eight domains → expose weak matches and planetary physics that Earth cannot simulate → open the map and research source links.</p>
        <p>Researchers still need to verify precise boundaries, permits, field access, high-resolution data and experimental validation.</p>
        <a href="https://www.nasa.gov/analog-missions/" target="_blank" rel="noreferrer">NASA Analog Missions ↗</a></div>
    </div>
    <h2>Existing solutions — and our specific difference</h2>
    <div style={{overflowX:'auto'}}><table className="analog-research-table">
      <thead><tr><th>EXISTING RESOURCE</th><th>WHAT IT DOES WELL</th><th>WHERE EDZIZA ADDS VALUE</th></tr></thead>
      <tbody>
        <tr><td><a href="https://trek.nasa.gov/moon/" target="_blank" rel="noreferrer">NASA Moon Trek</a></td><td>Rich lunar orbital layers, distances, elevation, lighting, slope tools.</td><td>Connect a selected lunar objective to multiple ranked Earth test environments.</td></tr>
        <tr><td><a href="https://trek.nasa.gov/mars/" target="_blank" rel="noreferrer">NASA Mars Trek</a></td><td>Mars surface data layers, imagery, 3D and terrain analysis.</td><td>Suggest Earth field-test alternatives, evidence and specific mission relevance.</td></tr>
        <tr><td><a href="https://science.nasa.gov/solar-system/analog-explorer/" target="_blank" rel="noreferrer">NASA Analog Explorer</a></td><td>Explanatory curated Earth–planet image pairs.</td><td>Searchable list and mission-weighted ranking with auditable domain-level reasons.</td></tr>
        <tr><td><a href="https://www.nasa.gov/reference/jsc-analogs-mockups/" target="_blank" rel="noreferrer">JSC Rock Yard</a></td><td>Purpose-built terrestrial rover and surface-hardware test terrain.</td><td>Find natural field settings and geology/surface-process research contexts.</td></tr>
      </tbody>
    </table></div>
    <div className="analog-research-grid">
      <div className="analog-research-card"><h2>How the screening score works</h2>
        <p>Each planetary target defines practical Earth field-test goals for eight domains. Each Earth site has evidence-guided characteristics. For each domain:</p>
        <p><strong>Domain score = 100 × matched goal tags ÷ total goal tags.</strong></p>
        <p>The 8 scores are combined using adjustable user-selected weights. This is transparent categorical matching, not an independently validated geospatial ML model or an evidence-weighted physical similarity index.</p>
        <p>Selection can change when the research mission changes. A best match for geology may be a poor analog for ice drilling or contamination control.</p></div>
      <div className="analog-research-card"><h2>What we refuse to overclaim</h2>
        <p>NASA rover/landing engineers would not use this prototype to choose a flight destination. We have not ingested all published global raster layers for each candidate, completed a statistically validated benchmark, or proven a newly discovered analog.</p>
        <p><strong>Next scientific step:</strong> compute identical-footprint slope/roughness from Earth DEM, Mars MOLA and lunar LOLA; add matched-source temperature time series and calibrated spectroscopy, then review shortlists with domain experts.</p>
        <p>The Moon has no normal atmospheric wind and neither the Moon nor Mars has confirmed indigenous life. There is no valid way to replace these facts with fake numeric readings.</p></div>
    </div>
    <button className="primary-button" onClick={onFind}>Run the analog finder</button>
  </section>;
}

export default function App() {
  const [page, setPage] = useState('finder');
  const [sites, setSites] = useState({ ...DEFAULT_SITES, moon: 'shackleton' });
  const [targetWorld, setTargetWorld] = useState('moon');
  const [pickedPoints, setPickedPoints] = useState({ mars: null, moon: null });
  const [earthId, setEarthId] = useState(null);
  const [weights, setWeights] = useState({ ...DEFAULT_WEIGHTS });
  const [basemap, setBasemap] = useState('satellite');
  const [exaggeration, setExaggeration] = useState(1.15);
  const [worldMode, setWorldMode] = useState('earth');
  const [resetKey, setResetKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const stageRef = useRef(null);

  const onSiteChange = (world, id) => {
    const valid = world === 'earth'
      ? EARTH_ANALOGS.some(item => item.id === id)
      : Boolean(WORLD_SITES[world]?.[id]);
    if (!valid) return;
    setSites(old => ({ ...old, [world]: id }));
    if (world === 'mars' || world === 'moon') {
      setPickedPoints(old => ({ ...old, [world]: null }));
      setEarthId(null);
    }
    if (world === 'earth') setEarthId(id);
  };
  // Use a clicked coordinate as a GEOGRAPHICAL selection, but rank against the
  // nearest documented research profile (which may be far away on the Moon).
  const onPlanetPick = (world, lat, lon, elevationMetres = null) => {
    const selection = nearestReferenceSite(world, lat, lon);
    setPickedPoints(old => ({ ...old, [world]: { ...selection, elevationMetres: Number.isFinite(elevationMetres) ? elevationMetres : null } }));
    setSites(old => ({ ...old, [world]: selection.referenceId }));
    setTargetWorld(world);
    setEarthId(null);
  };
  const changeWorld = value => { setTargetWorld(value); setEarthId(null); };
  const chooseEarth = value => { setEarthId(value); setSites(old => ({ ...old, earth: value })); };
  const openEarthMap = id => { chooseEarth(id); setWorldMode('earth'); setPage('explore'); setResetKey(n => n + 1); };

  useEffect(() => {
    const change = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', change);
    return () => document.removeEventListener('fullscreenchange', change);
  }, []);
  async function toggleFullscreen() {
    try { if (document.fullscreenElement) await document.exitFullscreen();
      else await stageRef.current?.requestFullscreen(); }
    catch (error) { console.warn('Browser could not toggle full screen', error); }
  }
  const selectedEarthId = earthId || rankAnalogs(getTarget(targetWorld, sites[targetWorld]), weights)[0].earth.id;
  const exploreWorlds = worldMode === 'triple' ? WORLD_ORDER : [worldMode];

  return <div className="app-shell">
    <header className="topbar">
      <button className="brand" onClick={() => setPage('finder')} aria-label="EDZIZA Analog Finder home">
        <span className="brand-icon">E</span><span><strong>EDZIZA</strong><small>PLANETARY ANALOG FINDER</small></span>
      </button>
      <div className="topbar-meta"><span className="status-light" /> NASA SPACE APPS | INDEPENDENT RESEARCH PROTOTYPE</div>
    </header>
    <div className="nav-wrap"><nav className="page-tabs" aria-label="Pages">
      {PAGES.map(([id,label]) => <button key={id} className={page === id ? 'active' : ''} onClick={() => setPage(id)}>{label}</button>)}
    </nav></div>
    <main className={page === 'explore' ? 'wide-main' : ''}>
      {page === 'finder' && <AnalogFinder targetWorld={targetWorld} onWorldChange={changeWorld} sites={sites}
        onSiteChange={onSiteChange} onPlanetPick={onPlanetPick} pickedPoints={pickedPoints} earthId={selectedEarthId} onEarthChange={chooseEarth}
        weights={weights} onWeightChange={setWeights} onOpenMap={openEarthMap} />}
      {page === 'explore' && <>
        <section className="explorer-heading"><div><span className="eyebrow">02 / EARTH-MARS-MOON INTERACTIVE MAPS</span>
          <h1>Choose a planetary location in 3D.</h1><p>Pick any point in the displayed Mars Elysium region or on the Moon globe; then open Earth analog results. Earth terrain and imagery; Mars NASA Viking/MOLA; Moon LRO/LOLA when loaded. Each viewer uses different data resolution and cannot directly certify landing-site safety.</p></div>
          <div className="world-switch" aria-label="Select body to explore">
            {[...WORLD_ORDER, 'triple'].map(world => <button key={world} className={worldMode === world ? 'selected' : ''}
              onClick={() => setWorldMode(world)}>{world === 'triple' ? 'All three' : world[0].toUpperCase() + world.slice(1)}</button>)}
          </div></section>
        <div className="explorer-controls"><div className="controls-bar">
          <label><span>EARTH MAP</span><select value={basemap} onChange={event => setBasemap(event.target.value)}>
            <option value="satellite">Satellite imagery</option><option value="map">Street/terrain map</option></select></label>
          <label className="slider-label"><span>TERRAIN EXAGGERATION · {exaggeration.toFixed(2)}×</span>
            <input type="range" min="1" max="2" step="0.05" value={exaggeration} onChange={event => setExaggeration(Number(event.target.value))}/></label>
          <button className="subtle-button" onClick={() => setResetKey(n => n + 1)}>Reset cameras</button>
        </div><button className="primary-button fullscreen-btn" onClick={toggleFullscreen}>
            {isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}</button></div>
        <div ref={stageRef} className={`explorer-stage ${worldMode === 'triple' ? 'triple' : ''}`}>
          {exploreWorlds.map(world => <MapCard key={world} world={world} site={world === 'earth' ? selectedEarthId : sites[world]} onSiteChange={onSiteChange}
            picked={pickedPoints[world]} onPick={onPlanetPick} onFindAnalog={value => { setTargetWorld(value); setPage('finder'); }}
            basemap={basemap} exaggeration={exaggeration} resetKey={resetKey} />)}
          {isFullscreen && <button className="stage-close" onClick={toggleFullscreen}>Exit fullscreen</button>}
        </div>
        <div className="explore-footnote"><span>EARTH: external tiles and terrain DEM</span><span>MARS: NASA Viking imagery and MOLA</span><span>MOON: NASA LRO imagery / LOLA terrain when fetched</span></div>
        <button className="primary-button" onClick={() => setPage('finder')}>Back to Earth analog ranking</button>
      </>}
      {page === 'evidence' && <EvidencePage targetWorld={targetWorld} targetId={sites[targetWorld]} earthId={selectedEarthId} />}
      {page === 'analysis' && <>
        <section className="page-heading"><span className="eyebrow">04 / MEASURED DEM ANALYSIS / SEPARATE EXPERIMENT</span>
          <h1>How well does Edziza terrain match one Mars area?</h1>
          <p>Preserved 12 km × 12 km Earth–Mars DEM experiment: three Edziza field patches versus one Hecates Tholus patch. These DEM-derived numbers are independently measured from the new eight-domain, qualitative research screening.</p></section>
        <ScienceAnalysis onOpenMap={id => openEarthMap(id)} />
      </>}
      {page === 'method' && <MethodPage onFind={() => setPage('finder')} />}
    </main>
    <footer className="site-footer"><span>EDZIZA / NASA SPACE APPS CHALLENGE / RESEARCH PROTOTYPE</span>
      <span>11 Earth analogs · 6 planetary targets · 8 evidence-covered domains · Ranking is not an official NASA score</span>
    </footer>
  </div>;
}
