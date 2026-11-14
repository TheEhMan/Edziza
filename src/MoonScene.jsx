import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { WORLD_SITES, formatCoord } from './siteData.js';
import { NASA_LRO_BASE, NASA_LRO_COLOR_PATH, NASA_MOON_REFERENCE } from './nasaRaster.js';
import { atlasZoom, limit } from './moonZoomMath.js';
import { loadMoonElevationGrid, sampleMoonHeightKm, MOON_REFERENCE_RADIUS_KM } from './moonTopography.js';
import './moon.css';
import MoonTiledLayer, { NASA_MOON_WMTS_DOCS } from './MoonTiledLayer.jsx';

const GLOBE_TEXTURE_URLS = {
  performance: [['/nasa-data/lroc_color_2k.jpg', '2K'], [`/nasa-remote${NASA_LRO_COLOR_PATH}`, '2K'], [`${NASA_LRO_BASE}/lroc_color_2k.jpg`, '2K']],
  hd: [['/nasa-data/lroc_color_4k.jpg', '4K'], ['/nasa-data/lroc_color_2k.jpg', '2K'], [`/nasa-remote${NASA_LRO_COLOR_PATH}`, '2K'], [`${NASA_LRO_BASE}/lroc_color_2k.jpg`, '2K']],
  ultra: [['/nasa-data/lroc_color_8k.jpg', '8K'], ['/nasa-data/lroc_color_4k.jpg', '4K'], ['/nasa-data/lroc_color_2k.jpg', '2K'], [`/nasa-remote${NASA_LRO_COLOR_PATH}`, '2K'], [`${NASA_LRO_BASE}/lroc_color_2k.jpg`, '2K']]
};
const NASA_ATLAS_URLS = GLOBE_TEXTURE_URLS.hd.map(([url]) => url);
const DETAILED_MAP_URLS = ['/nasa-data/moon-topography-reference.jpg'];
const RADIUS = 3;
const DEFAULT_DISTANCE = 9.4;
const MIN_DISTANCE = 3.5;
const MAX_DISTANCE = 26;
const LOCATIONS = Object.values(WORLD_SITES.moon);
const LUNAR_RELIEF_EXAGGERATION = 1.5; // Realistic default: lunar relief is ~1% of radius, not 22x exaggerated.
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

function moonHeightRadius(grid, lat, lon, exaggeration = LUNAR_RELIEF_EXAGGERATION) {
  const km = sampleMoonHeightKm(grid, lat, lon);
  return RADIUS * (1 + (km ?? 0) / MOON_REFERENCE_RADIUS_KM * exaggeration);
}

function MoonGlobe({ site, picked, texture, topography, onPick, relief }) {
  const startPoint = useRef(null);
  const geometry = React.useMemo(() => {
    const sphere = new THREE.SphereGeometry(RADIUS, 160, 80);
    if (topography) {
      const positions = sphere.getAttribute('position');
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i);
        const lat = Math.asin(THREE.MathUtils.clamp(y / RADIUS, -1, 1)) * 180 / Math.PI;
        const lon = Math.atan2(-z, x) * 180 / Math.PI;
        const radius = moonHeightRadius(topography, lat, lon, relief);
        const ratio = radius / RADIUS;
        positions.setXYZ(i, x * ratio, y * ratio, z * ratio);
      }
      sphere.computeVertexNormals();
    }
    return sphere;
  }, [topography, relief]);
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
    moonHeightRadius(topography, location.lat, location.lon, relief) + 0.12);
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
  const [viewport, setViewport] = useState({ width: 900, height: 450 });
  const [urlIndex, setUrlIndex] = useState(0);
  const isDetailed = mode === 'detailed';
  const mapWidth = isDetailed
    ? Math.min(viewport.width * 0.96, viewport.height * 0.98)
    : Math.min(viewport.width, viewport.height * 2);
  const urls = isDetailed ? DETAILED_MAP_URLS : NASA_ATLAS_URLS;
  useEffect(() => {
    const target = viewportRef.current;
    if (!target) return;
    const observer = new ResizeObserver(entries => {
      const rect = entries[0].contentRect;
      setViewport(old => old.width === rect.width && old.height === rect.height
        ? old : { width: rect.width, height: rect.height });
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, []);
  const alt = isDetailed
    ? 'Detailed Moon reference map with labeled craters and topographic coloring'
    : 'NASA Lunar Reconnaissance Orbiter WAC global Moon mosaic';

  const update = useCallback(next => {
    const rect = viewportRef.current?.getBoundingClientRect();
    const width = rect?.width || 800;
    const height = rect?.height || 400;
    const zoom = limit(next.zoom, 1, isDetailed ? 18 : 12);
    const fittedWidth = isDetailed ? Math.min(width * 0.96, height*0.98) : Math.min(width, height*2);
    const fittedHeight = isDetailed ? fittedWidth : fittedWidth/2;
    const xBound = Math.max(0, (zoom*fittedWidth - width)/2);
    const yBound = Math.max(0, (zoom*fittedHeight - height)/2);
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
      <div className={`moon-atlas-layer ${isDetailed ? 'moon-atlas-layer-detailed' : ''}`} style={{
        width: `${mapWidth}px`, height: `${isDetailed ? mapWidth : mapWidth/2}px`,
        transform: `translate(-50%, -50%) translate(${view.x}px, ${view.y}px) scale(${view.zoom})` }}>
        {!isDetailed ? <>
          {/* The small NASA base image appears only while WMTS tiles stream in. */}
          <img draggable={false} className="moon-tile-placeholder"
            src="/nasa-data/lroc_color_2k.jpg" alt="" onError={event => { event.currentTarget.style.display = 'none'; }} />
          <MoonTiledLayer view={view} viewportWidth={viewport.width}
            viewportHeight={viewport.height} mapWidth={mapWidth} />
        </> : urlIndex < urls.length ? <img draggable={false} src={urls[urlIndex]}
          alt={alt} onError={() => setUrlIndex(i => i + 1)} />
        : <div className="moon-imagery-unavailable">The supplied low-resolution reference image could not be loaded.</div>}
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
  const [textureMode, setTextureMode] = useState('hd');
  const [textureResolution, setTextureResolution] = useState(null);
  const [viewMode, setViewMode] = useState('globe');
  const [relief, setRelief] = useState(LUNAR_RELIEF_EXAGGERATION);
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
    setTexture(null);
    setTextureResolution(null);
    setTextureError(false);
    (async () => {
      for (const [url, resolution] of GLOBE_TEXTURE_URLS[textureMode]) {
        if (cancelled) return;
        try {
          const result = await new Promise((resolve, reject) => loader.load(url, resolve, undefined, reject));
          result.colorSpace = THREE.SRGBColorSpace;
          result.anisotropy = 4;
          if (cancelled) result.dispose();
          else { activeTexture = result; setTexture(result); setTextureResolution(resolution); setTextureError(false); }
          return;
        } catch { /* Missing local HD asset; try a smaller local or official NASA image. */ }
      }
      if (!cancelled) setTextureError(true);
    })();
    return () => { cancelled = true; activeTexture?.dispose(); };
  }, [textureMode]);

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
    ? `NASA LRO ${textureResolution || '…'} · ${topography ? 'LOLA 3D' : 'LOLA PENDING'}`
    : viewMode === 'atlas'
      ? 'NASA MOON TREK · HIGH-RES TILED MAP'
      : 'REFERENCE IMAGE · LOW RES';
  const sourceDescription = isGlobe
    ? 'NASA LRO WAC imagery globe. Scientific values shown in Data use NASA LRO/LOLA products.'
    : viewMode === 'atlas'
      ? 'NASA Moon Trek WMTS streams LRO WAC image tiles at the zoom level needed. NASA LOLA elevations come from a separate raster.'
      : 'Supplied reference image is low resolution and non-georeferenced. Switch to the NASA tiled map for scientific location imagery.';

  return <div className="moon-scene">
    {isGlobe ? <Canvas frameloop="demand" gl={{ antialias: false }} camera={{ position: [9, 1.5, 1], fov: 45, near: 0.1, far: 100 }} dpr={[1, 1.35]}>
      <color attach="background" args={['#0a1019']} />
      <ambientLight intensity={1.35} />
      <directionalLight position={[6, 4, 10]} intensity={1.8} color="#fff4e0" />
      <MoonGlobe site={site} texture={texture} topography={topography} picked={picked} onPick={onPick} relief={relief} />
      <OrbitControls ref={controlsRef} makeDefault enableDamping={false}
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
    {isGlobe && <div className="moon-quality-controls">
      <label htmlFor="moon-texture-quality">Imagery quality</label>
      <select id="moon-texture-quality" value={textureMode} onChange={e => setTextureMode(e.target.value)}>
        <option value="performance">2K · faster</option>
        <option value="hd">4K · balanced</option>
        <option value="ultra">8K · opt-in</option>
      </select>
      <span>{textureResolution ? `${textureResolution} NASA texture loaded` : textureError ? 'NASA image unavailable' : 'Loading NASA imagery…'}</span>
      {textureResolution && textureResolution !== (textureMode === 'ultra' ? '8K' : textureMode === 'hd' ? '4K' : '2K')
        && <small>Higher-res file not installed. Run <code>{'npm run fetch:moon-' + (textureMode === 'ultra' ? 'ultra' : 'hd')}</code>, then refresh.</small>}
    </div>}
    {isGlobe && <div className="moon-relief-control"><label>Relief: {relief.toFixed(1)}× (1× true scale)
      <input type="range" min="1" max="5" step="0.5" value={relief} onChange={e => setRelief(Number(e.target.value))}/></label></div>}
    {isGlobe && <ZoomButtons zoom={DEFAULT_DISTANCE / globeDistance} onIn={() => zoomGlobe(1.35)}
      onOut={() => zoomGlobe(1 / 1.35)} onReset={resetGlobe} />}
    <div className="moon-hud">{modeLabel}</div>
    <div className="moon-view-switch" role="group" aria-label="Moon visualization mode">
      <button type="button" className={viewMode === 'detailed' ? 'selected' : ''}
        onClick={() => setViewMode('detailed')}>Reference image (low res)</button>
      <button type="button" className={viewMode === 'atlas' ? 'selected' : ''}
        onClick={() => setViewMode('atlas')}>2D NASA HD tiles</button>
      <button type="button" className={viewMode === 'globe' ? 'selected' : ''}
        title={topography ? 'NASA LOLA terrain globe' : 'Spherical preview — NASA terrain downloads when online'}
        onClick={() => setViewMode('globe')}>3D globe</button>
    </div>
    <div className="moon-hint">{isGlobe ? 'Click globe: select point · Drag: rotate · Scroll: zoom' : 'Scroll / pinch: zoom · Drag: pan'}</div>
    {isGlobe && <div className="moon-terrain-status">{topographyStatus === 'ready'
      ? `NASA LOLA DEM · 4 ppd (~7.6 km cells) · ${relief.toFixed(1)}× displayed relief`
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
      <a href={NASA_MOON_REFERENCE} target="_blank" rel="noreferrer">NASA LRO / LOLA DEM</a>
      <a href={NASA_MOON_WMTS_DOCS} target="_blank" rel="noreferrer">NASA Moon Trek tiles</a>
    </div>
  </div>;
}
