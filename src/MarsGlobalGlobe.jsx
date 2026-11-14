import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { WORLD_SITES, formatCoord } from './siteData.js';
import { loadMarsGlobalMola, MARS_RADIUS_KM, MARS_VIKING_TILES, MARS_GLOBAL_MOLA_CATALOG, sampleMolaMegdr } from './marsGlobalData.js';
import './mars-satellite.css';

const RADIUS = 3;
const DEFAULT_CAMERA = 9.7;
const GLOBE_RELIEF = 3; // Display emphasis; actual relative planetary height is much smaller.
const SITES = Object.values(WORLD_SITES.mars);
const TILE_LEVEL = 2; // 8x4 = 32 NASA Viking WMTS tiles, one GPU upload.

function positionFor(lat, lon, radius) {
  const a = lat * Math.PI / 180;
  const b = lon * Math.PI / 180;
  return new THREE.Vector3(radius * Math.cos(a) * Math.cos(b), radius * Math.sin(a), -radius * Math.cos(a) * Math.sin(b));
}
function radiusFor(mola, lat, lon, exaggeration = GLOBE_RELIEF) {
  const elevation = sampleMolaMegdr(mola, lat, lon);
  return elevation === null ? RADIUS : RADIUS * (1 + elevation / (1000 * MARS_RADIUS_KM) * exaggeration);
}

function GlobalCamera({ site, picked, controlsRef, reset }) {
  const { camera, invalidate } = useThree();
  useEffect(() => {
    const selected = picked || WORLD_SITES.mars[site] || WORLD_SITES.mars.elysium;
    const d = reset ? DEFAULT_CAMERA : Math.max(3.55, Math.min(25, camera.position.length()));
    camera.position.copy(positionFor(selected.lat, selected.lon, d));
    camera.lookAt(0, 0, 0);
    controlsRef.current?.target.set(0, 0, 0);
    controlsRef.current?.update();
    invalidate();
  }, [camera, controlsRef, picked?.lat, picked?.lon, site, reset, invalidate]);
  return null;
}

function MarsSphere({ mola, texture, site, picked, onPick, exaggeration }) {
  const start = useRef(null);
  const geometry = useMemo(() => {
    const shape = new THREE.SphereGeometry(RADIUS, 160, 80); // 13k vertices, not 200k.
    if (mola) {
      const positions = shape.getAttribute('position');
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i);
        const lat = Math.asin(THREE.MathUtils.clamp(y / RADIUS, -1, 1)) * 180 / Math.PI;
        const lon = Math.atan2(-z, x) * 180 / Math.PI;
        const ratio = radiusFor(mola, lat, lon, exaggeration) / RADIUS;
        positions.setXYZ(i, x * ratio, y * ratio, z * ratio);
      }
      shape.computeVertexNormals();
    }
    return shape;
  }, [mola, exaggeration]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  const click = event => {
    if (event.button !== 0 || !start.current) return;
    const dx = event.nativeEvent.clientX - start.current.x;
    const dy = event.nativeEvent.clientY - start.current.y;
    start.current = null;
    if (dx*dx + dy*dy > 49) return;
    const p = event.point.clone().normalize();
    const lat = Math.asin(THREE.MathUtils.clamp(p.y, -1, 1)) * 180 / Math.PI;
    const lon = Math.atan2(-p.z, p.x) * 180 / Math.PI;
    const elevation = sampleMolaMegdr(mola, lat, lon);
    onPick?.(lat, lon, elevation === null ? null : Math.round(elevation));
  };
  const marker = loc => positionFor(loc.lat, loc.lon, radiusFor(mola, loc.lat, loc.lon, exaggeration) + 0.13);
  return <>
    <mesh geometry={geometry} onPointerDown={e => {
      if (e.button === 0) start.current = { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY };
    }} onPointerUp={click}>
      <meshStandardMaterial map={texture || null} color={texture ? '#ffffff' : '#a25940'} roughness={1} metalness={0}/>
    </mesh>
    {SITES.map(loc => {
      const p = marker(loc);
      const highlighted = loc.id === site;
      return <group key={loc.id}>
        <mesh position={p.toArray()} raycast={() => null}>
          <sphereGeometry args={[highlighted ? 0.07 : 0.046, 10, 10]} />
          <meshBasicMaterial color={highlighted ? '#b1ffe0' : '#ffd49d'} />
        </mesh>
        <Html position={p.toArray()} center occlude distanceFactor={9} style={{ pointerEvents: 'none' }}>
          <div className="mars-landmark"><span className="mars-landmark-dot"/>{loc.label}</div>
        </Html>
      </group>;
    })}
    {picked && <mesh position={marker(picked).toArray()} raycast={() => null}>
      <sphereGeometry args={[0.08, 12, 12]} />
      <meshBasicMaterial color="#a2ffdf" />
    </mesh>}
  </>;
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Mars tile unavailable: ${url}`));
    image.src = url;
  });
}

async function loadGlobalVikingTexture() {
  const loader = new THREE.TextureLoader();
  const staticUrls = ['/nasa-data/mars-viking-global-4k.jpg', '/nasa-data/mars-viking-global-2k.jpg'];
  for (const url of staticUrls) {
    try {
      const texture = await new Promise((resolve, reject) => loader.load(url, resolve, undefined, reject));
      if (texture.image?.naturalWidth < 1024) throw new Error('No local global Mars image');
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 4;
      return { texture, label: `NASA VIKING GLOBAL MOSAIC (${texture.image.naturalWidth}px)` };
    } catch { /* No packaged image; build the globe from NASA WMTS tiles. */ }
  }
  // Probe once: avoids 32 wasted 404/image-decodes when the local cache
  // does not exist. The Vite SPA fallback can otherwise respond with HTML.
  let cachedTiles = false;
  try {
    const response = await fetch('/nasa-data/mars-global-tiles/manifest.json', { cache: 'no-cache' });
    if (response.ok) {
      const manifest = await response.json();
      cachedTiles = manifest.level === TILE_LEVEL && manifest.tiles === 32;
    }
  } catch { /* NASA tiles can still stream over the development proxy. */ }
  const columns = 2 ** (TILE_LEVEL + 1), rows = 2 ** TILE_LEVEL;
  const canvas = document.createElement('canvas');
  canvas.width = columns * 256;
  canvas.height = rows * 256;
  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.fillStyle = '#8a4937';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  let loaded = 0;
  const all = Array.from({ length: rows * columns }, (_, i) => ({ row: Math.floor(i/columns), col: i%columns }));
  // A limited queue avoids a burst of simultaneous image decodes and GPU uploads.
  async function fetchOne({ row, col }) {
    const suffix = `/${TILE_LEVEL}/${row}/${col}.jpg`;
    const urls = [
      ...(cachedTiles ? [`/nasa-data/mars-global-tiles${suffix}`] : []),
      `/trek-remote/tiles/Mars/EQ/Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0/default/default028mm${suffix}`,
      `${MARS_VIKING_TILES}${suffix}`
    ];
    for (const url of urls) {
      try {
        const image = await loadImage(url);
        ctx.drawImage(image, col*256, row*256, 256.2, 256.2);
        loaded++;
        return;
      } catch { /* Try another verified endpoint. */ }
    }
  }
  let cursor = 0;
  const worker = async () => { while (cursor < all.length) { const tile = all[cursor++]; await fetchOne(tile); } };
  await Promise.all(Array.from({ length: 6 }, worker));
  if (loaded === 0) throw new Error('NASA Viking map tiles unavailable; install assets with npm run fetch:global');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return { texture, label: `NASA VIKING MOSAIC (${loaded}/${all.length} TILES)`, partial: loaded !== all.length };
}

export default function MarsGlobalGlobe({ site = 'elysium', picked, onPick, onSiteChange }) {
  const controlsRef = useRef(null);
  const [mola, setMola] = useState(null);
  const [molaStatus, setMolaStatus] = useState('loading');
  const [imagery, setImagery] = useState(null);
  const [imageStatus, setImageStatus] = useState('loading');
  const [reset, setReset] = useState(0);
  const [relief, setRelief] = useState(GLOBE_RELIEF);
  useEffect(() => {
    let active = true;
    loadMarsGlobalMola().then(data => { if (active) { setMola(data); setMolaStatus('ready'); } })
      .catch(() => { if (active) setMolaStatus('unavailable'); });
    let texture;
    loadGlobalVikingTexture().then(result => {
      texture = result.texture;
      if (active) { setImagery(result); setImageStatus(result.partial ? 'partial' : 'ready'); }
      else texture.dispose();
    }).catch(() => { if (active) setImageStatus('unavailable'); });
    return () => { active = false; texture?.dispose(); };
  }, []);
  const zoomBy = useCallback(factor => {
    const controls = controlsRef.current;
    if (!controls) return;
    const direction = controls.object.position.clone().sub(controls.target);
    controls.object.position.copy(controls.target).add(direction.setLength(THREE.MathUtils.clamp(direction.length() / factor, 3.55, 26)));
    controls.update();
  }, []);
  return <div className="mars-wrapper mars-satellite-wrapper mars-global-wrapper">
    <Canvas frameloop="demand" dpr={[1, 1.35]} gl={{ antialias: false, powerPreference: 'high-performance' }}
      camera={{ position: [9, 2, 1], fov: 42, near: 0.1, far: 100 }}>
      <color attach="background" args={['#100e13']} />
      <ambientLight intensity={1.5}/>
      <directionalLight position={[8, 5, 12]} intensity={1.65}/>
      <MarsSphere mola={mola} texture={imagery?.texture} site={site} picked={picked} onPick={onPick} exaggeration={relief} />
      <OrbitControls makeDefault ref={controlsRef} enableDamping={false} enablePan={false} enableZoom zoomSpeed={1.08}
        minDistance={3.55} maxDistance={26} rotateSpeed={0.78}/>
      <GlobalCamera site={site} picked={picked} controlsRef={controlsRef} reset={reset}/>
    </Canvas>
    <div className={`mars-data-badge ${imageStatus === 'ready' ? 'real' : 'sample'}`}>
      <span className="status-dot"/>{imageStatus === 'ready' ? imagery.label : imageStatus === 'partial' ? `${imagery.label} - some tiles missing` : imageStatus === 'loading' ? 'LOADING NASA GLOBAL VIKING IMAGERY' : 'NASA IMAGERY UNAVAILABLE - BASIC GLOBE ONLY'}
    </div>
    <div className="mars-help">Whole Mars: rotate with drag | wheel/pinch to zoom | click any surface point</div>
    <div className="mars-region-toolbar" aria-label="Mars location presets">
      {SITES.map(loc => <button key={loc.id} onClick={() => onSiteChange?.(loc.id)} type="button">{loc.label}</button>)}
      <button type="button" onClick={() => setReset(n => n + 1)}>Recenter</button>
    </div>
    <div className="mars-global-relief-control"><label>Relief: {relief.toFixed(1)}x (visual emphasis)
      <input type="range" min="1" max="5" step="0.5" value={relief} onChange={e => setRelief(Number(e.target.value))}/></label>
    </div>
    <div className="mars-source"><strong>ENTIRE PLANET - 360 x 180 DEGREES</strong>
      <span>{molaStatus === 'ready' ? 'NASA MOLA MEGDR GLOBAL ELEVATION: ON' : molaStatus === 'loading' ? 'NASA MOLA GLOBAL ELEVATION: LOADING' : 'NASA MOLA GLOBAL ELEVATION: NOT FETCHED (NO HEIGHT VALUES)'}</span>
      <a target="_blank" rel="noreferrer" href={MARS_GLOBAL_MOLA_CATALOG}>MOLA primary dataset</a>
      {molaStatus === 'unavailable' && <span className="mars-setup-tip">Run npm run fetch:global to cache the NASA global DEM</span>}
    </div>
  </div>;
}
