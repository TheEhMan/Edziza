# Project EDZIZA — Earth · Mars · Moon Explorer

**NASA Space Apps research prototype | 3 worlds · 9 locations · 12 parameters**

EDZIZA is an interactive React/Vite explorer for comparing Earth volcanic field sites with Martian volcanic terrain and contrasting three lunar exploration regions. Its goal is to help users investigate which Earth experiments might inform future robotic exploration without pretending that different worlds have identical environments.

## Getting started

Prerequisites: **Node.js 22+**, npm, and an internet connection for NASA LRO imagery, NASA LOLA global DEM, Earth tiles and NASA POWER (unless NASA Moon assets have been locally cached).

```bash
npm install
npm run dev
```

The **Moon map can zoom with the mouse wheel/trackpad, pinch gestures, `+` / `−` buttons, or keyboard `+` / `-` / `0` in the 2D viewer**. Drag rotates the 3D globe; drag pans the 2D map. Use the **3D globe / 2D map** switch to choose either mode. Every moon location remains selectable.

For a reliable offline demonstration or a static production deployment, download the unmodified source NASA imagery and NASA LOLA elevation grid **on a computer with internet access**:

```bash
npm run fetch:nasa
```

This downloads NASA LRO WAC color imagery plus the NASA LOLA 4-pixels-per-degree elevation GeoTIFF to `public/nasa-data/` and creates `moon-lola-sites.json` with **sampled elevations at the three Moon coordinates**. Only the MOLA-derived Mars elevations are prebundled; Moon LOLA elevations are **not** prefilled when the source files cannot be reached. On the Vite dev server, a same-origin proxy can retrieve the Moon data automatically. On static hosting, run `npm run fetch:nasa` before building, or the browser will attempt a direct NASA request that may be blocked by CORS.

Open the URL printed by Vite (usually `http://localhost:5173/`). To prepare a production build:

```bash
npm run build
npm run preview
```

**Important:** The distributed ZIP omits `node_modules` and `.git` to keep it small and portable. If you previously copied a `node_modules` folder from Windows to Linux/macOS (or vice versa), delete it and rerun `npm install`; the `esbuild` binary is platform-specific.

## What's new

- **Moon viewer + zoom:** NASA LRO WAC image applied to a rotatable 3D globe, plus a switchable 2D atlas with wheel/trackpad zoom, pinch zoom, drag pan, keyboard controls, `+` / `−` and Reset. A 2D atlas is also used when WebGL cannot load NASA's image. The globe mesh stays spherical; gridded NASA LOLA heights appear separately in the scientific data panel.
- **Nine locations:** Three sites per world, selected independently from the three map cards and from the data page.
- **Twelve parameters:** Added **NASA DEM elevation** (MOLA for Mars; LOLA for Moon) in place of the old planet-wide orbital irradiance field. Each value links to its NASA source when applicable. Unavailable local measurements remain explicitly unavailable.
- **All-three view:** Compare all three maps side-by-side or switch between Earth / Mars / Moon and full screen.
- **Existing analysis preserved:** Copernicus Earth DEM versus NASA Mars MOLA matched-footprint terrain ranking remains available on the Scientific analysis page. **Moon sites are not included in that terrain score.**

## Location catalogue

| World | Location | Approximate coordinates | Why investigate? |
| --- | --- | --- | --- |
| Earth | Snowshoe Lava Field | 57.650° N, 130.667° W | Basaltic flows / possible lava–ice analogs |
| Earth | Mount Edziza summit | 57.720° N, 130.630° W | Glaciated volcanic relief |
| Earth | Desolation Lava Field | 57.817° N, 130.617° W | Basaltic flows and volcanic cones |
| Mars | Hecates Tholus | 32.090° N, 150.200° E | Reported glacier-related volcanic landforms |
| Mars | Elysium Mons | 24.740° N, 146.900° E | Large shield volcano |
| Mars | Albor Tholus | 18.790° N, 150.400° E | Volcanic cone / lava flows |
| Moon | Apollo 11 / Tranquility Base | 0.67416° N, 23.47314° E | Confirmed historical basaltic mare landing site |
| Moon | Shackleton / lunar south pole | ~89.9° S, 0° E | Representative polar location near Shackleton rim; **not a specific landing point** |
| Moon | Aristarchus Plateau | ~26° N, 49° W | Representative volcanic plateau area; **not a specific landing point** |

Earth locations are in the Mount Edziza volcanic complex in northern British Columbia. The three Mars sites already lie in the original Viking/MOLA Elysium map region. Moon longitude uses the Mean Earth/Polar Axis convention with positive values east, and the texture is mapped with 0° longitude at its center.

### Twelve data fields

Each selected location displays these **exactly twelve fields**, with provenance and caveats for every value:

1. Latitude
2. Longitude
3. Temperature
4. Surface pressure
5. Relative humidity
6. Wind speed
7. Surface solar energy
8. Surface gravity
9. Solar day length
10. NASA DEM elevation
11. Terrain / geology
12. Water / ice evidence

**Where data comes from:**

- **Earth:** NASA POWER gridded climatological averages for temperature `T2M`, pressure `PS`, humidity `RH2M`, wind speed `WS10M`, and all-sky shortwave surface solar energy `ALLSKY_SFC_SW_DWN`. Select annual or monthly averages. Those are **modeled grid averages**, not direct summit observations or real-time weather. Earth coordinates and qualitative terrain descriptions come from the project location catalogue and cited regional sources.
- **Mars:** Site-specific **NASA MOLA 16-ppd digital elevation grid** samples are computed from the bundled NASA terrain raster: Hecates Tholus **4,026 m**, Elysium Mons **13,202 m**, and Albor Tholus **3,650 m**, all relative to the MOLA areoid reference. These are bilinearly interpolated, coarse regional grid heights, **not precision landing-site altitudes**. NASA planet-wide mean temperature (~−59 °C), mean-radius pressure (~0.636 kPa), mean gravity (3.73 m/s²) and solar day (24.66 hours) are shown separately as **planet-wide references, not volcanic-site readings**. Local humidity, wind and surface solar energy remain unavailable.
- **Moon:** NASA LRO/LOLA `ldem_4.tif` provides a **4-ppd global gridded elevation**, sampled at the three selected locations at runtime or cached by `npm run fetch:nasa`. Values are in metres relative to the **1737.4-km lunar reference sphere**. Due to the coarse resolution, Shackleton and other feature-point elevations are general raster samples, not local slopes or surveyed landing altitudes. NASA Moon fact sheet provides reference gravity (1.62 m/s²), solar day (~29.53 Earth days) and an exosphere description. There is **no site-specific temperature series**. Conventional wind/humidity do not apply. No artificial ice abundance is displayed.

Surface solar energy on the Earth card is NASA POWER climatology; it is not reused as a Mars/Moon local value. Qualitative water/ice notes are not estimates of resource quantity or rover access. NASA MOLA/LOLA elevation results are grid interpolations/samples, not direct in-situ measurements.

## Pages

| Page | Purpose |
| --- | --- |
| Compare | Three map cards, independent location selectors, a quick 3-world data preview |
| Full-screen maps | Earth / Mars / Moon / all-three views, camera controls and full-screen mode |
| Environmental data | Twelve comparable fields with 3 independent location selectors, filter by world, monthly Earth POWER option and source links |
| Scientific analysis | Existing measured terrain comparison of 3 Edziza areas versus one Mars reference patch; **not** lunar scoring |
| Mission story | Guided mission rationale, limitations and NASA links |

## Map data and scientific limitations

**Earth:** MapLibre + Mapterhorn DEM + Esri/OpenStreetMap visual tiles. Map zoom and pitch are constrained because the grid cannot safely represent rover-scale terrain. Study-area outlines depend on `public/analysis-results.json`.

**Mars:** React Three Fiber + Three.js mesh, NASA Viking Orbiter MDIM mosaic image tiles in `public/mars-tiles`, and MOLA 16-pixels/degree elevation in `public/mars-wide-elevation.json`. The mesh covers 139–165° E, 17–43° N. **Vertical relief is exaggerated**. Those pixels are too coarse for boulder-level/landing-hazard decisions.

**Moon:** Three.js sphere uses the 2025 NASA SVS LRO WAC color map (`lroc_color_2k.jpg`) on a smooth sphere. It is an **aesthetic color map, not an elevation mesh**. The 2D atlas uses the same image, and both views support scroll-wheel/pinch and `+` / `−` zoom. The source NASA LOLA `ldem_4.tif` is used separately to derive actual coarse DEM elevations for three Moon sites. Browser access may require the dev proxy or local `npm run fetch:nasa` cache. **If the TIFF cannot load, the site elevation is marked unavailable; no placeholder value is used.**

**Measured terrain analysis:** The original `scripts/analyze-sites.mjs` samples a matched **12 km × 12 km** area on a **21 × 21** 600 m grid for each of the 3 Earth candidates and one Hecates Tholus reference. Earth uses Copernicus DEM, Mars uses a finer 128-ppd MOLA product. The score weights are project-defined (45% slope, 35% roughness, 20% elevation variation) and **are not NASA criteria**. See [original scientific methodology](docs/earth-mars-methodology-original.md) for full derivation.

## Source references

- [NASA POWER data API](https://power.larc.nasa.gov/docs/services/api/temporal/climatology/) — Earth modeled climate
- [NASA Mars Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html) — planet-wide Mars physical references
- [NASA Moon Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html) — planet-wide lunar physical references
- [NASA Earth Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html) — Earth constants
- [NASA SVS CGI Moon Kit](https://svs.gsfc.nasa.gov/4720/) — LRO WAC texture and LRO/LOLA 4-pixel/degree heightmap, with unit/reference documentation
- [NASA Apollo landing site coordinates](https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_sites.html) — Apollo 11 location
- [NASA SVS Shackleton south pole](https://svs.gsfc.nasa.gov/4969/) — lunar south-pole context
- [NASA PDS MOLA data](https://pds-geosciences.wustl.edu/missions/mgs/megdr.html) — Mars MOLA elevation (16ppd grid prebundled and per-site interpolation)
- [NASA HiRISE Hecates Tholus](https://hirise.lpl.arizona.edu/PSP_010678_2135) — Martian geological context
- [BC Parks: Mount Edziza](https://bcparks.ca/mount-edziza-park/) — Earth volcanic region

For exact source paths, map projection and sampling methodology, see [NASA dataset methodology](docs/nasa-data-methodology.md).

**Status:** Demonstration software for the NASA Space Apps Challenge; it is not an official NASA product, certified landing-site assessment, or claim that Mars/Moon sites have current local environmental readings.
