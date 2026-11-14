import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';

// Works with the Vite setup from the original starter project.
maplibregl.setWorkerUrl(workerUrl);

import { WORLD_SITES } from './siteData.js';
import { EARTH_ANALOGS } from './analogData.js';

// Earth map sites come exclusively from the eight-domain candidate catalogue.
export const EARTH_MAP_SITES = { ...WORLD_SITES.earth,
  ...Object.fromEntries(EARTH_ANALOGS.map(site => [site.id, { ...site, label: site.name }]))
};

const DEM = 'https://tiles.mapterhorn.com/tilejson.json';
const STYLE = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      maxzoom: 19,
      attribution: 'OpenStreetMap contributors'
    },
    imagery: {
      type: 'raster',
      tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
      tileSize: 256,
      maxzoom: 19,
      attribution: 'Imagery Esri and its imagery providers'
    },
    terrainSource: { type: 'raster-dem', url: DEM },
    hillshadeSource: { type: 'raster-dem', url: DEM }
  },
  layers: [
    { id: 'imagery-base', type: 'raster', source: 'imagery', layout: { visibility: 'visible' } },
    { id: 'osm-base', type: 'raster', source: 'osm', layout: { visibility: 'none' } },
    {
      id: 'terrain-shading', type: 'hillshade', source: 'hillshadeSource',
      paint: { 'hillshade-exaggeration': 0.2, 'hillshade-shadow-color': '#30353d' }
    }
  ]
};

export default function EarthMap({ site = 'atacama', basemap = 'satellite', exaggeration = 1.15, resetKey = 0 }) {
  const ref = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [zoom, setZoom] = useState(EARTH_MAP_SITES[site]?.zoom || 11);

  useEffect(() => {
    if (!ref.current) return;
    const initial = EARTH_MAP_SITES[site] || EARTH_MAP_SITES.atacama;
    const map = new maplibregl.Map({
      container: ref.current,
      style: structuredClone(STYLE),
      center: initial.coords,
      zoom: initial.zoom,
      pitch: initial.pitch,
      bearing: initial.bearing,
      antialias: true,
      maxZoom: 14.5,     // avoid zooming beyond useful DEM/imagery detail
      maxPitch: 70,      // extremely low camera angles reveal terrain artifacts
      attributionControl: { compact: true }
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric', maxWidth: 100 }), 'bottom-left');

    const handleZoom = () => setZoom(map.getZoom());
    map.on('zoomend', handleZoom);
    map.once('load', () => {
      map.setTerrain({ source: 'terrainSource', exaggeration });
      const pin = document.createElement('div');
      pin.className = 'earth-marker';
      markerRef.current = new maplibregl.Marker({ element: pin, anchor: 'bottom' })
        .setLngLat(initial.coords)
        .setPopup(new maplibregl.Popup({ offset: 18 }).setText(initial.label))
        .addTo(map);
    });

    // React tab changes / fullscreen changes alter the canvas size.
    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(ref.current);
    const fullScreenResize = () => map.resize();
    document.addEventListener('fullscreenchange', fullScreenResize);

    return () => {
      document.removeEventListener('fullscreenchange', fullScreenResize);
      resizeObserver.disconnect();
      map.off('zoomend', handleZoom);
      markerRef.current?.remove();
      markerRef.current = null;
      mapRef.current = null;
      map.remove();
    };
    // Only construct the WebGL map once; subsequent props change it in-place.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const target = EARTH_MAP_SITES[site] || EARTH_MAP_SITES.atacama;
    map.flyTo({
      center: target.coords, zoom: target.zoom, pitch: target.pitch,
      bearing: target.bearing, speed: 0.85, essential: true
    });
    markerRef.current?.setLngLat(target.coords).setPopup(
      new maplibregl.Popup({ offset: 18 }).setText(target.label)
    );
  }, [site, resetKey]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const update = () => {
      if (!map.getLayer('imagery-base') || !map.getLayer('osm-base')) return;
      map.setLayoutProperty('imagery-base', 'visibility', basemap === 'satellite' ? 'visible' : 'none');
      map.setLayoutProperty('osm-base', 'visibility', basemap === 'map' ? 'visible' : 'none');
    };
    if (map.isStyleLoaded()) update();
    else map.once('load', update);
  }, [basemap]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const update = () => {
      if (map.getSource('terrainSource')) {
        map.setTerrain({ source: 'terrainSource', exaggeration: Math.min(exaggeration, 2) });
      }
    };
    if (map.isStyleLoaded()) update();
    else map.once('load', update);
  }, [exaggeration]);

  return (
    <div className="earth-map-container">
      <div ref={ref} className="earth-map" aria-label={`3D terrain map of ${EARTH_MAP_SITES[site]?.label || "selected Earth analog"}`} />
      <div className="earth-map-hud">Zoom {zoom.toFixed(1)} / 14.5 | 3D elevation from Mapterhorn</div>
      {zoom > 13.8 && <div className="zoom-caution">Close-up terrain detail is limited by elevation resolution. Zoom out for reliable landforms.</div>}
    </div>
  );
}
