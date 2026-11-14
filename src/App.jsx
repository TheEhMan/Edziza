import React, { useEffect, useRef, useState } from 'react';
import EarthMap from './EarthMap.jsx';
import MarsScene from './MarsScene.jsx';
import MoonScene from './MoonScene.jsx';
import ClimatePanel from './ClimatePanel.jsx';
import ScienceAnalysis from './ScienceAnalysis.jsx';
import { DEFAULT_SITES, getSite, WORLD_LABELS, WORLD_ORDER, WORLD_SITES } from './siteData.js';

const PAGES = [
  ['compare', '01 Compare'],
  ['explore', '02 Full-screen maps'],
  ['data', '03 Environmental data'],
  ['analysis', '04 Scientific analysis'],
  ['story', '05 Mission story']
];

function WorldMap({ world, site, onSiteChange, basemap, exaggeration, resetKey }) {
  if (world === 'earth') return <EarthMap site={site} basemap={basemap} exaggeration={exaggeration} resetKey={resetKey} />;
  if (world === 'mars') return <MarsScene key={resetKey} exaggeration={exaggeration} site={site} onSiteChange={value => onSiteChange('mars', value)} />;
  return <MoonScene key={resetKey} site={site} onSiteChange={value => onSiteChange('moon', value)} />;
}

function MapCard({ world, site, onSiteChange, basemap, exaggeration, resetKey, large = false }) {
  const location = getSite(world, site);
  const sourceTags = { earth: 'MAPTERHORN / OSM', mars: 'NASA VIKING / MOLA', moon: 'NASA LRO / LOLA' };
  const footers = {
    earth: 'Earth 3D DEM + imagery; the regional grid is not a landing-site hazard survey.',
    mars: 'NASA Viking/MOLA regional topography; relief exaggerated; not rover-resolution.',
    moon: 'NASA LRO imagery; scroll/pinch to zoom the 3D globe or 2D map. NASA LOLA site elevations appear on the Data page.'
  };
  return <article className={`world-card ${large ? 'large' : ''} ${world}`}>
    <div className="world-card-head">
      <div className="card-site-heading"><span className="world-kicker">{WORLD_LABELS[world]}</span>
        <h2>{location.label}</h2></div>
      <div className="card-map-actions">
        <label className="map-location-label">LOCATION <select aria-label={`Select ${world} location`} value={site}
          onChange={event => onSiteChange(world, event.target.value)}>
          {Object.values(WORLD_SITES[world]).map(item => <option value={item.id} key={item.id}>{item.label}</option>)}
        </select></label>
        <span className="world-tag">{sourceTags[world]}</span>
      </div>
    </div>
    <div className="world-card-map">
      <WorldMap world={world} site={site} onSiteChange={onSiteChange} basemap={basemap} exaggeration={exaggeration} resetKey={resetKey} />
    </div>
    <div className="world-card-foot">{footers[world]}</div>
  </article>;
}

function Controls({ basemap, setBasemap, exaggeration, setExaggeration, onReset }) {
  return <div className="controls-bar">
    <label><span>EARTH BASEMAP</span>
      <select value={basemap} onChange={event => setBasemap(event.target.value)}>
        <option value="satellite">Satellite imagery</option>
        <option value="map">OpenStreetMap</option>
      </select>
    </label>
    <label className="slider-label"><span>EARTH / MARS TERRAIN HEIGHT: {exaggeration.toFixed(2)}×</span>
      <input type="range" min="1" max="2" step="0.05" value={exaggeration}
        onChange={event => setExaggeration(Number(event.target.value))} />
    </label>
    <button className="subtle-button" onClick={onReset}>Reset views</button>
  </div>;
}

export default function App() {
  const [page, setPage] = useState('compare');
  const [sites, setSites] = useState({ ...DEFAULT_SITES });
  const [basemap, setBasemap] = useState('satellite');
  const [exaggeration, setExaggeration] = useState(1.15);
  const [worldMode, setWorldMode] = useState('earth');
  const [resetKey, setResetKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const stageRef = useRef(null);

  const onSiteChange = (world, id) => {
    if (!WORLD_SITES[world]?.[id]) return;
    setSites(current => ({ ...current, [world]: id }));
  };

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  async function toggleFullscreen() {
    if (!document.fullscreenElement) {
      try { await stageRef.current?.requestFullscreen(); }
      catch (error) { console.warn('Fullscreen mode was not allowed:', error); }
    } else {
      try { await document.exitFullscreen(); }
      catch (error) { console.warn('Unable to exit fullscreen:', error); }
    }
  }

  const controlProps = {
    basemap, setBasemap, exaggeration, setExaggeration,
    onReset: () => { setSites({ ...DEFAULT_SITES }); setBasemap('satellite'); setExaggeration(1.15); setResetKey(n => n + 1); }
  };
  const mapProps = { onSiteChange, basemap, exaggeration, resetKey };
  const exploreWorlds = worldMode === 'triple' ? WORLD_ORDER : [worldMode];

  return <div className="app-shell">
    <header className="topbar">
      <button className="brand" onClick={() => setPage('compare')} aria-label="Project Edziza home">
        <span className="brand-icon">E</span>
        <span><strong>EDZIZA</strong><small>EARTH / MARS / MOON EXPLORER</small></span>
      </button>
      <div className="topbar-meta"><span className="status-light" /> NASA SPACE APPS | RESEARCH PROTOTYPE</div>
    </header>

    <div className="nav-wrap"><nav className="page-tabs" aria-label="Pages">
      {PAGES.map(([id, title]) => <button key={id} className={page === id ? 'active' : ''} onClick={() => setPage(id)}>{title}</button>)}
    </nav></div>

    <main className={page === 'explore' ? 'wide-main' : ''}>
      {page === 'compare' && <>
        <section className="page-heading mission-heading">
          <span className="eyebrow">THREE WORLDS / NINE FIELD SITES / TWELVE PARAMETERS</span>
          <h1>Explore Earth, Mars <em>& the Moon.</em></h1>
          <p>Start with real terrain and orbital imagery. Compare three different locations on each world, and discover what a terrestrial field test can — and cannot — tell us about future missions.</p>
          <div className="mission-pills"><span>03 worlds</span><span>09 locations</span><span>12 parameters</span><span>Evidence-first analysis</span></div>
        </section>
        <Controls {...controlProps} />
        <div className="compare-map-grid three-worlds">
          {WORLD_ORDER.map(world => <MapCard key={world} world={world} site={sites[world]} {...mapProps} />)}
        </div>
        <section className="scientific-note">
          <div><strong>Why these locations?</strong><p>Edziza is a volcanic Earth analog. Hecates, Elysium and Albor show contrasting Martian volcanic terrain. Apollo 11, Shackleton and Aristarchus explore lunar basalts, polar illumination/ice questions and volcanic deposits. This is a comparison tool, not a certified landing-site selector.</p></div>
          <button className="primary-button" onClick={() => { setPage('explore'); setWorldMode('triple'); }}>Open large maps</button>
        </section>
        <ClimatePanel sites={sites} onSiteChange={onSiteChange} compact onOpenData={() => setPage('data')} />
      </>}

      {page === 'explore' && <>
        <section className="explorer-heading">
          <div><span className="eyebrow">02 / IMMERSIVE TERRAIN EXPLORER</span>
            <h1>Three worlds to explore.</h1>
            <p>Switch maps, change locations inside each map, and inspect the source limits. Earth and Mars have elevation meshes; the Moon supports wheel/pinch zoom in 3D and 2D; NASA LOLA elevations appear on the data page, although the 3D globe still has no elevation displacement.</p>
          </div>
          <div className="world-switch" aria-label="Select map view">
            {[...WORLD_ORDER, 'triple'].map(world => <button key={world} className={worldMode === world ? 'selected' : ''}
              onClick={() => setWorldMode(world)}>{world === 'triple' ? 'All three' : world[0].toUpperCase() + world.slice(1)}</button>)}
          </div>
        </section>
        <div className="explorer-controls"><Controls {...controlProps} />
          <button className="primary-button fullscreen-btn" onClick={toggleFullscreen}>
            {isFullscreen ? 'Exit full screen (Esc)' : 'Enter full screen'}
          </button>
        </div>
        <div ref={stageRef} className={`explorer-stage ${worldMode === 'triple' ? 'triple' : ''}`}>
          {exploreWorlds.map(world => <MapCard key={world} large world={world} site={sites[world]} {...mapProps} />)}
          {isFullscreen && <button className="stage-close" onClick={toggleFullscreen}>Exit full screen</button>}
        </div>
        <div className="explore-footnote"><span>EARTH: 3D DEM / external map tiles.</span><span>MARS: 16-ppd MOLA and Viking imagery / regional relief.</span><span>MOON: LRO WAC map + LOLA gridded height values / zoom & pan / no lunar terrain mesh.</span></div>
        <ClimatePanel sites={sites} onSiteChange={onSiteChange} compact onOpenData={() => setPage('data')} />
      </>}

      {page === 'data' && <>
        <section className="page-heading"><span className="eyebrow">03 / ENVIRONMENTAL DATA</span>
          <h1>12 parameters. 9 sites. 3 worlds.</h1>
          <p>Compare position, climate, gravity, solar exposure, terrain and possible water/ice evidence. Each parameter identifies NASA POWER, MOLA, LOLA, a NASA fact sheet, site context, or unavailable measurements.</p>
        </section>
        <ClimatePanel sites={sites} onSiteChange={onSiteChange} />
      </>}

      {page === 'analysis' && <>
        <section className="page-heading"><span className="eyebrow">04 / EVIDENCE-BASED EARTH ↔ MARS TERRAIN</span>
          <h1>Which Edziza terrain best matches Mars?</h1>
          <p>Existing measured Copernicus DEM and NASA MOLA terrain analysis compares three Earth research patches to one Hecates Tholus reference. The Moon is included in the explorer and environmental comparison, but has <strong>not</strong> been added to this matched-scale DEM scoring method.</p>
        </section>
        <ScienceAnalysis onOpenMap={id => {
          onSiteChange('earth', id);
          setWorldMode('earth'); setPage('explore'); setResetKey(n => n + 1);
        }} />
      </>}

      {page === 'story' && <>
        <section className="story-page"><span className="eyebrow">05 / MISSION STORY</span>
          <h1>Before we travel there,<br /><em>we learn here.</em></h1>
          <p>Our mission starts on Earth's Mount Edziza, where lava fields and glaciers offer field-testing opportunities. We then study three volcanic locations on Mars and three different lunar environments — a basaltic landing site, a polar crater and a volcanic plateau.</p>
          <div className="story-steps">
            <article><span>01 / OBSERVE</span><h2>Choose a research question.</h2><p>Which terrain features can be tested on Earth? What makes polar Moon operations different from Mars volcanic exploration?</p></article>
            <article><span>02 / COMPARE</span><h2>Use the 12-parameter explorer.</h2><p>Separate real climate grids, planetary constants and geological evidence. Mark missing site data explicitly.</p></article>
            <article><span>03 / DESIGN</span><h2>Plan a defensible field test.</h2><p>Use measured Earth–Mars terrain comparisons to guide one analog experiment, while identifying the lunar datasets still needed.</p></article>
          </div>
          <p className="story-warning">Science limitation: Earth, Mars and Moon images are not displayed at equal scales. The lunar viewer is a textured reference globe, not measured local terrain; Apollo 11 and the pole are not interchangeable environments. No score on this site is a NASA safety certification.</p>
          <div className="source-buttons">
            <a href="https://svs.gsfc.nasa.gov/4720/" target="_blank" rel="noreferrer">NASA LRO Moon map</a>
            <a href="https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_sites.html" target="_blank" rel="noreferrer">NASA Apollo 11 coordinates</a>
            <a href="https://pds-geosciences.wustl.edu/missions/mgs/megdr.html" target="_blank" rel="noreferrer">NASA MOLA terrain</a>
            <a href="https://bcparks.ca/mount-edziza-park/" target="_blank" rel="noreferrer">BC Parks geology</a>
          </div>
          <button className="primary-button" onClick={() => { setPage('explore'); setWorldMode('triple'); }}>Explore the three worlds</button>
        </section>
      </>}
    </main>
    <footer className="site-footer"><span>EDZIZA / NASA SPACE APPS PROTOTYPE</span>
      <span>Sources: NASA POWER, NASA PDS/MOLA, NASA LRO/SVS, NASA fact sheets, BC Parks, Copernicus & Mapterhorn</span>
    </footer>
  </div>;
}
