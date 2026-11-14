// Shared location catalogue. Coordinates are planetocentric latitude and east-positive longitude
// for Mars/Moon; Earth uses WGS84. Sites are study locations, not certified landing sites.
export const WORLD_SITES = {
  earth: {
    snowshoe: {
      id: 'snowshoe', label: 'Snowshoe Lava Field', lat: 57.65, lon: -130.667,
      coords: [-130.667, 57.65], zoom: 11.1, pitch: 62, bearing: 18,
      description: 'Basaltic flows within the Edziza volcanic complex; a proposed lava/ice field analog.',
      terrain: 'Basaltic lava field', ice: 'Regional lava–ice interaction evidence; no quantified ice at this map pin.',
      evidence: 'https://bcparks.ca/mount-edziza-park/'
    },
    summit: {
      id: 'summit', label: 'Mount Edziza summit', lat: 57.72, lon: -130.63,
      coords: [-130.63, 57.72], zoom: 10.4, pitch: 62, bearing: -24,
      description: 'High volcanic summit with glaciers, lava flows and nearby volcanic cones.',
      terrain: 'Glaciated volcanic summit', ice: 'Glaciers are documented in the volcanic complex; local ice thickness not assessed.',
      evidence: 'https://bcparks.ca/mount-edziza-park/'
    },
    desolation: {
      id: 'desolation', label: 'Desolation Lava Field', lat: 57.816667, lon: -130.616667,
      coords: [-130.616667, 57.816667], zoom: 11.1, pitch: 58, bearing: 18,
      description: 'Northern lava field with basaltic flows and pyroclastic cones.',
      terrain: 'Lava flows + volcanic cones', ice: 'No site-specific water/ice measurement in this prototype.',
      evidence: 'https://volcano.si.edu/volcano.cfm?vn=320060'
    }
  },
  mars: {
    hecates: {
      id: 'hecates', label: 'Hecates Tholus', lat: 32.09, lon: 150.2,
      description: 'Volcano with scientific reports of ancient glacier-related landforms on its flanks.',
      terrain: 'Volcanic shield + flank landforms',
      ice: 'Published evidence of ancient glacier-related features; not a present-day ice measurement.',
      evidence: 'https://hirise.lpl.arizona.edu/PSP_010678_2135'
    },
    elysium: {
      id: 'elysium', label: 'Elysium Mons', lat: 24.74, lon: 146.9,
      description: 'Large shield volcano within the mapped Elysium volcanic province.',
      terrain: 'Shield volcano / lava flows',
      ice: 'Local water/ice inventory not assessed here.',
      evidence: 'https://science.nasa.gov/mars/'
    },
    albor: {
      id: 'albor', label: 'Albor Tholus', lat: 18.79, lon: 150.4,
      description: 'Volcanic edifice south of Elysium Mons in the NASA Viking/MOLA map extent.',
      terrain: 'Volcanic cone / lava flows',
      ice: 'Local water/ice inventory not assessed here.',
      evidence: 'https://pds-geosciences.wustl.edu/missions/mgs/megdr.html'
    }
  },
  moon: {
    apollo11: {
      id: 'apollo11', label: 'Apollo 11 / Tranquility Base', lat: 0.67416, lon: 23.47314,
      description: 'The verified Apollo 11 Lunar Module landing site in Mare Tranquillitatis.',
      terrain: 'Basaltic lunar mare',
      ice: 'No exposed local water ice established at the Apollo 11 landing point.',
      evidence: 'https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_sites.html'
    },
    shackleton: {
      id: 'shackleton', label: 'Shackleton / lunar south pole', lat: -89.9, lon: 0,
      description: 'Representative south-polar location on/near Shackleton crater rim; not a measured landing site.',
      terrain: 'Polar crater rim and shadowed terrain',
      ice: 'Polar permanently shadowed regions may host water ice; no local abundance is assigned to this pin.',
      evidence: 'https://svs.gsfc.nasa.gov/4969/'
    },
    aristarchus: {
      id: 'aristarchus', label: 'Aristarchus Plateau', lat: 26, lon: -49,
      description: 'Representative volcanic plateau research area; location is approximate, not a landing coordinate.',
      terrain: 'Volcanic plateau / pyroclastics',
      ice: 'No site-specific water/ice measurement included.',
      evidence: 'https://www.nasa.gov/mission_pages/LRO/main/index.html'
    }
  }
};

export const WORLD_LABELS = {
  earth: 'EARTH / BRITISH COLUMBIA',
  mars: 'MARS / ELYSIUM VOLCANIC REGION',
  moon: 'MOON / LUNAR SURFACE'
};
export const WORLD_ORDER = ['earth', 'mars', 'moon'];
export const DEFAULT_SITES = { earth: 'snowshoe', mars: 'hecates', moon: 'apollo11' };
export const getSite = (world, id) => WORLD_SITES[world]?.[id] || WORLD_SITES[world]?.[DEFAULT_SITES[world]];
export const formatCoord = (value, axis) => `${Math.abs(value).toFixed(3)}° ${value < 0 ? (axis === 'lat' ? 'S' : 'W') : (axis === 'lat' ? 'N' : 'E')}`;
