import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { WORLD_SITES, formatCoord } from './siteData.js';
import { NASA_LRO_BASE, NASA_LRO_COLOR_PATH, NASA_MOON_REFERENCE } from './nasaRaster.js';
import { atlasZoom, limit } from './moonZoomMath.js';
import './moon.css';

const TEXTURE_URLS = [
  '/nasa-data/lroc_color_2k.jpg',
  `/nasa-remote${NASA_LRO_COLOR_PATH}`,
  `${NASA_LRO_BASE}/lroc_color_2k.jpg`
];
const RADIUS = 3;
const DEFAULT_DISTANCE = 9.4;
const MIN_DISTANCE = 3.5;
const MAX_DISTANCE = 26;
const LOCATIONS = Object.values(WORLD_SITES.moon);

function pointOnGlobe(lat, lon, radius = RADIUS) {
  const a = lat * Math.PI / 180;
  const b = lon * Math.PI / 180;
  // NASA equirectangular map has 0 E at center; on Three.js sphere, this is +X.
  return new THREE.Vector3(radius * Math.cos(a) * Math.cos(b), radius * Math.sin(a), -radius * Math.cos(a) * Math.sin(b));
}

function MoonCamera({ site, controlsRef, resetToken }) {
  const { camera } = useThree();
  const previousReset = useRef(resetToken);
  useEffect(() => {
    const location = WORLD_SITES.moon[site] || WORLD_SITES.moon.apollo11;
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
  }, [camera, site, controlsRef, resetToken]);
  return null;
}

function MoonGlobe({ site, texture }) {
  return <>
    <mesh>
      <sphereGeometry args={[RADIUS, 128, 96]} />
      <meshStandardMaterial map={texture || null} color={texture ? '#ffffff' : '#a9b2b9'} roughness={1} metalness={0} />
    </mesh>
    {LOCATIONS.map(location => {
      const selected = site === location.id;
      const pos = pointOnGlobe(location.lat, location.lon, RADIUS + 0.047);
      return <group key={location.id}>
        <mesh position={pos.toArray()}>
          <sphereGeometry args={[selected ? 0.072 : 0.047, 12, 12]} />
          <meshBasicMaterial color={selected ? '#b1ffe0' : '#ffcc9e'} depthTest />
        </mesh>
        <Html position={pointOnGlobe(location.lat, location.lon, RADIUS + 0.13).toArray()}
          center occlude distanceFactor={8} style={{ pointerEvents: 'none' }}>
          <div className={`moon-marker ${selected ? 'is-selected' : ''}`}>{location.label}</div>
        </Html>
      </group>;
    })}
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

function MoonAtlas({ site, onSiteChange }) {
  const viewportRef = useRef(null);
  const pointersRef = useRef(new Map());
  const pinchRef = useRef(null);
  const viewRef = useRef({ zoom: 1, x: 0, y: 0 });
  const [view, setView] = useState(viewRef.current);
  const [urlIndex, setUrlIndex] = useState(0);

  const update = useCallback(next => {
    const rect = viewportRef.current?.getBoundingClientRect();
    const width = rect?.width || 800;
    const height = rect?.height || 400;
    const zoom = limit(next.zoom, 1, 12);
    // Limit panning to keep at least some of the dataset in view.
    const xBound = (zoom - 1) * width / 2;
    const yBound = (zoom - 1) * height / 2;
    const corrected = { zoom, x: limit(next.x, -xBound, xBound), y: limit(next.y, -yBound, yBound) };
    viewRef.current = corrected;
    setView(corrected);
  }, []);
  const zoomBy = useCallback((factor, x = 0, y = 0) => {
    update(atlasZoom(viewRef.current, factor, x, y));
  }, [update]);
  const reset = useCallback(() => update({ zoom: 1, x: 0, y: 0 }), [update]);

  useEffect(() => {
    const target = viewportRef.current;
    if (!target) return;
    const wheel = event => {
      event.preventDefault(); // Zoom the Moon, not the surrounding page.
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
    <div className="moon-atlas" ref={viewportRef} role="region" tabIndex={0} aria-label="NASA Moon 2D map: scroll or pinch to zoom, drag to pan; use plus, minus and arrow keys"
      onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd} onLostPointerCapture={onPointerEnd} onKeyDown={onKeyDown}>
      <div className="moon-atlas-layer" style={{ transform: `translate(-50%, -50%) translate(${view.x}px, ${view.y}px) scale(${view.zoom})` }}>
        {urlIndex < TEXTURE_URLS.length ? <img draggable={false} src={TEXTURE_URLS[urlIndex]}
          alt="NASA Lunar Reconnaissance Orbiter WAC global Moon mosaic"
          onError={() => setUrlIndex(i => i + 1)} />
          : <div className="moon-imagery-unavailable">NASA LRO map could not be loaded. Connect to the internet or run <code>npm run fetch:nasa</code>.</div>}
        {LOCATIONS.map(location => <button key={location.id} type="button"
          className={`moon-atlas-pin ${site === location.id ? 'selected' : ''}`}
          title={location.label} aria-label={`Show ${location.label}`}
          style={{ left: `${(location.lon + 180) / 360 * 100}%`, top: `${(90 - location.lat) / 180 * 100}%` }}
          onClick={() => onSiteChange?.(location.id)} />)}
      </div>
    </div>
    <ZoomButtons zoom={view.zoom} onIn={() => zoomBy(1.35)} onOut={() => zoomBy(1 / 1.35)} onReset={reset} />
  </>;
}

export default function MoonScene({ site = 'apollo11', onSiteChange }) {
  const controlsRef = useRef(null);
  const [texture, setTexture] = useState(null);
  const [textureError, setTextureError] = useState(false);
  const [viewMode, setViewMode] = useState('globe');
  const [globeDistance, setGlobeDistance] = useState(DEFAULT_DISTANCE);
  const [resetToken, setResetToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let activeTexture;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    (async () => {
      for (const url of TEXTURE_URLS) {
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
  const showAtlas = viewMode === 'atlas' || textureError;
  return <div className="moon-scene">
    {!showAtlas ? <Canvas camera={{ position: [9, 1.5, 1], fov: 45, near: 0.1, far: 100 }} dpr={[1, 1.7]}>
      <color attach="background" args={['#0a1019']} />
      <ambientLight intensity={1.35} />
      <directionalLight position={[6, 4, 10]} intensity={1.8} color="#fff4e0" />
      <MoonGlobe site={site} texture={texture} />
      <OrbitControls ref={controlsRef} makeDefault enableDamping dampingFactor={0.07}
        enableZoom zoomSpeed={1.15} enableRotate rotateSpeed={0.8}
        touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_ROTATE }}
        minDistance={MIN_DISTANCE} maxDistance={MAX_DISTANCE} enablePan={false}
        minPolarAngle={0.01} maxPolarAngle={Math.PI - 0.01}
        onChange={() => {
          const distance = controlsRef.current?.getDistance?.();
          if (Number.isFinite(distance)) setGlobeDistance(previous => Math.abs(previous - distance) >= 0.08 ? distance : previous);
        }} />
      <MoonCamera site={site} controlsRef={controlsRef} resetToken={resetToken} />
    </Canvas> : <MoonAtlas site={site} onSiteChange={onSiteChange} />}
    {!showAtlas && <ZoomButtons zoom={DEFAULT_DISTANCE / globeDistance} onIn={() => zoomGlobe(1.35)}
      onOut={() => zoomGlobe(1 / 1.35)} onReset={resetGlobe} />}
    <div className="moon-hud">{texture ? 'NASA LRO · WAC ORBITAL MOSAIC' : textureError ? 'NASA LRO · ZOOMABLE 2D MAP' : 'LOADING NASA LRO IMAGERY'}</div>
    <div className="moon-view-switch" role="group" aria-label="Moon visualization mode">
      <button type="button" className={!showAtlas ? 'selected' : ''} disabled={textureError}
        title={textureError ? '3D WebGL NASA texture unavailable; using zoomable NASA atlas' : '3D Moon globe'}
        onClick={() => setViewMode('globe')}>3D globe</button>
      <button type="button" className={showAtlas ? 'selected' : ''}
        onClick={() => setViewMode('atlas')}>2D map</button>
    </div>
    <div className="moon-hint">{showAtlas ? 'Scroll / pinch: zoom · Drag: pan' : 'Scroll / pinch: zoom · Drag: rotate'}</div>
    <div className="moon-location-toolbar" aria-label="Moon locations">
      {LOCATIONS.map(location => <button type="button" key={location.id} className={site === location.id ? 'selected' : ''}
        onClick={() => onSiteChange?.(location.id)}>{location.id === 'apollo11' ? 'Apollo 11' : location.id === 'shackleton' ? 'Shackleton' : 'Aristarchus'}</button>)}
    </div>
    <div className="moon-source">
      <strong>{formatCoord(selected.lat, 'lat')} · {formatCoord(selected.lon, 'lon')}</strong>
      <span>NASA LRO WAC imagery · measured LOLA elevation shown in Data when available</span>
      <a href={NASA_MOON_REFERENCE} target="_blank" rel="noreferrer">NASA image + DEM credit</a>
    </div>
  </div>;
}
