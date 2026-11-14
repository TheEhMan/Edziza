// Published GLOBAL/planetary reference facts. These are NOT site observations.
// NASA NSSDCA fact sheets; see linked source. NASA POWER is used separately
// for Earth point climatology and must never be treated as a rover sensor.
export const PLANET_FACTS = {
  mars: {
    source: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html',
    gravity: 3.73, solHours: 24.6597, pressurePa: 636,
    meanTemperatureC: -59, solarWm2: 586.2,
    description: 'Mars planetary reference averages; not a weather observation at the clicked coordinate.'
  },
  moon: {
    source: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html',
    gravity: 1.62, solHours: 29.53 * 24,
    pressurePa: 3e-10, // Night-side reference 3e-15 bar = 3e-10 Pa.
    equatorialTemperatureMinC: 95 - 273.15,
    equatorialTemperatureMaxC: 390 - 273.15,
    solarWm2: 1361,
    description: 'Moon reference values; equatorial temperature extremes are NOT Shackleton surface temperatures.'
  },
  earth: {
    source: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html',
    gravity: 9.80, solHours: 24,
    // no fixed site pressure/temperature: Earth POWER requests provide climatology
  }
};

const qty = (label, value, unit, note, source) => ({ label, value, unit, note, source });
export function numericScienceContext(domain, world, picked, earth, siteElevation) {
  const facts = PLANET_FACTS[world];
  const earthFacts = PLANET_FACTS.earth;
  if (domain === 'terrain') return [
    qty('NASA orbital DEM elevation', Number.isFinite(siteElevation) ? Math.round(siteElevation).toLocaleString('en-US') : 'Not downloaded',
      'm', 'NASA MOLA/LOLA global grid sample, not a rover-scale slope measurement',
      world === 'mars' ? 'https://pds-geosciences.wustl.edu/missions/mgs/megdr.html' : 'https://svs.gsfc.nasa.gov/4720/'),
    qty('Earth analog latitude', Math.abs(earth.lat).toFixed(1), `°${earth.lat < 0 ? 'S' : 'N'}`,
      'Representative Earth candidate coordinate, not elevation', earth.source)
  ];
  if (domain === 'thermal') return [
    qty('Planetary reference solar input', facts.solarWm2.toLocaleString('en-US'), 'W/m²', 'Orbit-averaged insolation constant, not measured local illumination', facts.source),
    ...(world === 'mars'
      ? [qty('Mars global temperature reference', facts.meanTemperatureC.toString(), '°C', 'Planet-wide average, not target local climate', facts.source)]
      : [qty('Lunar equatorial diurnal range', `${Math.round(facts.equatorialTemperatureMinC)} to +${Math.round(facts.equatorialTemperatureMaxC)}`, '°C', 'Equatorial range; not polar or site-specific', facts.source)])
  ];
  if (domain === 'dust') return [
    qty('Planetary atmospheric pressure', world === 'moon' ? '3 × 10⁻¹⁰' : facts.pressurePa.toLocaleString('en-US'), 'Pa',
      world === 'moon' ? 'Lunar nighttime exosphere estimate; no atmospheric wind' : 'Mars mean-radius pressure, seasonally variable', facts.source)
  ];
  if (domain === 'operations') return [
    qty('Gravity · target / Earth', `${facts.gravity.toFixed(2)} / ${earthFacts.gravity.toFixed(2)}`, 'm/s²', 'Planet-wide values; not reproduced by an Earth outdoor test', facts.source),
    qty('Solar day length', facts.solHours.toFixed(1), 'hours', 'Planet-wide reference; illumination at specific slopes varies', facts.source)
  ];
  if (domain === 'resources') return [qty('Ice concentration at exact click', 'Not measured', '%',
    'A proposed ice-prospecting task is not a verified resource inventory', facts.source)];
  if (domain === 'biology') return [qty('Confirmed indigenous life', 'None confirmed', '',
    'This statement does not claim that extraterrestrial life is absent', facts.source)];
  if (domain === 'subsurface') return [qty('Validated caves at clicked point', 'Not surveyed', 'count',
    'Field-test goals are not detections of an accessible planetary cave', facts.source)];
  return [qty('Local mineral fraction', 'Not measured', '%',
    'Rock-type tags are interpreted from mapped context, not matching lab spectra', facts.source)];
}
