// Exactly twelve comparable fields. Orbital irradiance (planet-wide, not local)
// has been replaced by a far more useful research-site DEM elevation field.
export const PARAMETERS = [
  { id: 'latitude', label: 'Latitude', detail: 'Selected research location (an approximate area coordinate where indicated)' },
  { id: 'longitude', label: 'Longitude', detail: 'Earth uses WGS84; Mars/Moon coordinates are east-positive' },
  { id: 'temperature', label: 'Temperature', detail: 'Earth NASA POWER 2-m air climatology; Mars planetary reference; no Moon site thermal series' },
  { id: 'pressure', label: 'Surface pressure', detail: 'Earth NASA POWER climatology; NASA Mars/Moon global reference, not the local volcano/crater' },
  { id: 'humidity', label: 'Relative humidity', detail: 'Earth NASA POWER climatology; not measured at the selected Mars sites; not applicable on the Moon' },
  { id: 'wind', label: 'Wind speed', detail: 'Earth NASA POWER 10-m wind climatology; missing locally on Mars and not applicable on the Moon' },
  { id: 'surfaceSolar', label: 'Surface solar energy', detail: 'Earth NASA POWER all-sky surface irradiance; Mars/Moon local insolation model not supplied' },
  { id: 'gravity', label: 'Surface gravity', detail: 'NASA planet-wide gravity reference, not a locally surveyed gravity anomaly' },
  { id: 'solarDay', label: 'Solar day length', detail: 'NASA planetary mean sunrise-to-sunrise interval, not local daylight duration' },
  { id: 'elevation', label: 'NASA DEM elevation', detail: 'Mars MOLA 16 pixels/degree above areoid; Moon LOLA 4 pixels/degree above 1737.4-km reference sphere' },
  { id: 'terrain', label: 'Terrain / geology', detail: 'Regional geological site context with supporting references; not an in-situ rock analysis' },
  { id: 'ice', label: 'Water / ice evidence', detail: 'Research context, not a measured local water-ice abundance or resource estimate' }
];
