import React, { useEffect, useMemo, useState } from 'react';
import { EDZIZA_SITES } from './EarthMap.jsx';

const MONTHS = [
  ['ANN', 'Annual average'], ['JAN', 'January'], ['FEB', 'February'],
  ['MAR', 'March'], ['APR', 'April'], ['MAY', 'May'], ['JUN', 'June'],
  ['JUL', 'July'], ['AUG', 'August'], ['SEP', 'September'],
  ['OCT', 'October'], ['NOV', 'November'], ['DEC', 'December']
];

const SOURCES = {
  bc: 'https://bcparks.ca/mount-edziza-park/',
  smithsonian: 'https://volcano.si.edu/volcano.cfm?vn=320060',
  power: 'https://power.larc.nasa.gov/docs/services/api/temporal/climatology/',
  mars: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html',
  esa: 'https://www.esa.int/Science_Exploration/Space_Science/Mars_Express/Hecates_Tholus_volcano_in_3D',
  hirise: 'https://hirise.lpl.arizona.edu/PSP_010678_2135'
};

const fmt = (value, suffix, digits = 1) => {
  if (!Number.isFinite(value) || value <= -990) return 'Unavailable';
  return `${value.toFixed(digits)} ${suffix}`;
};

function Metric({ label, value, note }) {
  return (
    <div className="metric-card">
      <span className="metric-label">{label}</span>
      <strong className="metric-value">{value}</strong>
      {note && <p className="metric-note">{note}</p>}
    </div>
  );
}

function usePowerClimate(site) {
  const [result, setResult] = useState({ state: 'loading', data: null, url: '' });
  const location = EDZIZA_SITES[site] || EDZIZA_SITES.snowshoe;
  const [lon, lat] = location.coords;
  const url = useMemo(() => {
    const q = new URLSearchParams({
      parameters: 'T2M,RH2M,PS,WS10M',
      community: 'AG',
      longitude: String(lon),
      latitude: String(lat),
      format: 'JSON'
    });
    return `https://power.larc.nasa.gov/api/temporal/climatology/point?${q}`;
  }, [lat, lon]);

  useEffect(() => {
    const controller = new AbortController();
    setResult({ state: 'loading', data: null, url });
    fetch(url, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`NASA POWER HTTP ${response.status}`);
        return response.json();
      })
      .then((json) => {
        const parameters = json?.properties?.parameter;
        if (!parameters?.T2M || !parameters?.RH2M) {
          throw new Error('NASA POWER returned an unexpected data format.');
        }
        setResult({ state: 'ready', data: parameters, url });
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setResult({ state: 'error', data: null, url });
        }
      });
    return () => controller.abort();
  }, [url]);

  return result;
}

export default function ClimatePanel({ site = 'snowshoe', compact = false }) {
  const [month, setMonth] = useState('ANN');
  const power = usePowerClimate(site);
  const get = (key) => Number(power.data?.[key]?.[month]);

  return (
    <section className={`climate-panel ${compact ? 'compact' : ''}`}>
      <div className="climate-header">
        <div>
          <span className="eyebrow">EARTH / MARS ENVIRONMENT</span>
          <h2>Conditions behind the terrain</h2>
          <p>Planetary analogs match selected landforms, not every environmental condition.</p>
        </div>
        <div className="month-control">
          <label htmlFor="climate-month">NASA POWER period</label>
          <select id="climate-month" value={month} onChange={(event) => setMonth(event.target.value)}>
            {MONTHS.map(([value, name]) => <option key={value} value={value}>{name}</option>)}
          </select>
        </div>
      </div>

      <div className="climate-columns">
        <article className="climate-world earth-climate">
          <div className="climate-world-header"><span className="planet-indicator earth" />
            <div><span>EARTH / BRITISH COLUMBIA</span><h3>{EDZIZA_SITES[site]?.label || 'Mount Edziza'}</h3></div>
          </div>
          <div className="metric-grid">
            <Metric label="AIR TEMPERATURE" value={power.state === 'ready' ? fmt(get('T2M'), '\u00b0C') : '--'} note="Modeled 2 m air temperature" />
            <Metric label="RELATIVE HUMIDITY" value={power.state === 'ready' ? fmt(get('RH2M'), '%', 0) : '--'} note="Modeled 2 m relative humidity" />
            <Metric label="SURFACE PRESSURE" value={power.state === 'ready' ? fmt(get('PS'), 'kPa') : '--'} note="Modeled atmospheric pressure" />
            <Metric label="WIND SPEED" value={power.state === 'ready' ? fmt(get('WS10M'), 'm/s') : '--'} note="Modeled 10 m wind speed" />
            <Metric label="VOLCANIC PEAK" value="2,786 m" note="Edziza summit, not selected map pixel" />
            <Metric label="GEOLOGY" value="Lava + ice" note="Basaltic flows, cinder cones, glaciers" />
          </div>
          <div className="source-note">
            {power.state === 'loading' && <p>Loading NASA POWER climatology for this location...</p>}
            {power.state === 'error' && <p>NASA POWER data could not be loaded. The figures above are intentionally blank, not estimates. Check your connection or <a href={power.url} target="_blank" rel="noreferrer">open the raw request</a>.</p>}
            {power.state === 'ready' && <p>NASA POWER gridded climate estimates for the selected coordinates. These are climatological averages, not live weather or summit observations. Coarse model grids may not capture steep mountain elevations.</p>}
            <a href={power.url} target="_blank" rel="noreferrer">NASA POWER data request</a>
            {' / '}<a href={SOURCES.bc} target="_blank" rel="noreferrer">BC Parks geology</a>
          </div>
        </article>

        <article className="climate-world mars-climate">
          <div className="climate-world-header"><span className="planet-indicator mars" />
            <div><span>MARS / ELYSIUM REGION</span><h3>Hecates Tholus</h3></div>
          </div>
          <div className="metric-grid">
            <Metric label="AIR TEMPERATURE" value="-59 \u00b0C" note="Mars-wide mean, NOT measured here" />
            <Metric label="RELATIVE HUMIDITY" value="No local data" note="No verified sensor reading at Hecates Tholus" />
            <Metric label="SURFACE PRESSURE" value="0.636 kPa" note="Mars mean-radius reference, NOT local" />
            <Metric label="WIND SPEED" value="No local data" note="Would require a seasonal climate model" />
            <Metric label="VOLCANIC ELEVATION" value="~5.3 km" note="ESA description; not a terrain match" />
            <Metric label="GEOLOGY" value="Volcanic + ice" note="Evidence for ancient water/ice interaction" />
          </div>
          <div className="source-note">
            <p>Mars values above describe the planet, not a current Hecates Tholus weather report. Relative humidity changes with temperature, time of day and location; a local number would be misleading.</p>
            <a href={SOURCES.mars} target="_blank" rel="noreferrer">NASA Mars fact sheet</a>
            {' / '}<a href={SOURCES.esa} target="_blank" rel="noreferrer">ESA volcano data</a>
            {' / '}<a href={SOURCES.hirise} target="_blank" rel="noreferrer">HiRISE ice interactions</a>
          </div>
        </article>
      </div>
    </section>
  );
}
