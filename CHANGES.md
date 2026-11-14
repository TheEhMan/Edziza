# EDZIZA — NASA Space Apps upgrade notes

## Follow-up upgrade: Moon zoom + NASA DEM data

- **Moon zoom now works in both modes:** scroll-wheel/trackpad, touch pinch and visible `+`, `−`, `Reset` buttons. 3D uses `OrbitControls` with explicit zoom limits; the 2D NASA image supports zoom centered on cursor/touch, drag-to-pan, keyboard shortcuts and clickable study pins.
- **NASA Moon imagery access:** 3D Moon loader tries verified local NASA file, same-origin Vite development proxy, then the original NASA SVS URL. If WebGL fails, the 2D NASA map remains usable and zoomable. The user can manually switch to 2D.
- **NASA site DEM elevation:** the old orbital-irradiance reference (parameter #10) is replaced by *NASA DEM elevation* while retaining **12** parameters and **9** locations. Mars volcano heights are derived from the project's existing NASA MOLA grid, with values and sources under `public/nasa-data/mars-mola-sites.json`.
- **NASA lunar LOLA sampling:** a runtime loader uses NASA's 4ppd LRO LOLA global elevation TIFF and reads the actual grid cell at each selected Moon coordinate. `npm run fetch:nasa` can locally cache original NASA imagery, NASA TIFF and derived Moon site data for offline/static use. No lunar height number is hardcoded if download is unavailable.
- **More scientific transparency:** every NASA-derived parameter gets a source link and explanation of local DEM estimates versus planet-wide references. Missing Mars/Moon weather is not invented. See `docs/nasa-data-methodology.md`.

## Implemented (first release)

- Added third interactive world: Moon (`src/MoonScene.jsx`, `src/moon.css`) with a source-labeled NASA LRO color globe, 3 preset viewpoints, an image-fallback map and precise/approximate coordinate warnings.
- Centralized 3 Earth + 3 Mars + 3 Moon study locations in `src/siteData.js`, sharing independent selectors across the Compare, Maps and Data pages.
- Upgraded Compare and immersive Maps to include three worlds and an all-three mode, while preserving previous Earth and Mars visualization code.
- Created 12 shared data parameters in `src/parameters.js`; included exactly 12 fields on the Environmental Data page for all 9 sites (`src/ClimatePanel.jsx`).
- Expanded NASA POWER data request to include solar surface energy and kept climate parameters dynamically updated for the selected Earth site and annual/monthly period.
- Added source/quality labels for values, including explicit blanks where verified local readings are unavailable.
- Kept original terrain-analysis files and Earth↔Mars scoring intact. The Moon is intentionally excluded from that DEM score because no matched-resolution LOLA analysis has been performed.
- Updated mission story, labels, README, Moon/Mars source references, responsive layouts and a project verification script.

## Validation

Run `npm install` and then `npm run verify` to check 3 worlds, 9 coordinate-valid sites, 12 unique parameters and JSX parsing. Production builds on your computer use `npm run build`.

The developer-side environment could parse and verify the source but could not finish a Vite build using the original Windows-only `esbuild` binary from the uploaded ZIP. The release ZIP deliberately excludes `node_modules`; a clean `npm install` resolves platform-native packages.

## Scientific and network limitations

- NASA POWER is an online gridded climatology, not a live sensor feed.
- Mars/Moon planetary climate references are not local weather values; unsupported data is labeled unavailable.
- Moon globe uses NASA LRO-derived imagery and remains a smooth sphere; the Data page can additionally show real NASA LOLA grid-cell elevations when available. Moon imagery and LOLA TIFF require an online NASA source or `npm run fetch:nasa` cache.
- Earth external map tiles, NASA POWER, and the Moon imagery require network access. Mars regional tiles and elevation are bundled.
- Moon polar and Aristarchus coordinates represent research areas and are not certified spacecraft landing locations.
