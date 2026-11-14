# CyberLeek | Planetary Analog Finder v7

A NASA Space Apps Challenge **independent demonstration**: click anywhere on the 3D Moon or whole-planet Mars globe, choose what you want to test, and get a ranked shortlist of Earth field sites. CyberLeek reports numerical **research-task fit** separately from **evidence confidence**, alongside NASA reference measurements and their limitations.

## Start on Windows, macOS or Linux

Extract the archive and open a terminal inside `cyberleek-planetary-analog-v7`:

```bash
npm install
npm run verify
npm run dev
```

Open the local URL printed by Vite (usually http://localhost:5173/). **The archive excludes `node_modules`**. This avoids platform-specific Windows/Linux native-binary errors; always run `npm install` in the extracted folder.

## Obtain NASA map assets (internet required)

The repository includes local *regional* NASA Mars tiles and Mars MOLA data, but not the much larger global NASA source files. To preload NASA imagery and elevations for a live demonstration, run these commands once:

```bash
npm run fetch:global       # NASA Viking global Mars imagery + global MOLA DEM
npm run fetch:nasa         # NASA LRO 2K Moon texture and LOLA coarse DEM
npm run fetch:moon-hd      # NASA 2025 LRO color 4K JPG (~59 MB TIFF input)
npm run dev
```

**For more Moon detail**, choose **4K balanced** in the Moon 3D viewer. For a machine with substantial GPU memory, you can optionally run `npm run fetch:moon-ultra` (downloads a ~232 MB 8K NASA TIFF, converts to local JPG), then select **8K opt-in**. The downloaded image is approximately 8192×4096 pixels; uncompressed on the GPU, it can use >128 MB of texture memory. **2K faster** is best for weaker laptops. The texture-quality control reports the resolution it *actually loaded* and warns if the selected file is not available. 4K or 8K pixels increase visible imagery detail, not the scientific resolution of the separate LOLA elevation grid. The NASA downloader uses Windows-native file paths with `fileURLToPath`, fixing the previous Sharp invalid-path error.

For zooming into lunar locations, choose **2D NASA HD tiles**: this requests detailed LROC WAC tiles from NASA Moon Trek at each zoom level; it requires internet service. The earlier uploaded round reference illustration is retained only as **low-res reference**; zooming it cannot reveal new detail.

Official imagery documentation: [NASA SVS CGI Moon Kit](https://svs.gsfc.nasa.gov/4720/) (NASA's 2025 LRO color mosaic). NASA notes its display color is a visualization product, not a substitute for scientific spectral analyses. Moon elevation comes from LOLA 4 pixels/degree (global ~7.6 km north-south cell spacing), not a rover-scale terrain model.

## New workflow

1. Choose **Mars** or **Moon** on the Finder, drag to rotate, click any point to choose the coordinates, or select a researched reference site. Mars now displays the **entire planet** in 3D. Three reference sites per body have source-linked eight-domain descriptions.
2. Select a **mission objective** (Balanced, Polar base, Volcanic science, Rover mobility, Astrobiology, Cave exploration) or adjust individual domain weights.
3. CyberLeek **ranks eight Earth analog candidates**: Atacama Yungay; Haughton Impact Crater; McMurdo Dry Valleys; Fagradalsfjall volcanic field; Lava Beds National Monument; Death Valley; Kīlauea; Craters of the Moon. It does not use any of the former local volcanic study locations.
4. Open any category to inspect the **numeric scoring inputs**, dataset source links, relevant NASA global facts, the exact formula, and what published mission researchers evaluated (without pretending they published a score for the same Earth/planet pair).
5. Export a **field-test screening brief**. It records which observations are global averages, coarse DEM cell samples, live Earth POWER climatology, researcher-curated tags, or unavailable.

## Why the score looks different now

Older releases used a distance-based multiplier that could turn a 40/100 research-fit score into 4/100 whenever the target click was more than 500 km from a curated reference. The multiplier affected **all** Earth candidates equally and did not help distinguish them. **This is removed from the score.** Uncharacterized clicks now show an independent **LOW documentation-confidence** warning.

Each of eight categories reports:

- Target goals, Earth traits, shared feature tags, target-goal **coverage** (`R`), Earth-trait **precision** (`P`), transferability assumption `T`, and the resulting domain task-fit score.
- `Domain fit / 100 = 100 × (0.70 × R + 0.30 × P) × T`; overall weighted domain mean is mixed with a modest, **explicitly heuristic** absolute-latitude operational-regime score. Click position and mission weights can alter the Earth ranking. Latitude is **not** measured climate, resource abundance, local illumination or subsurface geology.
- Research-documentation confidence `E` is shown **separately**. It is neither a formal probability nor a multiplier reducing an Earth candidate's matching score to 2/100.
- **NASA measurements are separate** from the screening index: MOLA/LOLA sampled elevation where available, global Mars/Moon gravity/solar/day/pressure references from NASA fact sheets, and **NASA POWER** modeled annual Earth temperature, wind and solar irradiation if its API is reachable. The engine **does not yet compare matched-resolution physical rasters or numerical mineral assays**. Missing values are labeled, never invented.

**A 75/100 score is a project research-task suitability index, NOT 75% physical similarity, a landing safety estimate, NASA approval, or a validated probability.** The candidates are manually curated, not discovered through global automatic search. Clicking an arbitrary surface point uses the nearest documented planetary scientific profile, and the interface discloses its distance and uncertainty. Source links are not proof of measured local abundance, caves or life.

See [scoring and scientific numbers](docs/v7-scoring-numeric-evidence.md), [data availability and uncertainties](docs/analog-data-and-uncertainty.md), and [NASA research / competitor context](docs/nasa-user-research-and-existing-solutions.md).

## Speed and technical notes

- Only one active 3D canvas is normally mounted; additional maps can be opened on demand.
- Globe rendering is on demand, capped pixel ratio 1.35 and moderate mesh tessellation; dedicated **2K faster / 4K balanced / 8K opt-in** avoids forcing 8K textures on all devices.
- Mars global map stream concurrency is bounded; the Elysium regional high-detail map loads only when requested.
- NASA Moon Trek 2D map loads tiles based on zoom, instead of enlarging one 2K global JPG. Remote tile availability and network speed matter.
- These are code-level optimizations, **not measured frame-rate benchmarks**. A browser/production build was not completed in the packaging environment owing to platform-specific dependency binaries. A fresh `npm install` on your computer should install the proper native dependencies.

## Developer validation

```bash
npm run verify      # Catalogue, 8-category ranking, clicked points, NASA-data parser assertions
npm run export:catalog
npm run build       # Verify production bundling on your system
```

The generated `public/analog-research-catalog.json` publishes all curated targets, Earth candidates, calculated default scores, feature tags and references for transparency. It does **not** assert it is a planetary science calibration dataset.
