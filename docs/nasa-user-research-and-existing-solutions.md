# User research, competitors, value and roadmap (NASA Space Apps 2026)

## Exact problem statement

> Help planetary mission teams identify a **purpose-appropriate Earth field test site** given a candidate Moon-base, future Mars exploration, or landing research location, using open agency data and an interpretable report of what matches, what fails, how confident we are and which field study should follow.

The official challenge welcomes a scientific analog ranking or interactive app and explicitly warns that Earth's similarities vary by characteristic. It asks for potentially new or undercharacterized places, not exclusively already famous benchmarks.

- Challenge: https://www.spaceappschallenge.org/2026/challenges/permanent-moon-base-locations-and-mars/

## Who would need the app? Evidence-supported use cases

**Planetary scientist or analog field campaign PI:** Chooses a target geological process (volcanism, impacts, water/ice, subsurface) and obtains a shortlist of Earth sites with published rationale and data gaps. NASA notes that analog sites help teams evaluate instruments, scientific concepts and procedures.

**Instrumentation/rover/test engineer:** Finds rugged or dusty natural environments to test mobility, sample collection, contamination avoidance, robotic navigation or navigation software. NASA JPL field tests in Death Valley and the Mojave used dunes and rough terrain to improve Mars drone navigation software.

**Artemis geology or human exploration operations trainer:** Identifies Earth geology, illumination, sampling and route-planning analogs. NASA Artemis crew geology training includes field methods and geological science operations, and NASA's Moon Trek supports surface planning with terrain and lighting analysis.

**Science educator and student team:** Can understand why Earth is only a partial analog and inspect direct sources rather than treating similar satellite images as proof of identical environments.

Sources:

- https://www.nasa.gov/analog-missions/
- https://www.nasa.gov/core-capability-6-analog-research-instrument-development/
- https://www.jpl.nasa.gov/news/nasa-tests-drones-in-death-valley-preps-for-martian-sands-and-skies/
- https://trek.nasa.gov/moon/jpl/config/textAbout.html
- https://science.nasa.gov/solar-system/analog-explorer/

**Important:** These are reasonable user scenarios inferred from public NASA research, not interviews with NASA employees or evidence of NASA's intent to deploy this application.

## Existing solutions

| Tool | Existing strengths | Gap / how CyberLeek is positioned | Caution |
|---|---|---|---|
| [NASA Moon Trek](https://trek.nasa.gov/moon/) | NASA lunar image/DEM collections; lighting, slope, distance, 3D, scientific layers | Earth analog shortlists for a Moon research-site test goal | NASA Moon Trek is far more capable than CyberLeek at lunar mapping and hazard-relevant data |
| [NASA Mars Trek](https://trek.nasa.gov/mars/) | Martian orbital layers, terrain, route investigation, 3D | Cross-world mapping of specific research objectives into Earth terrain types | CyberLeek does not replace Mars Trek or perform flight-quality Martian analysis |
| [NASA Planetary Analog Explorer](https://science.nasa.gov/solar-system/analog-explorer/) | Curated, illustrated NASA Earth/planet analog pairs with science explanations | Interactive target-dependent 8-site ranking and adjustable eight-domain weights | NASA source descriptions are richer than some of our curated site entries |
| [NASA JSC Rock Yard](https://www.nasa.gov/reference/jsc-analogs-mockups/) | Controlled physical hardware test yard for Martian/lunar rover mobility | Natural field landscapes, geological studies and expedition context | Natural sites may not permit hardware testing |
| [TerraNova, independent 2026 Space Apps team repo](https://github.com/KraKEn-bit/TerraNova) | Reports a global 0.5° Earth predictor cube, climate/slope/roughness, validation design and target matching | CyberLeek currently emphasizes eight complete evidence domains, local reference map presentation and a simpler fully interpretable field-task taxonomy | TerraNova reports broader global numeric screening and should not be claimed scientifically weaker without benchmarking |

## How the current prototype is different

- **The entry point is the destination.** The user selects a Mars or Moon research site, not a familiar Earth analog.
- **All eight scientific topics are visibly considered.** Unknown biology and unverified caves become valid cautions/test objectives, never fabricated 'life abundance' or underground depths.
- **Mission-dependent results.** The eight slider weights change the ranking in a reproducible way; every score shows matched and unmatched traits.
- **Audit trail.** Each Earth and planetary profile component links to contextual evidence; NASA MOLA site elevations and optional LOLA elevation and Earth POWER climatology are separate from the heuristic ranking.
- **Acknowledge tradeoffs.** Physical mismatches, protected area access, resolution mismatch and missing direct thermal/geological field assays are visible.

This is differentiation of **workflow and transparency**, not a proven accuracy advantage over NASA tools or other teams. A credible comparison needs a shared test set and out-of-sample evaluation.

## Concrete user story

*As a researcher planning lunar south pole ice prospecting, I want to select a Shackleton rim region, prioritize cold terrain, drilling and operational difficulty, get a shortlist of Earth sites and see why an Arctic impact site or Antarctic polar desert could be useful, so I can design a field-test proposal and identify which lunar questions will still require cryogenic vacuum-chamber experiments.*

Example prototype default: **Shackleton → Haughton Crater**; runner-up is **McMurdo Dry Valleys**. These are **project-defined heuristic rankings**, not NASA-endorsed preferred training grounds.

## Make it worthy of a real science workflow

1. Add globally gridded Earth numerical predictors (NASA POWER, MODIS LST/NDVI, DEM slopes, permafrost) with consistent resolution and data masks.
2. Extract target-site planetary rasters (Moon LOLA/Diviner, Mars MOLA/THEMIS) over properly selected polygons and seasonal intervals.
3. Add categorical mineralogy from agency geology maps, surface-process observations and candidate caves with quality flags.
4. Introduce **coverage** and **confidence** alongside similarity. Absent/uncertain observations must never count as strong matches.
5. Run blinded known-analog and negative-control studies and terrain sample validation; publish method and reproducible downloads.
6. Explicitly compute 'novelty' relative to a catalogue of already studied Earth analogs without saying any location is truly unknown.
7. Supply exportable experiment briefs: objectives, instrument tests, coordinates, map layers, missing measurements, study constraints and potential human operational hazards.

## Reporting language for a science fair or Space Apps demo

Correct: 'Our prototype ranks eight documented Earth field settings for six planetary research targets using an interpretable, eight-domain expert-curated experiment suitability index with agency references.'

Incorrect: 'NASA satellite data measured all eight physical parameters at every site and our 95% score proves that this Earth location is 95% the same as the Moon.'
