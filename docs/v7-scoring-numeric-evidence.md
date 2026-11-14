# CyberLeek v7 | Reproducible scoring and numerical evidence

## Read this before interpreting `/100`

CyberLeek is a **small, auditable experimental Earth-field-test shortlister**, not a validated physical similarity model. **There are eight manually annotated Earth candidates and three planetary science profiles per world** (Mars and Moon). The eight categories are populated with research goals and evidence references; there are **not eight independently sampled, co-registered numerical science datasets for every point**. Scored research-feature tags are an interpretation by this project team, not measured NASA mineral percentages, crater counts or ice concentrations.

The user can click any point, but the eight categories are taken from the *nearest* of the three curated planetary profiles for that world; CyberLeek shows the profile's name and distance. A distant arbitrary click has low documentation confidence. Its resulting fit score may still be high because the fit estimate is exploratory and should be treated with uncertainty. It is not valid to claim a new planet-wide classification from this behaviour.

## Scoring formula (exact JS in `src/analogRanking.js`)

For domain `d`, `G_d` is the set of target research **goal tags**, `F_d` the corresponding Earth candidate's relevant **feature tags**, and `M_d = G_d ∩ F_d` the matching tags.

- `R_d = |M_d| / max(|G_d|,1)` = share of planetary research goals covered by the Earth test candidate.
- `P_d = |M_d| / max(|F_d|,1)` = proportion of the Earth's recorded field-test features relevant to those goals.
- `T_(planet,d)` = a **hand-set** conservative environment/physics-transfer coefficient (see `src/scoringReferences.js`); this represents known physical differences like lower gravity, vacuum, atmosphere and different surface evolution. It is *not inferred from scientific instruments*.
- **Domain research fit** `S_d = 100 × (0.70 × R_d + 0.30 × P_d) × T_(planet,d)`; one decimal place.
- Domain weighted mean `B = Σ(w_d × S_d) / Σw_d`. There are six mission-weight presets; users can edit priorities and set weights to zero to exclude particular domains.
- A small **latitude regime proxy** `L = 100 × (1 − min(90°, ||target_lat| − |earth_lat||)/90°)`. This is a global geometry/proxy only; it is NOT measured temperature, moisture, ice, photoperiod, magnetism, atmosphere or terrain material.
- The regime fraction `λ = min(K, K × (w_thermal+w_resources+w_operations)/Σw_d / 0.35)`, where `K=0.15` for a curated reference, and `K=0.34` for a user-selected arbitrary map point. Both constants are prototype choices, not validated planetary science parameters.
- **Overall score** `/100`: `round_1( (1−λ) × B + λ × L )`.

If all weights are zero, the overall score is zero. Numeric scores compare **relative research-task coverage for the selected objective within this curated catalogue**; they are not probabilities or percentage physical analog agreement. Formula components are shown in every expanded grade audit and exported into the field brief.

### Simple example calculation (illustrative tags, not NASA measurements)

For a criterion with four planetary goal tags and five recorded Earth tags, if two overlap:

- `R = 2/4 = 50%`, `P = 2/5 = 40%`.
- With selected transfer `T=0.80`, the score is `100×(0.70×0.5+0.30×0.4)×0.80 = 37.6/100`.
- This score means the field site could support only part of this **research checklist**, not that the rocks are 37.6% identical.

The previous v6 **distance factor of 0.1 beyond 500 km is not applied** to the fit score. Under that faulty common penalty, a score of 40 would display 4, and rank order would barely move. The current app instead reports distance and an independent research documentation-confidence label from `profileFactor`.

## What is genuine NASA numeric data and what is inferred?

| Domain | Numeric / agency measurements actually displayed | Used to compute the 0–100 domain score? | Important limitation |
|---|---|---|---|
| Geology / mineralogy | Research feature counts and overlap percentages calculated by CyberLeek | **Yes, project tags only** | No matched mineral spectra, rock abundance or bulk composition fractions |
| Terrain | NASA MOLA/LOLA DEM **elevation in meters** at available reference/click samples; Earth candidate latitude | **No DEM**, yes curated topography traits | Different resolutions/datums; cannot resolve rover hazards or local grade from the coarse global grid |
| Temperature / illumination | NASA fact sheet Mars global temperature reference (about -59°C), Moon equatorial diurnal range (~-178°C to +117°C); planetary solar flux (Mars ~586, Moon ~1361 W/m²). NASA POWER Earth modeled annual air temperature/solar energy when reachable | **No**, global/context only | These are not same-time temperatures at both compared candidate areas |
| Water / ice / resources | Explicitly **not measured** as abundance at arbitrary points | Qualitative testing goals only | No validated ice concentration or ore resources computed |
| Dust / erosion | NASA global pressure reference (Mars ~636 Pa, Moon nighttime exosphere ~3e-10 Pa); NASA POWER modeled 10m Earth winds online | **No**, planetary physics context only | Moon has no conventional atmospheric wind; Mars dust is time-variable |
| Biology / biosignatures | Confirmed extraterrestrial life: **none confirmed** (scientific status, not a 0% measurement) | Qualitative sample/contamination research goals only | No site-wide astrobiological spectra or biological surveys |
| Caves / subsurface | Planetary candidate cave inventory **not surveyed at the click** | Qualitative engineering and geologic test goals only | Candidate skylights are not verified accessible caves |
| Landing / rover / construction | Gravity: Moon ~1.62, Mars ~3.73, Earth ~9.80 m/s²; solar-day period: Moon ~708.7h, Mars ~24.66h | **No**, global reference context only | Engineering safety needs site-specific slope/roughness, soil, thermal and illumination surveys |

The numerical **grade breakdown** (matches, misses, recall %, precision %, `T`, weights and contributions) is entirely reproducible from the embedded `public/analog-research-catalog.json`, but *not direct independent orbital measurement*. Numerical NASA facts in the UI are explicitly labeled separate from this qualitative index.

**NASA physical reference sources:** [Mars Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html); [Moon Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html); [NASA MOLA/PDS raster](https://pds-geosciences.wustl.edu/missions/mgs/megdr.html); [NASA LROC/LOLA data](https://svs.gsfc.nasa.gov/4720/); [NASA POWER annual/climatology definitions](https://power.larc.nasa.gov/docs/services/api/temporal/climatology/).

## How did others score these same Earth analog pairs?

**They did not publish directly comparable numeric 0–100 ratings for these exact candidate pairs.** External references are *methods used in related mission evaluations*, not scores or formal validation of CyberLeek. The eight domain cards link an appropriate NASA/peer-reviewed method for context. Examples include:

- NASA Mars 2020 landing-site science workshops used **low / medium / high** relevance judgments against mission objectives. Their ordinal judgements are not interchangeable with Earth-analog fit percentages.
- Mars Science Laboratory landing assessments used **quantitative engineering thresholds** (for example slopes and relief at specified spatial baselines), not an Earth–Mars terrain similarity value. CyberLeek does not implement that NASA landing safety model.
- NASA LRO/LOLA and SLDEM researchers characterize terrain with DEM-derived elevation and roughness at specific scales. This is a more rigorous kind of measurement than matching project annotations; CyberLeek has not reproduced a full matched-resolution terrestrial/planetary terrain analysis.

Thus a CyberLeek score of 70/100 should be presented as a **candidate for follow-up field research**, not "NASA gave this site 70%" or evidence of safe landing/crew conditions.

## What would validate this system?

Record 10–30 km Earth and planetary footprints, compute same-scale slope/roughness, use published geology polygons and laboratory mineralogy where feasible, add time-matched satellite thermal and illumination layers, and evaluate the ranking against independent expert assessments with controls. Distinguish source coverage, measurement quality, local uncertainty, policy/access constraints and research-use priorities. Only after blinded validation should the score be used for more consequential mission screening.
