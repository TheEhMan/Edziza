// Coordinates selected from the 3D viewer are geographically meaningful,
// but the analog rankings only have eight-domain observations for six curated
// planetary reference sites. Never misrepresent a map click as eight new samples.
import { WORLD_SITES } from './siteData.js';

const RAD = Math.PI / 180;
export const PLANET_RADII_KM = { mars: 3389.5, moon: 1737.4 };
export const RESEARCH_RADIUS_KM = { mars: 150, moon: 100 };

export function normalizeLongitude(lon) {
  if (!Number.isFinite(lon)) return NaN;
  const wrapped = ((lon + 180) % 360 + 360) % 360 - 180;
  return Number(wrapped.toFixed(5));
}

export function sphericalDistanceKm(a, b, world) {
  const radius = PLANET_RADII_KM[world];
  if (!radius) throw new Error('Only Mars and Moon target coordinates are supported');
  const phi1 = a.lat * RAD, phi2 = b.lat * RAD;
  const deltaPhi = (b.lat - a.lat) * RAD;
  const deltaLambda = normalizeLongitude(b.lon - a.lon) * RAD;
  const h = Math.sin(deltaPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2;
  return 2 * radius * Math.asin(Math.sqrt(Math.min(1, Math.max(0, h))));
}

export function nearestReferenceSite(world, lat, lon) {
  const sites = WORLD_SITES[world];
  if (!PLANET_RADII_KM[world] || !Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90) {
    throw new Error('Invalid planetary click coordinate');
  }
  const coordinate = { lat, lon: normalizeLongitude(lon) };
  const options = Object.values(sites).map(site => ({
    site, distanceKm: sphericalDistanceKm(coordinate, site, world)
  })).sort((a, b) => a.distanceKm - b.distanceKm);
  const nearest = options[0];
  return {
    world,
    lat: Number(lat.toFixed(4)),
    lon: coordinate.lon,
    referenceId: nearest.site.id,
    referenceName: nearest.site.label,
    distanceKm: Math.round(nearest.distanceKm),
    profileTransfer: nearest.distanceKm > 1,
    inResearchVicinity: nearest.distanceKm <= RESEARCH_RADIUS_KM[world]
  };
}
