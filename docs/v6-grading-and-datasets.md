# V6 scientific audit: datasets, scoring method, external benchmark

> **Read before interpreting a result.** `EDZIZA` is a **qualitative Earth field-test screening tool**, not an official NASA mission planner or validation of physical analog equivalence. Only 3 Mars research profiles, 3 Moon profiles, and 11 Earth field sites have the project's eight-domain research annotations. An arbitrary globe click selects the nearest documented reference profile, with distance-based penalties: it does not reveal new mineral spectra, soil strength or ice abundance at that exact point.

## Planetary 3D map datasets (visualization, not a grade input)

| Planet | Product / actual use | Source | Resolution / limitation |
|---|---|---|---|
| Mars | NASA Viking MDIM21 globe color; online WMTS tiles, optional 32-tile z=2 cache | https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=mars | NASA global mosaic, sampled at 2048×1024 on globe for performance; NOT rover-scale |
| Mars | NASA MGS **MOLA MEGDR** global signed 16-bit PDS IMG, 1440×720, decoded and sampled for heights, 3D globe vertex displacement | https://pds-geosciences.wustl.edu/missions/mgs/megdr.html | Four pixels/degree; no reliable small hazards; planetary datum varies from Earth |
| Moon | NASA LROC color mosaic, 2025 4k or 2k file as globe texture | https://svs.gsfc.nasa.gov/4720/ | Global low-/medium-resolution texture; full resolution optional |
| Moon | NASA LRO **LOLA** 4 ppd GeoTIFF; 3D globe vertex relief, elevation readout | https://svs.gsfc.nasa.gov/4720/ | 4 ppd is COARSE; default visible exaggeration 1.5× |
| Moon | NASA Moon Trek LROC WAC v2 WMTS, viewed as zoom-dependent raster tiles in 2D | https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=moon | Only visible tiles are requested; remote service required for HD view |

## Scoring: exact inputs and interpretation

For each of eight scientific domains `d`, each Mars/Moon *reference profile* defines hand-curated, evidence-linked target research goals `G_d`, while each Earth analog has curated demonstrated/testable features `A_d` and a field-site source URL. We use words/traits rather than pretending to have measured the same quantities on three planets.

- `matched = |G_d ∩ A_d|`
- `recall R = matched/|G_d|`
- `precision P = matched/|A_d|`
- `F1 = 2PR/(P+R)` (0 if P+R=0)
- `E = 0.57, 0.67 or 0.75` for editorial source-documentation specificity; maximum `0.64` for biological or subsurface categories
- `T = 0.38..0.90` world/domain-specific physical-analogy transfer penalty from `src/scoringReferences.js`
- `domain score = round(100×F1×E×T, 1)`
- Overall `base score = sum(weight_d × domain score_d) / sum(enabled weights)`.
- Arbitrary map click yields `final score = base score × proximity factor`: 1 near selected documented target center, 0.8 within 100 km, 0.4 within 500 km, 0.1 beyond 500 km.

The factors are EDZIZA design judgments, explicitly separated from quantitative measurements, and have not been fitted to a ground-truth analog-site dataset. Even perfect keyword matches cannot yield 100/100. No score is a statistical probability, NASA landing-safety metric or a site-specific subsurface detection. Users can change the eight domain priorities 0–5.

## Eight domains: exact score sources versus other teams' published methods

| Domain | **Inputs actually used for EDZIZA scores** | NASA / others: WHAT they evaluated / HOW they graded (and where to check) | Important limitation |
|---|---|---|---|
| Geology, mineralogy, materials | Hand-selected basalt/impact/pyroclastic, etc. mission/field tags from per-site linked NASA/USGS/field reports. Numeric spectroscopy **not** integrated | NASA Mars 2020 used expert low/medium/high assessments of five mission science criteria, derived from site proposals and site geology (https://www.caltech.edu/about/news/where-land-mars-2020-conversation-ken-farley-47785) | A basalt tag is not measured chemical/mineralogical equivalence |
| Terrain, elevation, slope, roughness | Landform/hazard tags from per-site sources. NASA MOLA/LOLA numeric DEM are **displayed but NOT used** in these domain scores | MSL mission engineers set hard slope/hazard thresholds at specified baselines; safety pass/fail differs from analog fit (https://pubs.usgs.gov/publication/70047380) | No equal-footprint Earth/Mars/Moon slope and roughness ranking |
| Temperature, illumination, extremes | Interpretive aridity/polar/temperature stress test tags. NASA POWER Earth grid values **displayed but NOT scored**. Mars THEMIS/TES and Moon Diviner not ingested into matched profiles | Mars rover engineering thermal latitude constraints, not Earth climate similarity (https://pubs.usgs.gov/publication/70047380) | Missing comparable same-season/day-night time series |
| Water, ice and resources | Qualitative ice, permafrost, volcanic and polar resource research goals and field-site records | Mars 2020 selected science targets for past habitability/material context; not an extractable ice analog percent (https://www.caltech.edu/about/news/where-land-mars-2020-conversation-ken-farley-47785) | Nearby ice evidence not proof of accessible local ore/ice |
| Dust, wind and erosion | Recorded and interpreted aeolian/dust, abrasion, surface process tags | MER engineers assessed dust, rock abundance, slope, wheel trafficability as separate safety considerations (https://www.usgs.gov/publications/selection-mars-exploration-rover-landing-sites) | Moon has no conventional atmospheric wind |
| Biology, habitability, biosignatures | Scientific testing tasks: microbe detection, instrument sterilization and field biosignature study descriptions. **No detection of extraterrestrial life assumed** | Mars 2020 sought geological contexts able to preserve biosignatures; ranked by science objectives in expert low/medium/high votes (https://www.caltech.edu/about/news/where-land-mars-2020-conversation-ken-farley-47785) | Unmeasured microbial quantities, no confirmed Mars/Moon biology |
| Caves, lava tubes, subsurface | Project evidence tags for cave/void/ice-regolith field-test possibilities | NASA THEMIS imagery has revealed *candidate* Mars skylights; morphology needs confirmation (https://science.nasa.gov/resource/seven-possible-cave-skylights-on-mars/) | No validated accessible cave at arbitrary planet pixels |
| Engineering, operations, mobility | Task tags such as wheel mobility, drill testing, navigation and thermal operations from field-site descriptions | JPL Mars 2020 traversability work calculates hazard-aware distances/sols using rover model and terrain data (https://robotics.jpl.nasa.gov/media/documents/Data-driven%20surface%20traversability%20analysis%20for%20Mars%202020%20landing%20site%20selection.pdf) | No real rover route simulation, trafficability test, safety certification |

Every full result includes the **planetary and Earth site-specific URLs** for each category, as well as the above method references and intermediate formula values. There is no published third-party `0–100` for our precise set of 11 Earth × 6 planetary research pairs. Claiming otherwise would be fabricated. Research teams did something else (expert mission science ratings, operational constraints, hazard modeling), and the app makes this distinction clear. The reference methods are **comparisons, not input data**.

## Quality and next steps

To move from a documented **prototype** to a scientifically validated ranking engine, derive **same-footprint** slope and roughness grids from DEMs for all three bodies, compute physical meteorological/thermal ranges in consistent units and periods, add lithology/spectroscopy validation, include polar illumination layers and uncertainty intervals; have subject-matter experts review representative Earth analogs and pairwise rankings. Do not fill planetary biology/cave/ice values with fabricated observations. Remote asset downloads and actual browser FPS must be checked in the user's environment.
