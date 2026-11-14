# EDZIZA — 3D Planetary Analog Finder v5 (NASA Space Apps research prototype)

**Click a point on a 3D Mars terrain map or the 3D Moon globe. See which Earth location could be a useful scientific analog.**

This release replaces the app's default three-world climate comparison with an **8-domain, purpose-weighted terrestrial analog screening workflow** built around the NASA Space Apps Challenge *Identify Earth Locations that Analog the Permanent Moon Base Locations and Mars*.

## Run

Requires Node.js 22+ and npm. Extract the archive, open its `edziza-planetary-3d-picker-v5` folder, then:

```bash
npm install
npm run dev
```

Open the local URL reported by Vite, typically `http://localhost:5173/`.

For a static build:

```bash
npm run build
npm run preview
```

The original uploaded dependencies were Windows-specific. Never copy the old `node_modules` folder to a new operating system; do a fresh `npm install` on your computer.

## User workflow

1. Select **Mars** or **Moon** on the first page. A **3D map appears immediately**.
2. **Click a point** on the map: the Mars view covers the Elysium volcanic region; the Moon globe accepts points globally. Rotate and zoom with the mouse or touch. Alternatively, choose one of three documented reference sites on each world.
3. The app extracts the clicked **coordinates**, a NASA **DEM grid elevation** when the relevant terrain data is loaded, and the **nearest documented planetary research profile** with a distance and confidence warning.
4. See **eleven Earth analog sites automatically ranked** by the eight-domain reference profile. Select a suggested Earth analog to fly to its **real field-site map coordinates**, inspect sources, and generate a research brief.
5. Optionally adjust each domain's importance (0–5). The ranking changes immediately; a point itself is not magically measured across all eight science domains.
6. Use **Interactive maps**, **Eight data domains**, **Measured terrain**, and **Research & method** to explore source limitations and research priorities.

### Important 3D-map setup

**Mars**: the regional NASA MOLA elevation raster and Viking orbital tiles are already included; no NASA network fetch is required for its 3D surface.

**Moon**: to obtain a textured Moon globe **with real LOLA elevation relief**, run this command **with internet access** before presenting or deploying the project:

```bash
npm run fetch:nasa
```

It downloads a NASA LRO color map (~0.45 MB) and NASA LOLA `ldem_4.tif` (~4 MB). If that step cannot complete, the Moon still shows a **3D spherical preview** for coordinate picking but NOT detailed measured surface relief. The user-provided Moon reference picture is available as a separate 2D view; it is not NASA DEM data. More detail: `docs/3d-map-picking-and-matching.md`.


## Eight domains (complete profile coverage)

1. Geology, mineralogy, and surface materials
2. Terrain, elevation, slope, roughness, impact features
3. Temperature, illumination, environmental extremes
4. Water, ice, permafrost, resources
5. Dust, wind, erosion, and surface processes
6. Biology, extremophiles, biosignatures
7. Caves, lava tubes, subsurface environment
8. Landing/rover operations, navigation and construction test conditions

**Every one of the 17 catalogued places (11 Earth + 3 Mars + 3 Moon) has an entry, a set of research-use tags and an evidence link for all eight domains.** This is **complete descriptive profile coverage**, not 136 equally valid physical observations. Several dimensions have no universally measurable site-level analog: lunar wind does not exist in the conventional atmospheric sense, Mars/Moon have no confirmed indigenous life, and no verified cave accessibility can be assigned to an unmapped subsurface void. Never convert these into fabricated numerical measurements.

## NASA/agency datasets used by this app

**Actually integrated:**

- **Mars: NASA Viking imagery + NASA MOLA elevation** in the bundled Mars viewer; derived 16ppd MOLA DEM samples for the 3 Mars sites in `public/nasa-data/mars-mola-sites.json`.
- **Moon: NASA LRO Wide Angle Camera orbital image + NASA LOLA elevation**, used to create real 3D globe relief if downloaded through `npm run fetch:nasa` or fetched at runtime. With no NASA raster, show a labeled smooth globe; no DEM relief is invented. The user-uploaded circular Moon reference picture is **not** NASA observational data.
- **Earth: NASA POWER** optional live climatological grid point data (air temperature, 10m wind, solar-energy average) for the currently selected Earth site. MapLibre terrain uses Mapterhorn and external raster imagery. Browser will show the offline state if NASA POWER cannot connect.
- **Measured Earth–Mars DEM prototype:** 3 Mount Edziza 12 km patches from Copernicus DEM vs a Hecates Tholus NASA MOLA patch (`public/analysis-results.json`). It is separate from the new eight-domain scores.
- **Evidence profiles:** science-context narratives and searchable tags based on agency publications and site sources linked within each domain. These are interpretations, not NASA-labeled numeric planetary records.

**Not yet integrated into the live numeric comparison:** global site-by-site NASA THEMIS/TES temperatures, LRO Diviner temperature series, geology pixel classes, SWIM/lunar cold-trap overlays, Mars or Moon cave catalogues, life-detection results, or per-site operational viability/permits. These are specified as potential future inputs with links under `docs/analog-data-and-uncertainty.md`.

## Screening formula and limits

For a planetary target, each domain defines 1–4 intended **Earth field-test traits** (not claims that a planetary site physically shares the Earth's atmosphere or biology). An Earth site receives evidence-guided tags describing field research opportunities.

```
domain_score = 100 * matched_target_test_tags / total_target_test_tags
ranking_score = sum(user_weight * domain_score) / sum(user_weight)
```

The default weights are: geology 4, terrain 4, thermal 2, resources 3, dust 2, biology 2, subsurface 2, operations 3. A priority set to zero excludes that domain. All-zero priorities yield a neutral score of zero and a warning. **High percentages mean coverage of this limited screening vocabulary, not physical fidelity, safety or NASA endorsement.** Rankings are not calibrated against field performance or validated with cross-site ground truth.

Defaults include **Shackleton → Haughton crater** for a polar-operations question and **Elysium Mons → Craters of the Moon** for a basalt/rover science question. Results may change with weights. The original Edziza Earth sites remain candidates, including possible lesser-studied research hypotheses.

## Data and location provenance

- Planetary target evidence: NASA Elysium and Albor, NASA Mare Tranquillitatis, NASA Shackleton, and NASA Aristarchus material, linked per site.
- Earth analog evidence: NASA analog mission field-site descriptions, NASA astrobiology field catalog, NASA 2025 Iceland field campaign, NPS Lava Beds and Craters of the Moon geology, NPS Death Valley geology, and BC Parks Mount Edziza, linked per site.
- Representative target coordinates and Earth map pins denote **study regions**, not homogeneous 30-m cells, validated landing ellipses, approved fieldwork sites or safe cave entrances.
- Scientific concept and implementation limits: `docs/analog-data-and-uncertainty.md`.
- NASA user needs, comparison to existing tools: `docs/nasa-user-research-and-existing-solutions.md`.
- Original numeric experiment documentation remains in `docs/earth-mars-methodology-original.md`.

## Validation

```bash
npm run verify
```

Checks: 3 worlds, 11 Earth map sites, 3 Mars and 3 Moon sites, 8/8 domain coverage for all 17 research profiles, valid source links, deterministic scoring and response to weight changes, exact original NASA MOLA grid interpolation, Moon zoom controls, and JSX parsing.

**Development-side verification:** source parsing, eight-domain audit, MOLA data checks, 3D map-click coordinate math, Moon DEM sampler, and map-to-Earth ranking tests passed. A production Vite build still could not be completed in this Linux environment because the originally supplied `node_modules` used Windows-native esbuild. The ZIP excludes `node_modules`; perform a clean `npm install` to build on your machine.

## Export the research catalogue

`npm run export:catalog` regenerates the machine-readable `public/analog-research-catalog.json` with the complete 8-domain candidate and planetary profiles, citations, default weights and the output of each of the six target ranking runs. You can audit the category inputs independently of the web interface.
