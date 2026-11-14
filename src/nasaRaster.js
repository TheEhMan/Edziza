// NASA SVS CGI Moon Kit ldem_4.tif is a 4-pixels-per-degree raster of
// LRO/LOLA elevations, float32 KILOMETRES relative to lunar radius 1737.4 km.
// The map is equirectangular with 0E at the center; northernmost row is first.
export const NASA_LRO_BASE = 'https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720';
export const NASA_LRO_COLOR_PATH = '/vis/a000000/a004700/a004720/lroc_color_2k.jpg';
export const NASA_LOLA_PATH = '/vis/a000000/a004700/a004720/ldem_4.tif';
export const NASA_MOON_REFERENCE = 'https://svs.gsfc.nasa.gov/4720/';

export async function sampleLolaSites(bytes, locations) {
  const { fromArrayBuffer } = await import('geotiff');
  const arrayBuffer = bytes instanceof ArrayBuffer
    ? bytes
    : bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  const tiff = await fromArrayBuffer(arrayBuffer);
  const image = await tiff.getImage();
  const width = image.getWidth();
  const height = image.getHeight();
  if (width !== 1440 || height !== 720) {
    throw new Error(`Unexpected NASA LOLA DEM dimensions: ${width}x${height} (expected 1440x720)`);
  }
  const sites = {};
  for (const loc of Object.values(locations)) {
    if (!Number.isFinite(loc.lat) || !Number.isFinite(loc.lon)) throw new Error(`Invalid lunar location: ${loc.id}`);
    const x = Math.min(width - 1, Math.max(0, Math.floor((loc.lon + 180) / 360 * width)));
    const y = Math.min(height - 1, Math.max(0, Math.floor((90 - loc.lat) / 180 * height)));
    const samples = await image.readRasters({ window: [x, y, x + 1, y + 1], samples: [0], interleave: true });
    const kilometres = Number(samples[0]);
    // A corrupted response or an HTML error page must not produce a made-up elevation.
    if (!Number.isFinite(kilometres) || Math.abs(kilometres) > 30) {
      throw new Error(`Invalid NASA LOLA elevation for ${loc.id}: ${kilometres}`);
    }
    sites[loc.id] = {
      lat: loc.lat,
      lon: loc.lon,
      elevationMetres: Math.round(kilometres * 1000),
      sampleLongitude: -180 + (x + 0.5) * 360 / width,
      sampleLatitude: 90 - (y + 0.5) * 180 / height
    };
  }
  return {
    instrument: 'NASA Lunar Reconnaissance Orbiter - Lunar Orbiter Laser Altimeter (LOLA)',
    sourceUrl: `${NASA_LRO_BASE}/ldem_4.tif`,
    sourcePage: NASA_MOON_REFERENCE,
    reference: 'Elevation relative to a lunar reference sphere of radius 1737.4 km',
    resolution: '4 pixels per degree (~7.6 km north-south grid spacing); substantially coarser than a rover site',
    method: 'Nearest NASA LOLA global DEM cell at the approximate research-site coordinate',
    precision: 'Coarse regional DEM grid cell, not a measured point altitude, slope, ice reading, or landing-site assessment',
    sites
  };
}
