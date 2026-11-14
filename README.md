# Project EDZIZA - Earth/Mars Analog Explorer

**Explore two worlds. Find Earth-based testing grounds for future Mars exploration.**

Project EDZIZA is an interactive React website created for the **NASA International Space Apps Challenge**. It investigates whether selected areas of **Mount Edziza, British Columbia, Canada**, could serve as useful terrestrial analogs for exploring volcanic landscapes near **Hecates Tholus, Mars**.

Rather than claiming that Mount Edziza is "the same as Mars," the project asks a testable question:

> Which part of the Mount Edziza volcanic complex best matches a chosen Martian terrain for a particular robotic field test, and which conditions cannot be reproduced on Earth?

The app combines 3D terrain visualization, real satellite imagery, NASA climate data, transparent terrain measurements, and a mission narrative. **This is a prototype and a preliminary remote-sensing analysis, not an official NASA tool or a validated landing-site assessment.**

## 1. Challenge and mission

**NASA Space Apps challenge:** Identify Earth locations that are analogous to environments relevant to future Moon or Mars bases, landing sites, and exploration. Use open planetary and Earth data to characterize the locations and communicate the findings through an interactive tool, visualization, or map.

**Our focus:** Mars volcanic exploration and Earth analog field-testing opportunities.

- **Earth region:** Mount Edziza Volcanic Complex, northern British Columbia.
- **Primary Mars region:** Hecates Tholus, in the Elysium volcanic region.
- **Mars reference patch for analysis:** A selected part of the lower northwestern flank of Hecates Tholus, approximately **32.40 N, 148.90 E**.
- **Scientific connection:** Both regions contain volcanic landforms; published work discusses interactions between volcanism and ice or water in the respective regions. A geological analogy must be supported by evidence, not appearance alone.
- **Main mission scenario:** Screen potential Earth locations for testing robotic exploration methods on volcanic terrain.

## 2. What the website does

The navigation includes these five sections:

| Page | Function |
| --- | --- |
| **01 Compare** | Display Mount Edziza and Hecates Tholus side by side. |
| **02 Full-screen maps** | Explore larger 3D Earth/Mars viewers, choose Earth/Mars/split view, and enter browser full screen. |
| **03 Environmental data** | Compare NASA POWER gridded Earth climate estimates with clearly labeled Mars-wide reference facts. |
| **04 Scientific analysis** | Calculate and display terrain metrics, a transparent 0-100 matching score, and a ranking of three Edziza candidate areas. Results appear after the analysis script is run. |
| **05 Mission story** | Introduce the mission question and explain the search for a defensible Earth analog. This is currently a guided narrative page; a fully branching interactive story is planned. |

### Interactive Earth map

- **MapLibre GL JS** renders Mount Edziza using real Mapterhorn elevation tiles.
- Choose **Snowshoe Lava Field**, the **Mount Edziza summit area**, or **Desolation Lava Field**.
- Switch between satellite imagery and OpenStreetMap basemaps.
- Zoom, rotate, tilt, reset the camera, and control terrain-height exaggeration.
- Close-up zoom and tilt are limited to reduce blurry or distorted views.
- Once analysis results exist, study-area footprints are outlined on the Earth map.

### Interactive Mars satellite viewer

- **React Three Fiber / Three.js** renders a wider 3D section of the Elysium volcanic region.
- Real **NASA Viking Orbiter MDIM 2.1 color mosaic** imagery is draped over **NASA/MGS MOLA** regional topography.
- The region spans approximately **139-165 E** and **17-43 N** (roughly 1,300 by 1,540 km).
- Preset camera buttons include **Whole region**, **Hecates Tholus**, **Elysium Mons**, and **Albor Tholus**.
- Drag to orbit, scroll to zoom, and right-drag to pan.
- The relief is intentionally exaggerated for visual interpretation; it is **not** a real-scale surface reconstruction.
- If regional files are missing, the viewer uses a clearly labeled flat preview rather than passing invented terrain off as NASA data.

**Important:** The visual Mars map uses a **16-pixels-per-degree MOLA grid** (approximately 3-4 km cells near Hecates Tholus). It cannot show individual rocks, rover-sized obstacles, or safe landing footprints. The scientific-analysis script uses a *different*, finer **128-pixels-per-degree MOLA product**.

### Environmental comparison

The Environmental Data page requests **NASA POWER gridded climatology** for the selected Earth coordinates:

- 2 m air temperature (`T2M`, deg C)
- 2 m relative humidity (`RH2M`, percent)
- Surface pressure (`PS`, kPa)
- 10 m wind speed (`WS10M`, m/s)

Users can select the annual climatological average or a month. These values are **modeled regional estimates**, not live weather, Mount Edziza summit observations, or ground measurements at a particular lava flow.

The Mars column displays **planet-wide reference conditions** and states when no verified Hecates Tholus-specific measurement is available. Do not describe a Mars-wide temperature, pressure, or humidity reference as current local weather.

## 3. Scientific terrain analysis

The analysis tests three proposed Earth study areas against one Hecates Tholus reference area:

| Study area | Approximate center | Reason to investigate |
| --- | --- | --- |
| **Snowshoe Lava Field** | 57.6500 N, 130.6667 W | Basaltic lava and documented lava/ice interactions in the Edziza region. |
| **Mount Edziza summit area** | 57.7200 N, 130.6300 W | Glaciated volcanic relief with varied terrain. |
| **Desolation Lava Field** | 57.8167 N, 130.6167 W | Northern lava field and volcanic cones. |
| **Mars reference: Hecates Tholus lower NW flank** | 32.4000 N, 148.9000 E | Selected volcanic study patch; not a verified rover landing site. |

These are **proposed research patches**, not confirmed safe or accessible field sites. The Snowshoe and summit study patches partly overlap.

### Data and calculations

The Node.js scripts use:

- **Earth:** Copernicus GLO-30 DEM/DSM GeoTIFF, with GLO-90 fallback if needed.
- **Mars:** NASA PDS MOLA **128 pixels/degree** elevation image.
- **Common analysis footprint:** **12 km x 12 km** for each location.
- **Sampling grid:** **21 x 21 points**, spaced **600 m** apart.

The terrain analysis computes:

1. **Mean slope** and **90th-percentile slope**, in degrees, from elevation gradients.
2. **Terrain roughness**, defined as the RMS deviation from a centered 3 x 3 local mean, in metres.
3. **Elevation variation**, defined as the 95th minus 5th percentile elevation, in metres.

For comparability, all locations are sampled over the same physical footprint and grid spacing. The underlying datasets do not have identical native resolution or measurement density; resampling does not magically make them equivalent.

### How the Mars Analog Match Score works

The app uses a project-defined terrain score between **0 and 100**:

```text
Total terrain match = 0.45 * S + 0.35 * R + 0.20 * E

S = slope similarity (60% mean slope + 40% 90th-percentile slope)
R = terrain-roughness similarity
E = elevation-variation similarity
```

Each similarity component compares the Earth and Mars metric, with a score of 100 for identical values and decreasing scores for increasing differences. The script uses the following **project-selected tolerances**:

| Comparison | Difference producing a zero component similarity |
| --- | --- |
| Mean slope | 6 degrees |
| 90th-percentile slope | 10 degrees |
| RMS roughness | 80 m |
| Elevation variation | 600 m |

These weights and tolerances are **not NASA standards**. The highest score means only **the closest terrain match among the three tested candidates, under these assumptions**. It does not prove similar rock chemistry, ice history, environmental conditions, rover safety, or general Mars-analog suitability. Geological evidence is reviewed separately.

The analysis writes measured results to `public/analysis-results.json`, which powers the analysis page and Earth-map study outlines. No winner or score should be hardcoded before that file has been generated successfully.

## 4. Technology stack

| Technology | Use |
| --- | --- |
| **React 19 + Vite 7** | Frontend, layout, state, local development and build. |
| **MapLibre GL JS** | Interactive Earth map and 3D raster elevation. |
| **Three.js + React Three Fiber + Drei** | Interactive Mars 3D mesh, satellite texture, and camera controls. |
| **GeoTIFF.js (`geotiff`)** | Read Earth elevation raster data for scientific analysis. |
| **Node.js scripts** | Download Mars map data, sample Earth/Mars DEMs, compute metrics, generate JSON. |
| **NASA POWER** | Earth climate averages. |
| **NASA PDS MOLA / Mars Trek** | Mars elevation and orbital imagery. |
| **Copernicus DEM / Mapterhorn** | Earth analysis elevation / interactive terrain display. |

## 5. Getting started

### Prerequisites

- **Node.js 22 or newer** (a current compatible Node version)
- npm
- VS Code or another editor
- Internet access to download terrain, imagery, and climate data

Use **one project root** named `edziza-mars`; do not nest another Vite project inside it.

### Install and start

Open a terminal in the project root:

```bash
npm install
npm install geotiff@^2
npm run dev
```

Then open the local URL printed by Vite, usually **http://localhost:5173/**.

> If `geotiff` is already installed, the second command is unnecessary. The Earth map can load before the analysis results are generated, but the scientific page will not have measured comparisons yet.

### Download the wider NASA Mars imagery and terrain

From the project root:

```bash
node scripts/fetch-mars-wide.mjs
```

This script downloads approximately **33 MB** of regional MOLA source data and roughly **100 NASA Mars Trek JPEG tiles** (availability may vary), then produces these assets under `public/`:

```text
public/
  mars-wide-elevation.json
  mars-orbital-tiles.json
  mars-tiles/
```

Refresh the website and open **02 Full-screen maps > Mars** to use the new viewer. Later script runs reuse successfully cached files where possible. The download requires Internet access and may fail if NASA services or a local network are unavailable.

**Legacy note:** The original starter also included `npm run fetch:mars`, which writes `public/mars-elevation.json` for the *older, narrower* Mars view. The newer Viking + MOLA viewer uses `fetch-mars-wide.mjs` and its separate `mars-wide-elevation.json` file.

### Generate the scientific comparison

```bash
node scripts/test-metrics.mjs
node scripts/analyze-sites.mjs
```

After a successful run, check for:

```text
public/analysis-results.json
```

Open **04 Scientific analysis** and reload. The page should show the Mars reference metrics, all three measured Edziza candidate scores, the relative ranking, and source/method notes.

If the dataset servers cannot be accessed, download the Earth GeoTIFF and Mars IMG separately, then supply local paths:

```cmd
node scripts/analyze-sites.mjs --earth C:\data\edziza.tif --mars C:\data\hecates-mola.img
```

Earth example: [Copernicus GLO-30 N57 W131 GeoTIFF](https://copernicus-dem-30m.s3.amazonaws.com/Copernicus_DSM_COG_10_N57_00_W131_00_DEM/Copernicus_DSM_COG_10_N57_00_W131_00_DEM.tif).

Mars example: [NASA MOLA 128-ppd tile `megt44n090hb.img`](https://pds-geosciences.wustl.edu/mgs/urn-nasa-pds-mgs_mola_topography_derived/meg128/megt44n090hb.img).

### Production build

```bash
npm run build
npm run preview
```

For deployment, make sure `public/` contains the downloaded Mars assets and generated analysis results needed by the site, or provide a documented way to create them in your deployment pipeline. Follow each data provider's attribution and usage requirements.

## 6. Project structure

Depending on which earlier upgrade files you have copied, your working project should contain the following important files:

```text
edziza-mars/
|-- index.html
|-- package.json
|-- package-lock.json
|-- vite.config.js
|-- README.md                  <-- this document
|-- src/
|   |-- main.jsx
|   |-- App.jsx                # Page navigation and controls
|   |-- EarthMap.jsx           # MapLibre Earth terrain and site outlines
|   |-- MarsScene.jsx          # Viking imagery over MOLA 3D terrain
|   |-- mars-satellite.css     # Mars viewer styling
|   |-- ClimatePanel.jsx       # NASA POWER + Mars reference panel
|   |-- ScienceAnalysis.jsx    # Metrics, rank, source notes
|   `-- styles.css
|-- scripts/
|   |-- download-mola.mjs      # Legacy/narrower Mars data downloader
|   |-- fetch-mars-wide.mjs    # New wide Mars imagery and MOLA downloader
|   |-- analyze-sites.mjs      # Scientific comparison, outputs JSON
|   |-- terrain-metrics.mjs    # Pure metric and score functions
|   `-- test-metrics.mjs       # Metric unit checks
`-- public/
    |-- mars-wide-elevation.json      # Generated
    |-- mars-orbital-tiles.json       # Generated
    |-- mars-tiles/                  # Downloaded imagery
    `-- analysis-results.json        # Generated
```

`node_modules/` is installed locally and should normally be excluded from Git. Generated data files appear only after their scripts run successfully. The older `public/mars-elevation.json` may also exist if you ran the original downloader.

## 7. Current status and next steps

### Implemented in the project code

- [x] React application with Earth and Mars visualization.
- [x] Mount Edziza site selector and 3D Earth map.
- [x] Large-map page with Earth, Mars, and side-by-side modes.
- [x] Mars viewer upgrade code for Viking imagery + broad MOLA terrain and camera presets.
- [x] NASA POWER environmental-data integration and labeled Mars reference facts.
- [x] Scientific-analysis scripts, metrics, scoring, ranking UI, and map study-area outlines.
- [x] Initial mission-story page and scientific caveats.

**Data-dependent features only show real results after the corresponding scripts finish successfully.** The science and imagery downloaders should also be tested end-to-end on the machine used for the demo.

### Still planned / requires scientific validation

- [ ] Generate and review measured terrain results and check source quality.
- [ ] Verify the strongest candidate against published geology and, where available, higher-resolution local imagery.
- [ ] Build the fully interactive six-chapter mission story (Accept Mission, explore Mars, inspect Edziza, reveal evidence, choose a candidate, final mission report).
- [ ] Let a mission objective affect the recommendation only once its scoring method is scientifically supported.
- [ ] Add a local higher-resolution CTX/HiRISE image or DEM for meaningful close-ups of a selected Mars patch.
- [ ] Test mobile layouts, accessibility, map loading, fallback states, and a complete presentation flow.
- [ ] Deploy the site and publish a documented demo and reproducible data methods.

The goal for **Best Use of Storytelling** is to lead a visitor from a Martian exploration problem to a data-supported Earth testing recommendation, while being explicit about what the evidence does and does not establish.

## 8. Scientific limitations and integrity

1. **Regional visualization vs analysis:** The wide 3D Mars map uses **MOLA 16 ppd**; the standalone metrics use **MOLA 128 ppd**. Never extract rover-scale hazards or similarity scores from the coarse visualization.
2. **Terrain exaggeration:** 3D heights are exaggerated to help visitors see broad features. Display the factor and do not imply the displayed relief is to scale.
3. **Satellite imagery is historical:** Viking Orbiter mosaic imagery is real, but it is **not a live feed**, may combine acquisition dates, and is not as detailed as CTX or HiRISE.
4. **No rover-scale precision:** Even the 128-ppd MOLA data include gridding and interpolation; the source cannot confirm boulder size, traverse safety, or landing-site suitability.
5. **Earth elevation caveat:** Copernicus DEM is a surface model; vegetation, snow/ice, and processing artifacts may affect estimates. Common 600 m sampling does not remove native resolution differences.
6. **Scientific scope:** Slopes, roughness, and elevation variation do not establish rock composition, ancient ice processes, atmospheric similarity, gravity, radiation, or human accessibility.
7. **Climate caveat:** NASA POWER values are gridded Earth climatology, not current local measurements. Mars environmental values here are mostly global reference facts, not observations at Hecates Tholus.
8. **Location caveat:** Candidate study squares are preliminary research selections. Some overlap, and they are not certified field-test locations.
9. **Map geometry:** The wide Mars view renders a local rectangular/equirectangular terrain patch, not a geodetically exact 3D globe. Use geospatial methods, not on-screen ruler measurements, for distance analysis.
10. **Score caveat:** The 0-100 value is a **project-defined relative terrain screening score**; weights and tolerances are adjustable assumptions, not a NASA-approved metric.

## 9. Troubleshooting

### Vite runs, but the browser is blank

Open the browser Developer Tools **Console** and check the first red JavaScript error.

- **`React is not defined`:** Ensure `vite.config.js` enables `@vitejs/plugin-react` (or import `React` explicitly where needed).
- **`maplibre-gl does not provide an export named default`:** Use `import * as maplibregl from 'maplibre-gl';` in `EarthMap.jsx`. The working project also sets the MapLibre worker URL through the Vite worker import.
- **Missing Mars image/terrain:** Run `node scripts/fetch-mars-wide.mjs`, confirm the generated `public/` files exist, and refresh.
- **Missing scientific results:** Run `node scripts/analyze-sites.mjs` and check `public/analysis-results.json`.
- **`Cannot find package 'geotiff'`:** Run `npm install geotiff@^2`.
- **Favicon 404:** Harmless; it does not prevent the React application from rendering.

### Windows blocks the native Rollup module

Some Windows Application Control policies block `rollup.win32-x64-msvc.node`. If your machine has **this exact problem**, the working workaround used during development was this `package.json` override:

```json
"overrides": {
  "rollup": "npm:@rollup/wasm-node@^4"
}
```

After changing the override, reinstall dependencies so the lockfile is updated. Do **not** disable Windows security protections. If your device is centrally managed and continues to block tools, ask your administrator for an approved development setup.

## 10. Sources, data, and credit

### NASA, planetary science, and Earth science

- [NASA Mars Trek map](https://trek.nasa.gov/mars/)
- [Mars Trek tile/API documentation - Viking MDIM 2.1](https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=mars)
- [NASA Planetary Data System - MOLA MEGDR](https://pds-geosciences.wustl.edu/missions/mgs/megdr.html)
- [NASA Earth Observatory - Snowshoe Lava Field](https://science.nasa.gov/earth/earth-observatory/snowshoe-lava-field-152269/)
- [NASA POWER climatology API](https://power.larc.nasa.gov/docs/services/api/temporal/climatology/)
- [NASA Mars fact sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html)
- [NASA HiRISE volcanic/ice-related terrain](https://hirise.lpl.arizona.edu/PSP_010678_2135)
- [ESA - Hecates Tholus in 3D](https://www.esa.int/Science_Exploration/Space_Science/Mars_Express/Hecates_Tholus_volcano_in_3D)
- [USGS Planetary Gazetteer - Hecates Tholus](https://planetarynames.wr.usgs.gov/Feature/2407)
- [USGS Planetary Gazetteer - Elysium Mons](https://planetarynames.wr.usgs.gov/Feature/1783)
- [USGS Planetary Gazetteer - Albor Tholus](https://planetarynames.wr.usgs.gov/Feature/166)
- [Published Hecates NW-flank research record](https://portalcientifico.uah.es/documentos/5d1df63f29995204f7665df7)

### British Columbia, Earth elevation, and basemaps

- [BC Parks - Mount Edziza Park](https://bcparks.ca/mount-edziza-park/)
- [Smithsonian Global Volcanism Program - Mount Edziza](https://volcano.si.edu/volcano.cfm?vn=320060)
- [Copernicus DEM public dataset](https://registry.opendata.aws/copernicus-dem/)
- [Mapterhorn terrain tiles](https://tiles.mapterhorn.com/tilejson.json)
- [OpenStreetMap copyright and attribution](https://www.openstreetmap.org/copyright)
- Earth satellite basemap: Esri World Imagery and its underlying imagery providers (check licensing and retain map attribution when publishing).

**Suggested in-app Mars credit:**

> Mars imagery: NASA/JPL Viking Orbiter global mosaic via NASA Mars Trek. Elevation: NASA/MGS MOLA via the NASA Planetary Data System.

**Suggested in-app Earth credit:**

> Earth terrain: Mapterhorn / Copernicus DEM as indicated by the active layer or analysis. Map imagery: Esri and imagery contributors; map data: OpenStreetMap contributors.

## 11. Team collaboration

Suggested role split for a six-person team:

- **Lead developer:** Maintain the React app, maps, integration, and deployment.
- **Terrain analyst:** Validate DEM handling, metrics, scoring, and generated results.
- **Earth researcher:** Research Edziza candidate areas, geology, and Earth data.
- **Mars researcher:** Research Hecates Tholus, planetary datasets, and geological comparisons.
- **Storytelling developer:** Turn the science results into an interactive mission narrative.
- **Design/presentation lead:** Improve usability, quality assurance, final pitch, and demo.

Work in separate Git branches and agree on the structure of `public/analysis-results.json` before integrating analysis-based storytelling.

---

**Project principle:** A compelling Mars analogy must be *measured, sourced, and explained* - not just visually convincing.
