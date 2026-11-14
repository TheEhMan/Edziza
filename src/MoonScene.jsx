import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { WORLD_SITES, formatCoord } from './siteData.js';
import { NASA_LRO_BASE, NASA_LRO_COLOR_PATH, NASA_MOON_REFERENCE } from './nasaRaster.js';
import { atlasZoom, limit } from './moonZoomMath.js';
import { loadMoonElevationGrid, sampleMoonHeightKm, MOON_REFERENCE_RADIUS_KM } from './moonTopography.js';
import './moon.css';

const GLOBE_TEXTURE_URLS = [
  '/nasa-data/lroc_color_2k.jpg',
  `/nasa-remote${NASA_LRO_COLOR_PATH}`,
  `${NASA_LRO_BASE}/lroc_color_2k.jpg`
];
const NASA_ATLAS_URLS = GLOBE_TEXTURE_URLS;
const DETAILED_MAP_URLS = ['/nasa-data/moon-topography-reference.jpg'];
const RADIUS = 3;
const DEFAULT_DISTANCE = 9.4;
const MIN_DISTANCE = 3.5;
const MAX_DISTANCE = 26;
const LOCATIONS = Object.values(WORLD_SITES.moon);
const LUNAR_RELIEF_EXAGGERATION = 22; // NASA 4ppd LOLA relief needs exaggeration to be visible at globe scale.
const DETAILED_MAP_RADIUS = 47.2; // percent of square container used by the lunar disk.

function pointOnGlobe(lat, lon, radius = RADIUS) {
  const a = lat * Math.PI / 180;
  const b = lon * Math.PI / 180;
  // NASA equirectangular map has 0 E at center; on Three.js sphere, this is +X.
  return new THREE.Vector3(radius * Math.cos(a) * Math.cos(b), radius * Math.sin(a), -radius * Math.cos(a) * Math.sin(b));
}

function projectToReferenceDisk(lat, lon) {
  const a = lat * Math.PI / 180;
  const b = lon * Math.PI / 180;
  // Approximate the uploaded Moon reference image as a near-side orthographic projection.
  const x = Math.cos(a) * Math.sin(b);
  const y = Math.sin(a);
  const visible = Math.cos(a) * Math.cos(b) >= -0.05;
  return {
    visible,
    left: 50 + x * DETAILED_MAP_RADIUS,
    top: 50 - y * DETAILED_MAP_RADIUS
  };
}

function MoonCamera({ site, picked, controlsRef, resetToken }) {
  const { camera } = useThree();
  const previousReset = useRef(resetToken);
  useEffect(() => {
    const location = picked || WORLD_SITES.moon[site] || WORLD_SITES.moon.apollo11;
    const shouldResetDistance = previousReset.current !== resetToken;
    previousReset.current = resetToken;
    const controls = controlsRef.current;
    const radius = shouldResetDistance ? DEFAULT_DISTANCE : limit(controls?.getDistance?.() || DEFAULT_DISTANCE, MIN_DISTANCE, MAX_DISTANCE);
    camera.position.copy(pointOnGlobe(location.lat, location.lon, radius));
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    if (controls) {
      controls.target.set(0, 0, 0);
      controls.update();
    }
  }, [camera, site, picked, controlsRef, resetToken]);
  return null;
}

function moonHeightRadius(grid, lat, lon) {
  const km = sampleMoonHeightKm(grid, lat, lon);
  return RADIUS * (1 + (km ?? 0) / MOON_REFERENCE_RADIUS_KM * LUNAR_RELIEF_EXAGGERATION);
}

function MoonGlobe({ site, picked, texture, topography, onPick }) {
  const startPoint = useRef(null);
  const geometry = React.useMemo(() => {
    const sphere = new THREE.SphereGeometry(RADIUS, 256, 128);
    if (topography) {
      const positions = sphere.getAttribute('position');
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i);
        const lat = Math.asin(THREE.MathUtils.clamp(y / RADIUS, -1, 1)) * 180 / Math.PI;
        const lon = Math.atan2(-z, x) * 180 / Math.PI;
        const radius = moonHeightRadius(topography, lat, lon);
        const ratio = radius / RADIUS;
        positions.setXYZ(i, x * ratio, y * ratio, z * ratio);
      }
      sphere.computeVertexNormals();
    }
    return sphere;
  }, [topography]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const onDown = event => {
    if (event.button !== 0) return;
    startPoint.current = { x: event.nativeEvent.clientX, y: event.nativeEvent.clientY };
  };
  const onUp = event => {
    if (!startPoint.current || event.button !== 0) return;
    const dx = event.nativeEvent.clientX - startPoint.current.x;
    const dy = event.nativeEvent.clientY - startPoint.current.y;
    startPoint.current = null;
    if (dx * dx + dy * dy > 49) return; // Drag rotates, click selects.
    const direction = event.point.clone().normalize();
    const lat = Math.asin(THREE.MathUtils.clamp(direction.y, -1, 1)) * 180 / Math.PI;
    const lon = Math.atan2(-direction.z, direction.x) * 180 / Math.PI;
    const heightKm = sampleMoonHeightKm(topography, lat, lon);
    onPick?.(lat, lon, heightKm == null ? null : Math.round(heightKm * 1000));
  };
  const marker = location => pointOnGlobe(location.lat, location.lon,
    moonHeightRadius(topography, location.lat, location.lon) + 0.12);
  return <>
    <mesh geometry={geometry} onPointerDown={onDown} onPointerUp={onUp}>
      <meshStandardMaterial map={texture || null} color={texture ? '#ffffff' : '#aeb6c1'} roughness={1} metalness={0} />
    </mesh>
    {LOCATIONS.map(location => {
      const selected = site === location.id;
      const pos = marker(location);
      return <group key={location.id}>
        <mesh position={pos.toArray()} raycast={() => null}>
          <sphereGeometry args={[selected ? 0.068 : 0.045, 12, 12]} />
          <meshBasicMaterial color={selected ? '#b1ffe0' : '#ffcc9e'} depthTest />
        </mesh>
        <Html position={pos.toArray()} center occlude distanceFactor={9} style={{ pointerEvents: 'none' }}>
          <div className={`moon-marker ${selected ? 'is-selected' : ''}`}>{location.label}</div>
        </Html>
      </group>;
    })}
    {picked && <group>
      <mesh position={marker(picked).toArray()} raycast={() => null}>
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshBasicMaterial color="#94ffe0" />
      </mesh>
      <Html position={marker(picked).toArray()} center distanceFactor={8} style={{ pointerEvents: 'none' }}>
        <div className="moon-marker moon-marker-picked">YOUR LOCATION</div>
      </Html>
    </group>}
  </>;
}

function ZoomButtons({ zoom, onIn, onOut, onReset }) {
  return <div className="moon-zoom-controls" role="group" aria-label="Moon map zoom controls">
    <button type="button" title="Zoom in" aria-label="Zoom Moon map in" onClick={onIn}>+</button>
    <button type="button" title="Zoom out" aria-label="Zoom Moon map out" onClick={onOut}>−</button>
    <button type="button" className="moon-zoom-reset" title="Reset Moon map zoom" onClick={onReset}>Reset</button>
    <span aria-live="polite">{zoom.toFixed(1)}×</span>
  </div>;
}

function InteractiveMoonMap({ site, onSiteChange, mode = 'atlas' }) {
  const viewportRef = useRef(null);
  const pointersRef = useRef(new Map());
  const pinchRef = useRef(null);
  const viewRef = useRef({ zoom: 1, x: 0, y: 0 });
  const [view, setView] = useState(viewRef.current);
  const [urlIndex, setUrlIndex] = useState(0);
  const isDetailed = mode === 'detailed';
  const urls = isDetailed ? DETAILED_MAP_URLS : NASA_ATLAS_URLS;
  const alt = isDetailed
    ? 'Detailed Moon reference map with labeled craters and topographic coloring'
    : 'NASA Lunar Reconnaissance Orbiter WAC global Moon mosaic';

  const update = useCallback(next => {
    const rect = viewportRef.current?.getBoundingClientRect();
    const width = rect?.width || 800;
    const height = rect?.height || 400;
    const zoom = limit(next.zoom, 1, isDetailed ? 18 : 12);
    const xBound = (zoom - 1) * width / 2;
    const yBound = (zoom - 1) * height / 2;
    const corrected = { zoom, x: limit(next.x, -xBound, xBound), y: limit(next.y, -yBound, yBound) };
    viewRef.current = corrected;
    setView(corrected);
  }, [isDetailed]);
  const zoomBy = useCallback((factor, x = 0, y = 0) => {
    update(atlasZoom(viewRef.current, factor, x, y));
  }, [update]);
  const reset = useCallback(() => update({ zoom: 1, x: 0, y: 0 }), [update]);

  useEffect(() => {
    setUrlIndex(0);
    reset();
  }, [mode, reset]);

  useEffect(() => {
    const target = viewportRef.current;
    if (!target) return;
    const wheel = event => {
      event.preventDefault();
      const rect = target.getBoundingClientRect();
      zoomBy(Math.exp(-event.deltaY * 0.002),
        event.clientX - rect.left - rect.width / 2,
        event.clientY - rect.top - rect.height / 2);
    };
    target.addEventListener('wheel', wheel, { passive: false });
    return () => target.removeEventListener('wheel', wheel);
  }, [zoomBy]);

  const midpoint = list => ({ x: (list[0].x + list[1].x) / 2, y: (list[0].y + list[1].y) / 2 });
  const distance = list => Math.hypot(list[1].x - list[0].x, list[1].y - list[0].y);
  const onPointerDown = event => {
    if (event.target.closest('button')) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointersRef.current.size >= 2) {
      const list = [...pointersRef.current.values()].slice(0, 2);
      pinchRef.current = { midpoint: midpoint(list), distance: distance(list) };
    }
  };
  const onPointerMove = event => {
    const pointers = pointersRef.current;
    const before = pointers.get(event.pointerId);
    if (!before) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 1) {
      const current = viewRef.current;
      update({ ...current, x: current.x + event.clientX - before.x, y: current.y + event.clientY - before.y });
    } else if (pointers.size >= 2) {
      const list = [...pointers.values()].slice(0, 2);
      const next = { midpoint: midpoint(list), distance: distance(list) };
      const old = pinchRef.current || next;
      const rect = viewportRef.current?.getBoundingClientRect();
      const centerX = old.midpoint.x - (rect?.left || 0) - (rect?.width || 0) / 2;
      const centerY = old.midpoint.y - (rect?.top || 0) - (rect?.height || 0) / 2;
      const magnified = atlasZoom(viewRef.current, old.distance ? next.distance / old.distance : 1, centerX, centerY);
      update({ ...magnified, x: magnified.x + next.midpoint.x - old.midpoint.x, y: magnified.y + next.midpoint.y - old.midpoint.y });
      pinchRef.current = next;
    }
  };
  const onPointerEnd = event => {
    pointersRef.current.delete(event.pointerId);
    if (pointersRef.current.size < 2) pinchRef.current = null;
  };
  const onKeyDown = event => {
    if (event.key === '+' || event.key === '=') { event.preventDefault(); zoomBy(1.35); }
    if (event.key === '-' || event.key === '_') { event.preventDefault(); zoomBy(1 / 1.35); }
    if (event.key === '0') { event.preventDefault(); reset(); }
    const step = 32;
    const moves = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
    if (moves[event.key]) {
      event.preventDefault();
      const [dx, dy] = moves[event.key];
      update({ ...viewRef.current, x: viewRef.current.x + dx, y: viewRef.current.y + dy });
    }
  };

  return <>
    <div className={`moon-atlas ${isDetailed ? 'is-detailed' : ''}`} ref={viewportRef} role="region" tabIndex={0}
      aria-label={isDetailed
        ? 'Detailed Moon map: scroll or pinch to zoom, drag to pan; use plus, minus and arrow keys'
        : 'NASA Moon 2D map: scroll or pinch to zoom, drag to pan; use plus, minus and arrow keys'}
      onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd} onLostPointerCapture={onPointerEnd} onKeyDown={onKeyDown}>
      <div className={`moon-atlas-layer ${isDetailed ? 'moon-atlas-layer-detailed' : ''}`} style={{ transform: `translate(-50%, -50%) translate(${view.x}px, ${view.y}px) scale(${view.zoom})` }}>
        {urlIndex < urls.length ? <img draggable={false} src={urls[urlIndex]}
          alt={alt}
          onError={() => setUrlIndex(i => i + 1)} />
          : <div className="moon-imagery-unavailable">{isDetailed
            ? 'The detailed Moon reference image could not be loaded.'
            : <>NASA LRO map could not be loaded. Connect to the internet or run <code>npm run fetch:nasa</code>.</>}</div>}
        {LOCATIONS.map(location => {
          const selected = site === location.id;
          const position = isDetailed
            ? projectToReferenceDisk(location.lat, location.lon)
            : {
                visible: true,
                left: (location.lon + 180) / 360 * 100,
                top: (90 - location.lat) / 180 * 100
              };
          if (!position.visible) return null;
          return <button key={location.id} type="button"
            className={`moon-atlas-pin ${selected ? 'selected' : ''} ${isDetailed ? 'detailed-pin' : ''}`}
            title={location.label} aria-label={`Show ${location.label}`}
            style={{ left: `${position.left}%`, top: `${position.top}%` }}
            onClick={() => onSiteChange?.(location.id)} />;
        })}
      </div>
    </div>
    <ZoomButtons zoom={view.zoom} onIn={() => zoomBy(1.35)} onOut={() => zoomBy(1 / 1.35)} onReset={reset} />
  </>;
}

export default function MoonScene({ site = 'apollo11', onSiteChange, picked, onPick }) {
  const controlsRef = useRef(null);
  const [texture, setTexture] = useState(null);
  const [textureError, setTextureError] = useState(false);
  const [viewMode, setViewMode] = useState('globe');
  const [topography, setTopography] = useState(null);
  const [topographyStatus, setTopographyStatus] = useState('loading');
  const [globeDistance, setGlobeDistance] = useState(DEFAULT_DISTANCE);
  const [resetToken, setResetToken] = useState(0);

  useEffect(() => {
    let live = true;
    loadMoonElevationGrid()
      .then(data => { if (live) { setTopography(data); setTopographyStatus('ready'); } })
      .catch(() => { if (live) setTopographyStatus('unavailable'); });
    return () => { live = false; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let activeTexture;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    (async () => {
      for (const url of GLOBE_TEXTURE_URLS) {
        try {
          const result = await new Promise((resolve, reject) => loader.load(url, resolve, undefined, reject));
          result.colorSpace = THREE.SRGBColorSpace;
          result.anisotropy = 8;
          if (cancelled) result.dispose();
          else { activeTexture = result; setTexture(result); setTextureError(false); }
          return;
        } catch { /* try local, NASA dev proxy, then NASA's public server */ }
      }
      if (!cancelled) setTextureError(true);
    })();
    return () => { cancelled = true; activeTexture?.dispose(); };
  }, []);

  const zoomGlobe = useCallback(factor => {
    const controls = controlsRef.current;
    if (!controls) return;
    const camera = controls.object;
    const direction = camera.position.clone().sub(controls.target);
    const next = limit(direction.length() / factor, MIN_DISTANCE, MAX_DISTANCE);
    camera.position.copy(controls.target).add(direction.setLength(next));
    controls.update();
    setGlobeDistance(next);
  }, []);
  const resetGlobe = () => { setResetToken(n => n + 1); setGlobeDistance(DEFAULT_DISTANCE); };
  const selected = WORLD_SITES.moon[site] || WORLD_SITES.moon.apollo11;
  const isGlobe = viewMode === 'globe';
  const modeLabel = isGlobe
    ? (topography ? 'NASA LRO + LOLA · 3D RELIEF' : '3D MOON GLOBE · LOLA PENDING')
    : viewMode === 'atlas'
      ? 'NASA LRO · ZOOMABLE 2D MAP'
      : 'DETAILED MOON MAP · ZOOMABLE';
  const sourceDescription = isGlobe
    ? 'NASA LRO WAC imagery globe. Scientific values shown in Data use NASA LRO/LOLA products.'
    : viewMode === 'atlas'
      ? 'NASA LRO WAC equirectangular mosaic. Scientific values shown in Data use NASA LRO/LOLA products.'
      : 'Detailed visual reference map with projected study-site pins. Scientific values shown in Data still use NASA LRO/LOLA products.';

  return <div className="moon-scene">
    {isGlobe ? <Canvas camera={{ position: [9, 1.5, 1], fov: 45, near: 0.1, far: 100 }} dpr={[1, 1.7]}>
      <color attach="background" args={['#0a1019']} />
      <ambientLight intensity={1.35} />
      <directionalLight position={[6, 4, 10]} intensity={1.8} color="#fff4e0" />
      <MoonGlobe site={site} texture={texture} topography={topography} picked={picked} onPick={onPick} />
      <OrbitControls ref={controlsRef} makeDefault enableDamping dampingFactor={0.07}
        enableZoom zoomSpeed={1.15} enableRotate rotateSpeed={0.8}
        touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_ROTATE }}
        minDistance={MIN_DISTANCE} maxDistance={MAX_DISTANCE} enablePan={false}
        minPolarAngle={0.01} maxPolarAngle={Math.PI - 0.01}
        onChange={() => {
          const distance = controlsRef.current?.getDistance?.();
          if (Number.isFinite(distance)) setGlobeDistance(previous => Math.abs(previous - distance) >= 0.08 ? distance : previous);
        }} />
      <MoonCamera site={site} picked={picked} controlsRef={controlsRef} resetToken={resetToken} />
    </Canvas> : <InteractiveMoonMap site={site} onSiteChange={onSiteChange} mode={viewMode === 'atlas' ? 'atlas' : 'detailed'} />}
    {isGlobe && <ZoomButtons zoom={DEFAULT_DISTANCE / globeDistance} onIn={() => zoomGlobe(1.35)}
      onOut={() => zoomGlobe(1 / 1.35)} onReset={resetGlobe} />}
    <div className="moon-hud">{modeLabel}</div>
    <div className="moon-view-switch" role="group" aria-label="Moon visualization mode">
      <button type="button" className={viewMode === 'detailed' ? 'selected' : ''}
        onClick={() => setViewMode('detailed')}>Detailed map</button>
      <button type="button" className={viewMode === 'atlas' ? 'selected' : ''}
        onClick={() => setViewMode('atlas')}>2D NASA map</button>
      <button type="button" className={viewMode === 'globe' ? 'selected' : ''}
        title={topography ? 'NASA LOLA terrain globe' : 'Spherical preview — NASA terrain downloads when online'}
        onClick={() => setViewMode('globe')}>3D globe</button>
    </div>
    <div className="moon-hint">{isGlobe ? 'Click globe: select point · Drag: rotate · Scroll: zoom' : 'Scroll / pinch: zoom · Drag: pan'}</div>
    {isGlobe && <div className="moon-terrain-status">{topographyStatus === 'ready'
      ? 'NASA LOLA DEM · 4 ppd · relief exaggerated 22×'
      : topographyStatus === 'loading' ? 'Loading NASA LOLA topography…' : 'LOLA offline: smooth globe, no measured 3D relief · npm run fetch:nasa'}
      {textureError && ' · NASA LRO texture offline'}
    </div>}
    <div className="moon-location-toolbar" aria-label="Moon locations">
      {LOCATIONS.map(location => <button type="button" key={location.id} className={site === location.id ? 'selected' : ''}
        onClick={() => onSiteChange?.(location.id)}>{location.id === 'apollo11' ? 'Apollo 11' : location.id === 'shackleton' ? 'Shackleton' : 'Aristarchus'}</button>)}
    </div>
    <div className="moon-source">
      <strong>{formatCoord(picked?.lat ?? selected.lat, 'lat')} · {formatCoord(picked?.lon ?? selected.lon, 'lon')}{picked && topography && sampleMoonHeightKm(topography, picked.lat, picked.lon) !== null ? ` · LOLA ${Math.round(sampleMoonHeightKm(topography, picked.lat, picked.lon) * 1000).toLocaleString()} m` : ''}</strong>
      <span>{isGlobe && !topography ? 'NASA LOLA grid not loaded: globe is a sphere for coordinate picking. ' : ''}{sourceDescription}</span>
      <a href={NASA_MOON_REFERENCE} target="_blank" rel="noreferrer">NASA image + DEM credit</a>
    </div>
  </div>;
}
