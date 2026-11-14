// NASA MGS MOLA PDS4 MEGDR: global 4 pixels/degree PDS image.
// Product: megt90n000cb.img; 1440x720 signed 16-bit BIG ENDIAN;
// origin at 90 deg north, 0 deg east (unlike center-0 Mars Viking image).
export const MARS_RADIUS_KM = 3389.5;
export const MARS_GLOBAL_MOLA_SOURCE = 'https://pds-geosciences.wustl.edu/mgs/urn-nasa-pds-mgs_mola_topography_derived/meg004/megt90n000cb.img';
export const MARS_GLOBAL_MOLA_CATALOG = 'https://pds-geosciences.wustl.edu/missions/mgs/megdr.html';
export const MARS_VIKING_GLOBAL_SOURCE = 'https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=mars';
export const MARS_VIKING_TILES = 'https://trek.nasa.gov/tiles/Mars/EQ/Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0/default/default028mm';
export const MARS_GLOBAL_WIDTH = 1440;
export const MARS_GLOBAL_HEIGHT = 720;
export const MARS_DEM_BYTES = MARS_GLOBAL_WIDTH * MARS_GLOBAL_HEIGHT * 2;

export function readMolaMegdr(arrayBuffer) {
  if (arrayBuffer.byteLength !== MARS_DEM_BYTES) throw new Error(`MOLA MEGDR: expected ${MARS_DEM_BYTES} bytes; received ${arrayBuffer.byteLength}`);
  const view = new DataView(arrayBuffer);
  const cells = new Int16Array(MARS_GLOBAL_WIDTH * MARS_GLOBAL_HEIGHT);
  for (let i = 0; i < cells.length; i++) cells[i] = view.getInt16(i * 2, false);
  return { width: MARS_GLOBAL_WIDTH, height: MARS_GLOBAL_HEIGHT, cells, source: MARS_GLOBAL_MOLA_SOURCE };
}

export function sampleMolaMegdr(data, lat, lon) {
  if (!data?.cells || !Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90) return null;
  const lonEast = ((lon % 360) + 360) % 360;
  const fx = lonEast / 360 * data.width;
  const fy = Math.max(0, Math.min(data.height - 1, (90 - lat) / 180 * data.height));
  const x0 = Math.floor(fx) % data.width;
  const x1 = (x0 + 1) % data.width;
  const y0 = Math.floor(fy);
  const y1 = Math.min(y0 + 1, data.height - 1);
  const dx = fx - Math.floor(fx), dy = fy - y0;
  const a = data.cells[y0 * data.width + x0];
  const b = data.cells[y0 * data.width + x1];
  const c = data.cells[y1 * data.width + x0];
  const d = data.cells[y1 * data.width + x1];
  if ([a, b, c, d].some(value => value <= -32768)) return null;
  return (a * (1-dx) + b * dx) * (1-dy) + (c * (1-dx) + d * dx) * dy;
}

let cached;
export function loadMarsGlobalMola() {
  if (cached) return cached;
  cached = (async () => {
    const urls = ['/nasa-data/mars-megt90n000cb.img', '/mars-pds-remote/mgs/urn-nasa-pds-mgs_mola_topography_derived/meg004/megt90n000cb.img', MARS_GLOBAL_MOLA_SOURCE];
    let error;
    for (const url of urls) {
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(25000) });
        if (!response.ok) throw new Error(`${response.status} ${url}`);
        return readMolaMegdr(await response.arrayBuffer());
      } catch (e) { error = e; }
    }
    throw error || new Error('NASA global MOLA unavailable');
  })();
  return cached;
}
