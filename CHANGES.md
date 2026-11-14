# EDZIZA 3D Planetary Analog Finder — v5 changes

- **Primary input is now 3D**: the Find Earth analog page embeds the actual NASA Mars Elysium 3D MOLA terrain viewer or a rotatable 3D Moon globe. Users click the terrain/globe to choose any coordinate in the displayed coverage. The choice immediately drives Earth shortlist rankings.
- **3D map picking**: raycasting converts clicked positions to scientifically meaningful latitude/longitude and samples NASA Mars MOLA or Moon LOLA grid-cell elevation where available. Drags rotate rather than trigger selection.
- **Moon LOLA terrain deformation**: real LOLA 4ppd elevations deform the 3D sphere mesh (22x relief exaggeration) when NASA TIFF is accessible. If offline, **no fake terrain** is substituted: a clear smooth-globe fallback remains selectable and sources are labeled.
- **Earth map bug fix**: all eleven ranked Earth candidates now fly to their actual field-site coordinates rather than falling back to Mount Edziza.
- **Transparent matching**: nearest source-linked planetary research profile by geodesic distance; reveals the difference between clicked coordinate and research anchor and flags distant transfers as low-confidence. All eight domain descriptors remain source-driven at the profile level, not falsely measured at arbitrary pixels.
- **Reusable map selection** on immersive map page, plus CTA to the finder and an export that includes the clicked site coordinates, reference distance and NASA DEM elevation when available.
- **Validation**: new `scripts/test-3d-picker.mjs` covers lunar longitude normalization, spherical distance, selected planet profiles, Moon DEM raster sampling, input/map integration and correct Earth map site registry.

See `docs/3d-map-picking-and-matching.md` and `README.md` for the full workflow, NASA data attribution and limitations.

---

# EDZIZA — Planetary Analog Finder update (version 4)

This upgrade changes the product question from “compare three world maps” to **“choose a Mars/Moon exploration objective, find the best Earth field-test analog, and explain all matches and limits.”**

- Main screen: Mars/Moon target selector (3 locations each), 11 globally distributed Earth candidates, adjustable weights for **eight** research domains, evidence-linked feature matching, ranked list, interactive Earth map, and per-domain reasons.
- Replaced the default 12-parameter climate comparison, which contained physically unavoidable gaps, with eight universally **documented** domain profiles. These are interpreted research/test opportunities, not universal NASA-measured numerical readings.
- Earth POWER live Earth climatology, NASA MOLA derived Mars elevations, optionally NASA LRO/LOLA lunar DEM values remain distinguishable as quantitative source-derived data.
- Kept Earth/Mars/Moon map viewers and the user's detailed circular Moon reference image (marked separately from NASA's LRO orbital map).
- Preserved the original independent measured Edziza ↔ Hecates DEM terrain experiment.
- Added a dataset strategy page, users/competitors/method page, complete research documentation, reproducible profile validation and an exported machine-readable JSON catalogue.
- All eight domains contain a nonempty narrative and an evidence URL for **every** one of **17** catalogue locations; missing physical observations are never fabricated.

Validation: `npm run verify`; regenerate `public/analog-research-catalog.json` with `npm run export:catalog`. Full production build was not validated in this environment because the original dependency folder contained Windows-native esbuild binaries. Fresh `npm install` on the destination platform is required.

---

## Earlier releases

# EDZIZA — NASA Space Apps upgrade notes

## Follow-up upgrade: Moon zoom + NASA DEM data

- **Moon zoom now works in both modes:**
- **Detailed Moon map view:** added a third Moon visualization mode called **Detailed map**, using the project owner's uploaded detailed lunar reference image. It supports scroll-wheel zoom, touch pinch, drag-to-pan, keyboard navigation and clickable projected pins for Apollo 11, Shackleton and Aristarchus.
 scroll-wheel/trackpad, touch pinch and visible `+`, `−`, `Reset` buttons. 3D uses `OrbitControls` with explicit zoom limits; the 2D NASA image supports zoom centered on cursor/touch, drag-to-pan, keyboard shortcuts and clickable study pins.
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
