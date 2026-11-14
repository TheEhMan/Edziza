import React, { useMemo, useState } from 'react';

// NASA Solar System Treks / JPL, LRO WAC 303 ppd v02 equatorial mosaic.
// WMTS tiles: 2^(z+1) columns, 2^z rows. Fetch only viewport-visible tiles.
export const NASA_MOON_WMTS = 'https://trek.nasa.gov/tiles/Moon/EQ/LRO_WAC_Mosaic_Global_303ppd_v02/1.0.0/default/default028mm';
export const NASA_MOON_WMTS_DOCS = 'https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=moon';

function Tile({ x, y, z, style }) {
  const [failed, setFailed] = useState(0);
  const suffix = `/${z}/${y}/${x}.jpg`;
  // Local cached tile first only if installed (chosen by parent); otherwise
  // normal NASA service. Browser img tags do not require cross-origin pixel access.
  const url = failed === 0
    ? `${NASA_MOON_WMTS}${suffix}`
    : `/nasa-data/moon-wmts-tiles${suffix}`;
  if (failed >= 2) return null;
  return <img className="moon-wmts-tile" key={`${z}-${x}-${y}`} src={url} alt=""
    draggable={false} decoding="async" loading="eager" style={style}
    onError={() => setFailed(n => n+1)} />;
}

export default function MoonTiledLayer({ view, viewportWidth, viewportHeight, mapWidth }) {
  const images = useMemo(() => {
    if (!mapWidth || !viewportWidth || !viewportHeight) return [];
    const mapHeight = mapWidth / 2;
    const level = Math.max(0, Math.min(6, Math.ceil(Math.log2(Math.max(512, mapWidth*view.zoom*1.2) / 512))));
    const columns = 2 ** (level + 1);
    const rows = 2 ** level;
    const tileWidth = mapWidth / columns;
    const tileHeight = mapHeight / rows;
    const left = mapWidth / 2 + (-viewportWidth/2 - view.x) / view.zoom;
    const right = mapWidth / 2 + (viewportWidth/2 - view.x) / view.zoom;
    const top = mapHeight / 2 + (-viewportHeight/2 - view.y) / view.zoom;
    const bottom = mapHeight / 2 + (viewportHeight/2 - view.y) / view.zoom;
    const x0 = Math.max(0, Math.floor(left / tileWidth)-1), x1 = Math.min(columns-1, Math.ceil(right/tileWidth));
    const y0 = Math.max(0, Math.floor(top / tileHeight)-1), y1 = Math.min(rows-1, Math.ceil(bottom/tileHeight));
    const tiles = [];
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      tiles.push({ x, y, z: level, style: {
        left: `${(x / columns) * 100}%`,
        top: `${(y / rows) * 100}%`,
        width: `${100/columns + 0.015}%`,
        height: `${100/rows + 0.015}%`
      } });
    }
    return tiles;
  }, [view, viewportWidth, viewportHeight, mapWidth]);
  return <div className="moon-tile-plane" aria-hidden="true">
    {images.map(tile => <Tile key={`${tile.z}:${tile.x}:${tile.y}`} {...tile} />)}
  </div>;
}
