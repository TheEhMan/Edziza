import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import './mars-satellite.css';
import MarsGlobalGlobe from './MarsGlobalGlobe.jsx';
import { WORLD_SITES } from './siteData.js';

// Geographically defined regional extent: all three volcanoes fit inside it.
// This same extent is used by scripts/fetch-mars-wide.mjs.
const REGION = { west: 139, east: 165, north: 43, south: 17 };
const MARS_RADIUS_KM = 3389.5;
const BASE_VERTICAL_EXAGGERATION = 16; // Explicitly exaggerated to make regional relief visible.
const SCENE_HEIGHT = 18;
const MID_LAT = (REGION.north + REGION.south) / 2;
const regionHeightKm = MARS_RADIUS_KM * Math.PI / 180 * (REGION.north - REGION.south);
const regionWidthKm = MARS_RADIUS_KM * Math.PI / 180 * (REGION.east - REGION.west) * Math.cos(MID_LAT * Math.PI / 180);
const SCENE_WIDTH = SCENE_HEIGHT * regionWidthKm / regionHeightKm;
const unitsPerKm = SCENE_HEIGHT / regionHeightKm;

const LANDMARKS = Object.values(WORLD_SITES.mars).map(site => ({ id: site.id, name: site.label, lat: site.lat, lon: site.lon }));
const PRESETS = {
  overview: { label: 'Whole region', target: null, cameraOffset: [7, 27, 27] },
  hecates: { label: 'Hecates Tholus', target: LANDMARKS[0], cameraOffset: [3, 6.5, 8] },
  elysium: { label: 'Elysium Mons', target: LANDMARKS[1], cameraOffset: [5, 10, 12] },
  albor: { label: 'Albor Tholus', target: LANDMARKS[2], cameraOffset: [3, 7, 9] }
};

function projectedPoint(lat, lon) {
  return {
    x: ((lon - REGION.west) / (REGION.east - REGION.west) - 0.5) * SCENE_WIDTH,
    z: ((REGION.north - lat) / (REGION.north - REGION.south) - 0.5) * SCENE_HEIGHT
  };
}

function elevationRange(heights) {
  let min = Infinity;
  let max = -Infinity;
  for (const row of heights) {
    for (const number of row) {
      if (Number.isFinite(number)) {
        if (number < min) min = number;
        if (number > max) max = number;
      }
    }
  }
  return { min: Number.isFinite(min) ? min : 0, max: Number.isFinite(max) ? max : 0 };
}

function getElevationAt(data, lat, lon) {
  if (!data?.heights?.length) return 0;
  const heights = data.heights;
  const rows = heights.length;
  const cols = heights[0].length;
  const bounds = data.bounds;
  const fx = THREE.MathUtils.clamp((lon - bounds.west) / (bounds.east - bounds.west) * (cols - 1), 0, cols - 1);
  const fy = THREE.MathUtils.clamp((bounds.north - lat) / (bounds.north - bounds.south) * (rows - 1), 0, rows - 1);
  const x = Math.floor(fx), y = Math.floor(fy);
  const x2 = Math.min(x + 1, cols - 1), y2 = Math.min(y + 1, rows - 1);
  const values = [heights[y][x], heights[y][x2], heights[y2][x], heights[y2][x2]];
  if (!values.every(Number.isFinite)) return values.find(Number.isFinite) ?? 0;
  const a = THREE.MathUtils.lerp(values[0], values[1], fx - x);
  const b = THREE.MathUtils.lerp(values[2], values[3], fx - x);
  return THREE.MathUtils.lerp(a, b, fy - y);
}

function renderedElevation(metres, minMetres, multiplier) {
  return ((metres - minMetres) / 1000) * unitsPerKm * BASE_VERTICAL_EXAGGERATION * multiplier - 0.9;
}

function MarsTerrain({ data, texture, exaggeration, onPick }) {
  const startPoint = useRef(null);
  const onDown = event => {
    if (event.button !== 0) return;
    startPoint.current = { x: event.nativeEvent.clientX, y: event.nativeEvent.clientY };
  };
  const onUp = event => {
    if (!startPoint.current || event.button !== 0) return;
    const dx = event.nativeEvent.clientX - startPoint.current.x;
    const dy = event.nativeEvent.clientY - startPoint.current.y;
    startPoint.current = null;
    if (dx * dx + dy * dy > 49) return; // Drags orbit; short clicks select.
    const { x, z } = event.point; // actual 3D raycast, not flat-screen coordinates
    const lat = REGION.north - (z / SCENE_HEIGHT + 0.5) * (REGION.north - REGION.south);
    const lon = REGION.west + (x / SCENE_WIDTH + 0.5) * (REGION.east - REGION.west);
    if (lat < REGION.south - 0.01 || lat > REGION.north + 0.01 || lon < REGION.west - 0.01 || lon > REGION.east + 0.01) return;
    onPick?.(lat, lon, Math.round(getElevationAt(data, lat, lon)));
  };
  const heights = data?.heights ?? [[0, 0], [0, 0]]; // Flat fallback, not fabricated terrain.
  const bounds = data?.bounds ?? REGION;
  const { min, max } = useMemo(() => elevationRange(heights), [heights]);
  const geometry = useMemo(() => {
    const rows = heights.length;
    const cols = heights[0].length;
    const mesh = new THREE.PlaneGeometry(SCENE_WIDTH, SCENE_HEIGHT, cols - 1, rows - 1);
    const positions = mesh.getAttribute('position');
    const colors = new Float32Array(rows * cols * 3);
    const low = new THREE.Color('#542c28');
    const high = new THREE.Color('#d79569');

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const i = row * cols + col;
        const h = Number.isFinite(heights[row][col]) ? heights[row][col] : min;
        positions.setZ(i, ((h - min) / 1000) * unitsPerKm * BASE_VERTICAL_EXAGGERATION * exaggeration);
        const blend = THREE.MathUtils.clamp((h - min) / Math.max(max - min, 1), 0, 1);
        const color = low.clone().lerp(high, blend);
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
      }
    }
    mesh.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    mesh.computeVertexNormals();
    mesh.rotateX(-Math.PI / 2);
    return mesh;
  }, [heights, min, max, exaggeration]);

  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry} position={[0, -0.9, 0]} onPointerDown={onDown} onPointerUp={onUp}>
      <meshStandardMaterial
        map={texture ?? null}
        vertexColors={!texture}
        color="white"
        roughness={1}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function MapLandmarks({ data, exaggeration, picked }) {
  const minimum = useMemo(() => elevationRange(data?.heights ?? [[0]]).min, [data]);
  return <> {LANDMARKS.map(point => {
    const where = projectedPoint(point.lat, point.lon);
    const height = renderedElevation(getElevationAt(data, point.lat, point.lon), minimum, exaggeration);
    return (
      <Html key={point.id} position={[where.x, height + 0.20, where.z]} center>
        <div className="mars-landmark" aria-label={point.name}>
          <span className="mars-landmark-dot" />
          <span>{point.name}</span>
        </div>
      </Html>
    );
  })}
  {picked && (() => {
    const position = projectedPoint(picked.lat, picked.lon);
    const y = renderedElevation(getElevationAt(data, picked.lat, picked.lon), minimum, exaggeration);
    return <Html key="user-picked" position={[position.x, y + 0.28, position.z]} center style={{ pointerEvents: 'none' }}>
      <div className="mars-landmark mars-picked-landmark"><span className="mars-landmark-dot"/>SELECTED POINT · NASA MOLA {Math.round(getElevationAt(data, picked.lat, picked.lon)).toLocaleString()} m</div>
    </Html>;
  })()}
  </>;
}

function MoveCamera({ selected, controlsRef }) {
  const { camera } = useThree();
  useEffect(() => {
    const preset = PRESETS[selected];
    const point = preset.target ? projectedPoint(preset.target.lat, preset.target.lon) : { x: 0, z: 0 };
    const target = new THREE.Vector3(point.x, 0, point.z);
    camera.position.set(
      target.x + preset.cameraOffset[0],
      preset.cameraOffset[1],
      target.z + preset.cameraOffset[2]
    );
    camera.lookAt(target);
    if (controlsRef.current) {
      controlsRef.current.target.copy(target);
      controlsRef.current.update();
    }
    camera.updateProjectionMatrix();
  }, [camera, selected, controlsRef]);
  return null;
}

async function imageFromURL(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Unable to display imagery tile: ${url}`));
    img.src = url; // Same-origin files in public/, so no external CORS restrictions in WebGL.
  });
}

async function makeNASAImageryTexture(manifest) {
  if (!manifest?.tiles?.length || !manifest.bounds || manifest.zoom !== 6) {
    throw new Error('Imagery manifest is missing or from the wrong map zoom level.');
  }
  const { west, east, north, south } = manifest.bounds;
  if (west !== REGION.west || east !== REGION.east || north !== REGION.north || south !== REGION.south) {
    throw new Error('Imagery bounds do not match the geometry. Rerun the NASA imagery downloader.');
  }
  const tileSize = manifest.tileSize ?? 256;
  const worldPixelsX = tileSize * manifest.tileColumns;
  const worldPixelsY = tileSize * manifest.tileRows;
  const leftPx = (west + 180) / 360 * worldPixelsX;
  const rightPx = (east + 180) / 360 * worldPixelsX;
  const topPx = (90 - north) / 180 * worldPixelsY;
  const bottomPx = (90 - south) / 180 * worldPixelsY;
  const spanPxX = rightPx - leftPx;
  const spanPxY = bottomPx - topPx;
  const limit = 2048; // Avoid oversized WebGL textures in older computers.
  const scale = Math.min(1, limit / Math.max(spanPxX, spanPxY));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.ceil(spanPxX * scale));
  canvas.height = Math.max(1, Math.ceil(spanPxY * scale));
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('Browser canvas is unavailable.');
  ctx.fillStyle = '#6b4741';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  let loaded = 0;
  // Cache tiles locally before uploading the stitched image as one GPU texture.
  await Promise.all(manifest.tiles.map(async (tile) => {
    try {
      const img = await imageFromURL(tile.file);
      ctx.drawImage(
        img,
        (tile.x * tileSize - leftPx) * scale,
        (tile.y * tileSize - topPx) * scale,
        tileSize * scale + 0.1,
        tileSize * scale + 0.1
      );
      loaded++;
    } catch (error) { console.warn(error.message); }
  }));
  if (!loaded) throw new Error('No NASA satellite imagery tiles could be opened.');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return { texture, count: loaded, total: manifest.tiles.length };
}

function MarsRegionScene({ exaggeration = 1.15, site = 'hecates', onSiteChange, onPick, picked }) {
  const [data, setData] = useState(null);
  const [textureInfo, setTextureInfo] = useState(null);
  const [view, setView] = useState(site);
  const [error, setError] = useState('');
  const controlsRef = useRef(null);

  useEffect(() => { if (!picked) setView(site); }, [site, picked]);

  useEffect(() => {
    let cancelled = false;
    fetch('/mars-wide-elevation.json')
      .then(response => {
        if (!response.ok) throw new Error('Wider MOLA topography has not been downloaded.');
        return response.json();
      })
      .then(json => {
        if (!json?.bounds || !Array.isArray(json.heights) || json.heights.length < 2) {
          throw new Error('Wider MOLA topography file is invalid.');
        }
        if (JSON.stringify(json.bounds) !== JSON.stringify(REGION)) {
          throw new Error('MOLA and imagery footprints do not match.');
        }
        if (!cancelled) setData(json);
      })
      .catch(err => { console.warn('Mars MOLA topography:', err); if (!cancelled) setError(err.message); });

    let newTexture;
    fetch('/mars-orbital-tiles.json')
      .then(response => {
        if (!response.ok) throw new Error('NASA satellite tiles have not been downloaded.');
        return response.json();
      })
      .then(makeNASAImageryTexture)
      .then(result => {
        newTexture = result.texture;
        if (!cancelled) setTextureInfo(result);
        else newTexture.dispose();
      })
      .catch(err => { console.warn('NASA Mars satellite imagery:', err); if (!cancelled) setError(previous => previous ? `${previous} ${err.message}` : err.message); });
    return () => {
      cancelled = true;
      newTexture?.dispose();
    };
  }, []);

  const satelliteLoaded = Boolean(textureInfo?.texture);
  return (
    <div className="mars-wrapper mars-satellite-wrapper">
      <Canvas frameloop="demand" gl={{ antialias: false }} camera={{ position: [7, 27, 27], fov: 48, near: 0.1, far: 160 }} dpr={[1, 1.35]}>
        <color attach="background" args={['#120f14']} />
        <ambientLight intensity={1.8} />
        <directionalLight position={[-9, 15, 12]} intensity={1.6} color="#fff0d9" />
        <MarsTerrain data={data} texture={textureInfo?.texture} exaggeration={exaggeration} onPick={data ? onPick : undefined} />
        <MapLandmarks data={data} exaggeration={exaggeration} picked={picked} />
        <OrbitControls
          ref={controlsRef}
          makeDefault
          target={[0, 0, 0]}
          enableDamping={false}
          enablePan
          minDistance={5}
          maxDistance={70}
          minPolarAngle={0.12}
          maxPolarAngle={Math.PI / 2 - 0.03}
        />
        <MoveCamera selected={view} controlsRef={controlsRef} />
      </Canvas>
      <div className={`mars-data-badge ${satelliteLoaded && data ? 'real' : 'sample'}`}>
        <span className="status-dot" />
        {satelliteLoaded ? 'NASA VIKING ORBITAL IMAGERY' : 'SATELLITE TILES NOT LOADED'}
      </div>
      <div className="mars-help">Click terrain: select a location | Drag: orbit | Scroll: zoom | Right-drag: pan</div>
      <div className="mars-region-toolbar" aria-label="Mars map locations">
        {Object.entries(PRESETS).map(([id, preset]) => (
          <button key={id} type="button" className={view === id ? 'selected' : ''} onClick={() => { setView(id); if (id !== 'overview') onSiteChange?.(id); }}>
            {preset.label}
          </button>
        ))}
      </div>
      <div className="mars-source">
        <strong>ELYSIUM VOLCANIC REGION · ~1,300 × 1,540 km</strong>
        <span>
          {satelliteLoaded ? `Viking mosaic (${textureInfo.count}/${textureInfo.total} image tiles)` : 'NASA satellite texture not installed'}
          {' · '}
          {data ? 'MOLA DEM terrain · click anywhere in the displayed region' : '3D topography unavailable — selection disabled'}
          {' · '}
          {`relief exaggerated ${(BASE_VERTICAL_EXAGGERATION * exaggeration).toFixed(1)}×`}
        </span>
        {(!data || !satelliteLoaded) && <span className="mars-setup-tip">Run: node scripts/fetch-mars-wide.mjs</span>}
        {error && <span className="mars-error-message" title={error}>Some NASA map files are unavailable. Open the console for details.</span>}
      </div>
    </div>
  );
}

// Whole-planet globe is the default; the original NASA 3D Elysium DEM is still
// available when a researcher needs regional terrain instead of global context.
export default function MarsScene(props) {
  const [mode, setMode] = useState('global');
  return <div className="mars-map-mode-host">
    {mode === 'global' ? <MarsGlobalGlobe {...props} /> : <MarsRegionScene {...props} />}
    <div className="mars-map-mode-switch" role="group" aria-label="Mars 3D map scale">
      <button type="button" className={mode === 'global' ? 'selected' : ''} onClick={() => setMode('global')}>Whole Mars 3D</button>
      <button type="button" className={mode === 'region' ? 'selected' : ''} onClick={() => setMode('region')}>Elysium detail</button>
    </div>
  </div>;
}
