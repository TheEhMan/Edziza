import React, { useEffect, useMemo, useState } from 'react';
import { WORLD_ORDER, WORLD_LABELS, WORLD_SITES, getSite, formatCoord } from './siteData.js';
import { PARAMETERS } from './parameters.js';
import { getMarsElevations, getMoonElevations } from './nasaElevation.js';

const MONTHS = [
  ['ANN', 'Annual average'], ['JAN', 'January'], ['FEB', 'February'], ['MAR', 'March'],
  ['APR', 'April'], ['MAY', 'May'], ['JUN', 'June'], ['JUL', 'July'],
  ['AUG', 'August'], ['SEP', 'September'], ['OCT', 'October'], ['NOV', 'November'], ['DEC', 'December']
];


const FACTS = {
  earth: { gravity: '9.80 m/s²', solarDay: '24.00 h', orbitalSolar: '1,361 W/m²' },
  mars: { gravity: '3.73 m/s²', solarDay: '24.66 h', orbitalSolar: '586 W/m²' },
  moon: { gravity: '1.62 m/s²', solarDay: '29.53 Earth days', orbitalSolar: '1,361 W/m²' }
};
const SOURCE_URLS = {
  nasaPower: 'https://power.larc.nasa.gov/docs/services/api/temporal/climatology/',
  mars: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html',
  moon: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html',
  earth: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html',
  lunarCoords: 'https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_sites.html',
  mola: 'https://pds-geosciences.wustl.edu/missions/mgs/megdr.html',
  lola: 'https://svs.gsfc.nasa.gov/4720/'
};

function usePowerClimate(earthSite) {
  const [result, setResult] = useState({ status: 'loading', data: null, url: '' });
  const location = getSite('earth', earthSite);
  const url = useMemo(() => {
    const q = new URLSearchParams({
      parameters: 'T2M,RH2M,PS,WS10M,ALLSKY_SFC_SW_DWN',
      community: 'AG', longitude: String(location.lon), latitude: String(location.lat), format: 'JSON'
    });
    return `https://power.larc.nasa.gov/api/temporal/climatology/point?${q.toString()}`;
  }, [location.lon, location.lat]);

  useEffect(() => {
    const controller = new AbortController();
    setResult({ status: 'loading', data: null, url });
    fetch(url, { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error(`NASA POWER HTTP ${response.status}`); return response.json(); })
      .then(json => {
        const data = json?.properties?.parameter;
        if (!data?.T2M || !data?.RH2M) throw new Error('Unexpected NASA POWER response');
        setResult({ status: 'ready', data, url });
      })
      .catch(error => { if (error.name !== 'AbortError') setResult({ status: 'error', data: null, url }); });
    return () => controller.abort();
  }, [url]);
  return result;
}

function useNasaDEM() {
  const [dem, setDem] = useState({
    mars: { status: 'loading', data: null },
    moon: { status: 'loading', data: null }
  });
  useEffect(() => {
    let active = true;
    for (const [world, load] of [['mars', getMarsElevations], ['moon', getMoonElevations]]) {
      load()
        .then(data => { if (active) setDem(old => ({ ...old, [world]: { status: 'ready', data } })); })
        .catch(error => {
          console.warn(`NASA ${world} elevation data:`, error);
          if (active) setDem(old => ({ ...old, [world]: { status: 'error', data: null } }));
        });
    }
    return () => { active = false; };
  }, []);
  return dem;
}

function getMetric(id, world, location, power, month, dem) {
  const site = location;
  const planet = FACTS[world];
  const factsUrl = SOURCE_URLS[world];
  const cell = (value, status, note, sourceUrl = null, sourceLabel = 'Source') =>
    ({ value, status, note, sourceUrl, sourceLabel });
  const ref = (value, note = 'NASA planet-wide reference, not a measurement at this research site.') =>
    cell(value, 'NASA FACT SHEET', note, factsUrl, 'NASA fact sheet');
  const siteValue = (value, note) =>
    cell(value, 'SITE CONTEXT', note, site.evidence, 'Site reference');
  const missing = note => cell('Not available', 'NO LOCAL DATA', note);
  const earthPower = (key, unit, digits = 1) => {
    if (power.status !== 'ready') {
      return missing(power.status === 'error'
        ? 'NASA POWER request failed; no placeholder number has been substituted.'
        : 'Waiting for the NASA POWER gridded climatology...');
    }
    const value = Number(power.data?.[key]?.[month]);
    if (!Number.isFinite(value) || value <= -990) return missing('No valid NASA POWER climatology value was returned.');
    return cell(`${value.toFixed(digits)} ${unit}`, 'NASA POWER',
      'Grid-based climatological mean for these coordinates; not a weather station or current conditions.',
      power.url, 'NASA POWER response');
  };
  switch (id) {
    case 'latitude': return siteValue(formatCoord(site.lat, 'lat'), 'Selected landmark or representative research-area coordinate.');
    case 'longitude': return siteValue(formatCoord(site.lon, 'lon'), 'Selected landmark or representative research-area coordinate.');
    case 'temperature': return world === 'earth' ? earthPower('T2M', '°C')
      : world === 'mars' ? ref('−59 °C', 'NASA Mars planet-wide mean temperature; NOT a temperature measurement at this volcano.')
      : missing('Lunar sunlit and shadowed temperatures differ strongly. No site/time-specific NASA thermal dataset is integrated.');
    case 'pressure': return world === 'earth' ? earthPower('PS', 'kPa')
      : world === 'mars' ? ref('0.636 kPa', 'NASA Mars reference surface pressure; local elevation and season can change it substantially.')
      : ref('Near vacuum', 'NASA Moon reference: very thin exosphere, not a conventional atmosphere.');
    case 'humidity': return world === 'earth' ? earthPower('RH2M', '%', 0)
      : world === 'mars' ? missing('No verified NASA relative-humidity measurement at this Mars volcanic location.')
      : cell('N/A', 'NO ATMOSPHERE', 'Conventional near-surface relative humidity is not applicable to the lunar exosphere.', factsUrl, 'NASA fact sheet');
    case 'wind': return world === 'earth' ? earthPower('WS10M', 'm/s')
      : world === 'mars' ? missing('No NASA wind-speed reading at this selected Mars volcano. Data from a rover elsewhere is not transferable.')
      : cell('N/A', 'NO ATMOSPHERE', 'There is no conventional surface atmospheric wind on the Moon.', factsUrl, 'NASA fact sheet');
    case 'surfaceSolar': return world === 'earth' ? earthPower('ALLSKY_SFC_SW_DWN', 'kWh/m²/day', 2)
      : missing('No verified time-, season-, and terrain-specific NASA surface-insolation estimate is integrated for this site.');
    case 'gravity': return ref(planet.gravity);
    case 'solarDay': return ref(planet.solarDay, 'NASA average solar day; not a prediction of illumination duration or eclipse at this coordinate.');
    case 'elevation': {
      if (world === 'earth') return missing('An Earth site-point elevation dataset has not been integrated; the existing Earth terrain-analysis footprint is separate.');
      const entry = dem?.[world];
      const name = world === 'mars' ? 'MOLA' : 'LOLA';
      if (!entry || entry.status === 'loading') return cell('Loading NASA DEM…', 'NASA DATA LOADING', `Retrieving NASA ${name} gridded altimetry.`);
      if (entry.status === 'error') return missing(world === 'moon'
        ? 'NASA LOLA GeoTIFF could not load. Check the network or run npm run fetch:nasa before a static build.'
        : 'Bundled NASA MOLA elevation samples are missing or invalid. Run npm run refresh:mars-sites.');
      const value = entry.data?.sites?.[site.id]?.elevationMetres;
      if (!Number.isFinite(value)) return missing(`No valid ${name} DEM cell at these approximate coordinates.`);
      return cell(`${Math.round(value).toLocaleString('en-US')} m`, `NASA ${name}`,
        world === 'mars'
          ? 'MOLA 16-pixel/degree grid; bilinear elevation above the Mars areoid. Regional estimate, not a site altimeter measurement.'
          : 'LOLA 4-pixel/degree grid; nearest-cell elevation above the 1,737.4-km lunar reference sphere. Very coarse near a landing site.',
        entry.data?.sourcePage || entry.data?.sourceUrl,
        world === 'mars' ? 'NASA MOLA archive' : 'NASA LOLA DEM');
    }
    case 'terrain': return siteValue(site.terrain, 'Regional geology supported by the cited site research; not inferred from the map colors.');
    case 'ice': return siteValue(site.ice, 'Qualitative regional evidence; no local ice abundance or extraction suitability is asserted.');
    default: return missing('Unknown parameter.');
  }
}

function LocationSelector({ world, value, onChange }) {
  return <label className="data-location-select"><span>SELECT {world.toUpperCase()} LOCATION</span>
    <select value={value} onChange={event => onChange?.(world, event.target.value)}>
      {Object.values(WORLD_SITES[world]).map(location => <option key={location.id} value={location.id}>{location.label}</option>)}
    </select>
  </label>;
}

function DataWorld({ world, siteId, onSiteChange, power, month, dem, compact }) {
  const location = getSite(world, siteId);
  const rows = compact ? PARAMETERS.filter(p => ['temperature', 'elevation', 'ice'].includes(p.id)) : PARAMETERS;
  return <article className={`parameter-world parameter-${world}`}>
    <header className="parameter-world-head">
      <span className={`planet-indicator ${world}`} />
      <div><span className="parameter-eyebrow">{WORLD_LABELS[world]}</span><h3>{location.label}</h3></div>
    </header>
    {!compact && <LocationSelector world={world} value={siteId} onChange={onSiteChange} />}
    <div className="parameter-rows">
      {rows.map(parameter => {
        const metric = getMetric(parameter.id, world, location, power, month, dem);
        return <div key={parameter.id} className="parameter-row" title={parameter.detail}>
          <div className="parameter-row-title"><span className="parameter-counter">{String(PARAMETERS.indexOf(parameter) + 1).padStart(2, '0')}</span>
            <span>{parameter.label}</span></div>
          <strong>{metric.value}</strong>
          <span className={`parameter-status ${metric.status === 'NO LOCAL DATA' || metric.status === 'NO ATMOSPHERE' ? 'muted' : ''}`}>{metric.status}</span>
          {!compact && <><p>{metric.note}</p>{metric.sourceUrl && <a className="parameter-row-source" href={metric.sourceUrl} target="_blank" rel="noreferrer">{metric.sourceLabel}</a>}</>}
        </div>;
      })}
    </div>
    {!compact && <div className="parameter-world-foot"><p>{location.description}</p>
      <a href={location.evidence} target="_blank" rel="noreferrer">Study location reference</a></div>}
  </article>;
}

export default function ClimatePanel({ sites = { earth: 'snowshoe', mars: 'hecates', moon: 'apollo11' }, onSiteChange, compact = false, onOpenData }) {
  const [month, setMonth] = useState('ANN');
  const [focus, setFocus] = useState('all');
  const power = usePowerClimate(sites.earth);
  const dem = useNasaDEM();
  const worlds = compact || focus === 'all' ? WORLD_ORDER : [focus];
  return <section className={`climate-panel ${compact ? 'compact' : ''}`}>
    <header className="climate-header">
      <div><span className="eyebrow">03 WORLDS / 09 LOCATIONS / 12 PARAMETERS</span>
        <h2>{compact ? 'A quick environmental contrast' : 'Explore 12 scientific parameters'}</h2>
        <p>Compare places, but keep local measurements separate from global references and unknowns.</p>
      </div>
      <div className="month-control"><label htmlFor={compact ? 'climate-month-small' : 'climate-month'}>Earth NASA POWER period</label>
        <select id={compact ? 'climate-month-small' : 'climate-month'} value={month} onChange={event => setMonth(event.target.value)}>
          {MONTHS.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </select>
      </div>
    </header>
    {!compact && <div className="parameter-filters" role="group" aria-label="Filter data by world">
      {['all', ...WORLD_ORDER].map(w => <button type="button" key={w} onClick={() => setFocus(w)} className={focus === w ? 'active' : ''}>{w === 'all' ? 'All 3 worlds' : w[0].toUpperCase() + w.slice(1)}</button>)}
    </div>}
    <div className={`parameter-world-grid ${worlds.length === 1 ? 'single' : ''}`}>
      {worlds.map(world => <DataWorld key={world} world={world} siteId={sites[world]} onSiteChange={onSiteChange}
        power={power} month={month} dem={dem} compact={compact} />)}
    </div>
    {compact ? <div className="data-quick-footer">
      <span>Mars MOLA site elevations and Moon LOLA elevations use NASA DEM grids; the Moon dataset needs internet or a local NASA cache.</span>
      {onOpenData && <button className="subtle-button" onClick={onOpenData}>See all 12 parameters</button>}
    </div> : <div className="parameter-method">
      <p><strong>Data integrity:</strong> Earth climate comes from NASA POWER gridded averages. Mars site elevations are sampled from the bundled NASA MOLA DEM. Moon site elevations are sampled from the NASA LRO/LOLA DEM if it loads. These are coarse terrain estimates, not local instruments or landing-site surveys. Mars/Moon gravity, temperature and day-length references are planet-wide; no missing site weather readings are invented. Month selection affects Earth only.</p>
      <p>{power.status === 'loading' ? 'NASA POWER data is loading.' : power.status === 'error' ? 'NASA POWER is unavailable; corresponding Earth values are intentionally blank.' : 'NASA POWER Earth climatology loaded.'}</p>
      <div className="parameter-sources">
        <a href={power.url || SOURCE_URLS.nasaPower} target="_blank" rel="noreferrer">Earth POWER request</a>
        <a href={SOURCE_URLS.earth} target="_blank" rel="noreferrer">Earth fact sheet</a>
        <a href={SOURCE_URLS.mars} target="_blank" rel="noreferrer">Mars fact sheet</a>
        <a href={SOURCE_URLS.mola} target="_blank" rel="noreferrer">Mars NASA MOLA terrain</a>
        <a href={SOURCE_URLS.moon} target="_blank" rel="noreferrer">Moon fact sheet</a>
        <a href={SOURCE_URLS.lola} target="_blank" rel="noreferrer">Moon NASA LOLA terrain</a>
        <a href={SOURCE_URLS.lunarCoords} target="_blank" rel="noreferrer">Apollo coordinates</a>
      </div>
    </div>}
  </section>;
}
