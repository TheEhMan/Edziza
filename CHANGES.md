# CyberLeek v7 — scoring, evidence, imagery and branding refresh

- Renamed the public-facing app and package to **CyberLeek**. Removed the three former local volcanic research areas from the Earth analog candidate catalogue and the obsolete measured-terrain tab. Eight geographically diverse Earth field-test candidates remain.
- Fixed the severe >500 km global score multiplier: it previously made every result approximately 10% of its original score, while keeping candidates in almost the same order. The distance is now an **independent confidence warning**, not a numerical score penalty.
- Implemented transparent numerical category calculations: `100 × (0.70 × target-goal recall + 0.30 × Earth-trait precision) × planetary research-transfer coefficient`. Domain research-fit is blended with an explicitly labeled, low-weight latitude-regime prior. Updated tests confirm rankings change for different mission objective presets, planetary targets and clicked-point latitudes. Neither component is a NASA-validated physical similarity model.
- Added six instantly selectable science/operations mission presets; weight changes recalculate and reselect the top Earth candidate instead of retaining a stale manual choice.
- Every domain card now shows numerical shared feature counts, recall %, precision %, transfer adjustment, Earth feature counts, weighted points, and NASA numerical context (where supported). Source links, full math, limitations and comparable **NASA assessment methods, not comparable third-party scores**, are accessible in an expandable audit.
- Added NASA global physical reference values separately: gravity, day/solar input, planetary mean pressure/temperature; online Earth NASA POWER climatic averages; MOLA/LOLA elevation data as the existing NASA downloads permit. Not used as local eight-domain scoring evidence yet.
- Moon 3D texture quality choices: 2K fast, 4K balanced, optional 8K. Real loaded resolution and missing-file warning are visible. The official 2025 NASA LRO 4K/8K TIFF sources are convertible using `fetch:moon-hd` and `fetch:moon-ultra`. **Fixed Windows Sharp `.toFile()` path conversion using `fileURLToPath`**.
- Preserved whole-Mars 3D mapping, Moon 1×–5× relief, 2D high-resolution NASA Moon Trek tiled viewer, regional Mars detail, click-to-pick 3D coordinates and source-distance warnings.
- Kept responsive-demand render, bounded map data requests and optional quality to limit performance impact. **No frame-rate benchmark performed**.
- Added v7 scientific methodology and data limitations docs, regenerated public JSON research catalogue and updated automated verification to 8 Earth + 6 planetary sites.

## Scientific integrity

Research-tag task fit is not the fraction of actual Martian or lunar materials matched in a laboratory. Global planetary fact sheet values are not local observations, grid elevations do not measure rover-scale hazards, and latitude alignment does not establish comparable weather, ice or geology. Missing measurements remain missing; future versions should ingest matched-resolution rasters and validated geology classes before claiming data-based global analog discovery.

See `docs/v7-scoring-numeric-evidence.md` for exact calculations and official source URLs.
