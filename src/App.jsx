import React, { useEffect, useRef, useState } from 'react';
import EarthMap, { EDZIZA_SITES } from './EarthMap.jsx';
import MarsScene from './MarsScene.jsx';
import ClimatePanel from './ClimatePanel.jsx';
import ScienceAnalysis from './ScienceAnalysis.jsx';

const PAGES = [
  ['compare', '01 Compare'],
  ['explore', '02 Full-screen maps'],
  ['data', '03 Environmental data'],
  ['analysis', '04 Scientific analysis'],
  ['story', '05 Mission story']
];

function WorldMap({ world, site, basemap, exaggeration, resetKey }) {
  if (world === 'earth') return <EarthMap site={site} basemap={basemap} exaggeration={exaggeration} resetKey={resetKey} />;
  return <MarsScene key={resetKey} exaggeration={exaggeration} />;
}

function MapCard({ world, site, basemap, exaggeration, resetKey, large = false }) {
  return (
    <article className={`world-card ${large ? 'large' : ''} ${world}`}>
      <div className="world-card-head">
        <div>
          <span className="world-kicker">{world === 'earth' ? 'EARTH / BRITISH COLUMBIA' : 'MARS / ELYSIUM REGION'}</span>
          <h2>{world === 'earth' ? EDZIZA_SITES[site].label : 'Hecates Tholus'}</h2>
        </div>
        <span className="world-tag">{world === 'earth' ? 'MAPTERHORN DEM' : 'NASA MOLA OPTIONAL'}</span>
      </div>
      <div className="world-card-map">
        <WorldMap world={world} site={site} basemap={basemap} exaggeration={exaggeration} resetKey={resetKey} />
      </div>
      <div className="world-card-foot">
        {world === 'earth'
          ? 'Actual elevation tiles + satellite imagery. Detail limited at extreme zoom.'
          : 'NASA MOLA topography after download; elevation colors are illustrative.'}
      </div>
    </article>
  );
}

function Controls({ site, setSite, basemap, setBasemap, exaggeration, setExaggeration, onReset }) {
  return (
    <div className="controls-bar">
      <label>
        <span>EDZIZA LOCATION</span>
        <select value={site} onChange={(e) => setSite(e.target.value)}>
          <option value="snowshoe">Snowshoe Lava Field</option>
          <option value="summit">Mount Edziza summit</option>
          <option value="desolation">Desolation Lava Field</option>
        </select>
      </label>
      <label>
        <span>EARTH BASEMAP</span>
        <select value={basemap} onChange={(e) => setBasemap(e.target.value)}>
          <option value="satellite">Satellite</option>
          <option value="map">OpenStreetMap</option>
        </select>
      </label>
      <label className="slider-label">
        <span>TERRAIN HEIGHT: {exaggeration.toFixed(2)}x</span>
        <input type="range" min="1" max="2" step="0.05" value={exaggeration}
          onChange={(e) => setExaggeration(Number(e.target.value))} />
      </label>
      <button className="subtle-button" onClick={() => { setSite('snowshoe'); setBasemap('satellite'); setExaggeration(1.15); onReset(); }}>
        Reset view
      </button>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState('explore');
  const [site, setSite] = useState('snowshoe');
  const [basemap, setBasemap] = useState('satellite');
  const [exaggeration, setExaggeration] = useState(1.15);
  const [worldMode, setWorldMode] = useState('earth');
  const [resetKey, setResetKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const stageRef = useRef(null);

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  async function toggleFullscreen() {
    if (!document.fullscreenElement) {
      try { await stageRef.current?.requestFullscreen(); }
      catch (error) { console.warn('Fullscreen mode was not allowed by this browser:', error); }
    } else {
      await document.exitFullscreen();
    }
  }

  const controlProps = { site, setSite, basemap, setBasemap, exaggeration, setExaggeration, onReset: () => setResetKey((n) => n + 1) };
  const mapProps = { site, basemap, exaggeration, resetKey };

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setPage('explore')} aria-label="Project Edziza home">
          <span className="brand-icon">E</span>
          <span><strong>EDZIZA</strong><small>EARTH / MARS ANALOG EXPLORER</small></span>
        </button>
        <div className="topbar-meta"><span className="status-light" /> NASA SPACE APPS | WORKING PROTOTYPE</div>
      </header>

      <div className="nav-wrap"><nav className="page-tabs" aria-label="Pages">
        {PAGES.map(([id, title]) => (
          <button key={id} className={page === id ? 'active' : ''} onClick={() => setPage(id)}>{title}</button>
        ))}
      </nav></div>

      <main className={page === 'explore' ? 'wide-main' : ''}>
        {page === 'compare' && <>
          <section className="page-heading">
            <span className="eyebrow">ONE QUESTION / TWO WORLDS</span>
            <h1>Could Edziza help us understand Mars?</h1>
            <p>Compare terrestrial volcanic landscapes with a Mars volcano known for landforms linked to ancient water and ice.</p>
          </section>
          <Controls {...controlProps} />
          <div className="compare-map-grid">
            <MapCard world="earth" {...mapProps} />
            <MapCard world="mars" {...mapProps} />
          </div>
          <section className="scientific-note">
            <div><strong>Why Hecates Tholus?</strong><p>Researchers describe volcanic features and possible ancient ice-related landforms on its flanks. Edziza offers real lava-ice landscapes that can be studied as process analogs.</p></div>
            <button className="primary-button" onClick={() => { setPage('explore'); setWorldMode('split'); }}>Open large maps</button>
          </section>
          <ClimatePanel site={site} compact />
        </>}

        {page === 'explore' && <>
          <section className="explorer-heading">
            <div>
              <span className="eyebrow">02 / IMMERSIVE TERRAIN EXPLORER</span>
              <h1>Explore the two worlds.</h1>
              <p>Use full-size 3D maps to examine Edziza and Hecates Tholus. The views are not at the same physical scale.</p>
            </div>
            <div className="world-switch" aria-label="Select map view">
              <button className={worldMode === 'earth' ? 'selected' : ''} onClick={() => setWorldMode('earth')}>Earth</button>
              <button className={worldMode === 'mars' ? 'selected' : ''} onClick={() => setWorldMode('mars')}>Mars</button>
              <button className={worldMode === 'split' ? 'selected' : ''} onClick={() => setWorldMode('split')}>Side by side</button>
            </div>
          </section>
          <div className="explorer-controls">
            <Controls {...controlProps} />
            <button className="primary-button fullscreen-btn" onClick={toggleFullscreen}>
              {isFullscreen ? 'Exit full screen (Esc)' : 'Enter full screen'}
            </button>
          </div>
          <div ref={stageRef} className={`explorer-stage ${worldMode}`}>
            {(worldMode === 'earth' || worldMode === 'split') && <MapCard large world="earth" {...mapProps} />}
            {(worldMode === 'mars' || worldMode === 'split') && <MapCard large world="mars" {...mapProps} />}
            {isFullscreen && <button className="stage-close" onClick={toggleFullscreen}>Exit full screen</button>}
          </div>
          <div className="explore-footnote">
            <span>EARTH: zoom capped at 13.5 and tilt capped at 70 degrees to reduce blurry or distorted close-ups.</span>
            <span>MARS: MOLA (~3-4 km spacing) is too coarse for rover-level zooming.</span>
          </div>
          <ClimatePanel site={site} compact />
        </>}

        {page === 'data' && <>
          <section className="page-heading">
            <span className="eyebrow">03 / DATA & ENVIRONMENT</span>
            <h1>Environment and evidence.</h1>
            <p>Earth climate comes from a NASA POWER gridded climatology API. Mars numbers are clearly distinguished between planetary reference data and unavailable local observations.</p>
          </section>
          <div className="data-site-pick">
            <label htmlFor="data-site">EDZIZA REGION</label>
            <select id="data-site" value={site} onChange={(e) => setSite(e.target.value)}>
              <option value="snowshoe">Snowshoe Lava Field</option>
              <option value="summit">Mount Edziza summit</option>
              <option value="desolation">Desolation Lava Field</option>
            </select>
          </div>
          <ClimatePanel site={site} />
        </>}

        {page === 'analysis' && <>
          <section className="page-heading">
            <span className="eyebrow">04 / EVIDENCE-BASED COMPARISON</span>
            <h1>Which Edziza terrain best matches Mars?</h1>
            <p>Measured slopes, roughness, and elevation changes from Copernicus DEM and NASA MOLA terrain data. Compare three candidate study areas, then examine the strongest one in 3D.</p>
          </section>
          <ScienceAnalysis onOpenMap={(id) => {
            setSite(id);
            setWorldMode('earth');
            setPage('explore');
            setResetKey(n => n + 1);
          }} />
        </>}

        {page === 'story' && <>
          <section className="story-page">
            <span className="eyebrow">05 / MISSION STORY</span>
            <h1>Before we travel there,<br /><em>we learn here.</em></h1>
            <p>Mount Edziza is a volcanic landscape with lava fields, cones and glaciers. On Mars, Hecates Tholus is a volcano where orbiters have documented possible past interactions among volcanism, water and ice.</p>
            <div className="story-steps">
              <article><span>01 / OBSERVE</span><h2>Choose a Martian problem.</h2><p>How could lava have interacted with ancient ice? What terrain might a robot encounter?</p></article>
              <article><span>02 / INVESTIGATE</span><h2>Study the Earth analog.</h2><p>Explore a smaller region within Edziza and measure what is genuinely comparable.</p></article>
              <article><span>03 / TEST</span><h2>Make a defensible mission recommendation.</h2><p>Use terrain slope, landforms and geology to support a specific field test. Do not claim climate or gravity matches.</p></article>
            </div>
            <p className="story-warning">Scientific limitation: our MOLA map is regional-scale, colored by elevation rather than actual Martian surface imagery. Use the scientific analysis page to compare matched-scale elevation samples. Terrain shape alone does not establish geology, field accessibility, or rover safety.</p>
            <div className="source-buttons">
              <a href="https://hirise.lpl.arizona.edu/PSP_010678_2135" target="_blank" rel="noreferrer">NASA HiRISE evidence</a>
              <a href="https://pds-geosciences.wustl.edu/missions/mgs/megdr.html" target="_blank" rel="noreferrer">NASA MOLA dataset</a>
              <a href="https://bcparks.ca/mount-edziza-park/" target="_blank" rel="noreferrer">BC Parks geology</a>
            </div>
            <button className="primary-button" onClick={() => { setPage('explore'); setWorldMode('split'); }}>Explore the landscapes</button>
          </section>
        </>}
      </main>
      <footer className="site-footer">
        <span>EDZIZA / SPACE APPS</span>
        <span>Sources: BC Parks, NASA POWER, NASA PDS MOLA, NASA HiRISE, ESA, Mapterhorn</span>
      </footer>
    </div>
  );
}
