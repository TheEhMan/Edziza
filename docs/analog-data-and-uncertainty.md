# EDZIZA scientific data, availability, and defensible interpretation

## Design rule: compare experiments, not unrelated planet-wide means

The challenge describes eight *families of properties*, not eight numerical variables guaranteed to be available for every point on Earth, Mars and the Moon. The app stores eight site-specific research profiles and mission-test goals rather than filling unavailable observations with constants or synthetic numbers.

Descriptions are derived from reputable field and orbital mission context and interpreted into matching tags by this project. The tags are **qualitative**, and a category entry can describe a limitation or an instrumentation test goal; it is not proof of a measured physical condition. For each target candidate pair the UI discloses matching features, unmatched features and original evidence references.

The current ranker should not be used for NASA site selection, hazard prediction, resource estimation, cave access, field permitting, crew safety or exploration budget decisions. It is a **hypothesis generator for designing analog field tests**.

## Eight domains and data plan

| Domain | Earth NASA or partner source | Mars observation/source | Moon observation/source | Universal numeric coverage? | Current implementation |
|---|---|---|---|---|---|
| Geology/mineralogy | NASA ASTER, USGS lithology and geology, field assays | THEMIS/TES, USGS planetary geologic maps, potentially CRISM | LRO WAC, USGS Moon geology, possible M³ mineral maps | No | Site narrative, curated tags + source links |
| Terrain/topography | Copernicus GLO-30, NASADEM/SRTM | NASA MOLA DEM, HiRISE/CTX for local targets | LRO/LOLA, SLDEM2015, local LROC NAC stereo DEMs | Mostly mapped, not matched scale | Three Mars grid heights integrated, lunar DEM on-demand; independent 12 km Earth↔Mars DEM experiment |
| Thermal/illumination | NASA POWER climatology | THEMIS/TES, Mars seasonal/time-specific models | LRO Diviner temperature, polar illumination maps | Not for same local time/season/scale | NASA POWER for Earth; target context/qualitative testing objectives |
| Ice/resources | NSIDC/cryosphere, geologic field surveys | NASA SWIM, SHARAD and radar context | LRO polar cold-trap maps, Moon Trek polar data | No proven site extraction inventory | Qualitative evidence, conservative sampling goals |
| Dust/wind/erosion | NASA POWER wind, NASA MODIS aerosols | MCS/TES/THEMIS dust/aeolian processes | Regolith and charging phenomena; no conventional wind | No (Moon has no air wind) | Earth abrasion and lunar grain-handling separated from atmosphere physics |
| Biology/biosignatures | NASA astrobiology field sites; measured organisms at chosen field transects | No confirmed life; biosignature and planetary protection objectives | No confirmed indigenous life; contamination-control objectives | No, scientifically inappropriate | Target-specific *test objectives*; does not invent life/sterility |
| Caves/subsurface | Documented NPS lava tubes, field cores, geological surveys | THEMIS candidate skylights, SHARAD radar (not verified target caves) | LRO candidate pits/rilles, geological analysis (not verified accessible caves) | No | Documented Earth cave systems and *hypothetical* planetary use cases distinguished |
| Operations | DEM-derived hazards, permissions, logistic assessments | Site-specific slope/hazard maps need mission engineering | Lighting, slopes, surface mobility and communications require mission analysis | No | Field-test suitability narrative; no safety/permission validation |

Useful reference URLs:

- [NASA Space Apps challenge](https://www.spaceappschallenge.org/2026/challenges/permanent-moon-base-locations-and-mars/)
- [NASA Moon Trek](https://trek.nasa.gov/moon/)
- [NASA Mars Trek](https://trek.nasa.gov/mars/)
- [NASA MOLA PDS](https://pds-geosciences.wustl.edu/missions/mgs/megdr.html)
- [NASA SVS Moon color and LOLA DEM](https://svs.gsfc.nasa.gov/4720/)
- [NASA PGDA high-resolution lunar topography](https://pgda.gsfc.nasa.gov/products/54)
- [Diviner global and polar lunar temperature products](https://www.diviner.ucla.edu/data)
- [NASA SWIM Mars water-ice overview](https://science.nasa.gov/resource/swim-map-shows-subsurface-water-ice-on-mars/)
- [USGS unified lunar geologic map, version 2](https://astrogeology.usgs.gov/search/map/Moon/Geology/Unified_Geologic_Map_of_the_Moon_GIS_v2/)
- [USGS Mars global geologic map](https://pubs.usgs.gov/sim/3292/)
- [NASA Earth POWER climatology](https://power.larc.nasa.gov/docs/services/api/temporal/climatology/)
- [NASA astrobiology field research](https://astrobiology.nasa.gov/research-locations/)
- [NPS Craters of the Moon lava tubes and restrictions](https://www.nps.gov/crmo/learn/nature/cave.htm)
- [NPS Lava Beds volcanic geology](https://www.nps.gov/articles/nps-geodiversity-atlas-lava-beds-national-monument-california.htm)

## What an honest no-blank requirement means

All domain *records* exist for 6 planetary targets and 11 Earth sites, with a summary, source and test-relevance tags. This gives the end user complete **research-checklist coverage**. It does **not** create measurements that satellites never made or biological claims that are not established. Absence of detected life cannot be represented as measured 0% biology; no conventional wind on the Moon is a physical definition, not a missing weather station; unverified ice/cave presence remains unverified.

## Scoring math

Source: `src/analogRanking.js`. Each domain has goal tags derived from the planetary science question. Earth sites have project-curated features. A score is the fraction of relevant goals covered, weighted to the researcher's priorities. Each component returns a number even when direct in-situ data are not available, because it expresses **test opportunity coverage**, not absolute environmental equality.

### Core limitations

1. Tags are curated by the project team; the current system is a deterministic *ontology filter*, not independent NASA discovery or an ML model.
2. The 11 Earth candidates are an intentionally small geographically diverse seed catalogue. A globally exhaustive search has **not** been performed.
3. Domain comparisons are not normalized by instrument footprint, error bars, mission season or planetary reference ellipsoid.
4. Earth field sites are heterogeneous. A representative coordinate is not a surveyed safe/exact study polygon.
5. `NASA POWER` inputs are modelled Earth climatological averages with finite spatial resolution, not field weather stations.
6. Mars MOLA 16-ppd samples and Moon LOLA 4-ppd samples are coarse gridded global DEM cells; site/rover hazards can be far smaller.
7. No planet has been proven to contain life outside Earth; biosignature-test *design* is what the biological criterion measures.
8. Some highly ranked outdoor Earth sites cannot be accessed or altered without permits. Protected areas require site permission and conservation review.
9. The legacy circular Moon picture is a reference asset supplied by the project owner and not an LRO-derived scientific raster.
10. No claim of better scientific accuracy than NASA Trek, peer-reviewed analog catalogues, or measured global-search systems is made.

## Next version with stronger numbers

1. Register matched site polygons rather than single coordinates, 10–30 km study areas with fine terrain subsets.
2. Sample Earth DEM and MOLA/LOLA local slope distribution, terrain roughness and geomorphological metrics at comparable physical scales. Keep mismatched source-resolution warnings.
3. Query NASA POWER for Earth candidate climate, Diviner for Moon polar/surface temperatures at comparable seasonal/illumination bins, and THEMIS/TES for Mars thermal ranges; mark differences in sampling time.
4. Bring in USGS Mars/Moon geologic polygon classes and Earth geology layer; require published traceable units.
5. Add SWIM water-ice distribution, terrestrial permafrost map, lunar permanently shadowed region illumination/thermal proxies, without inventing mineable ice quantities.
6. Treat 'biology', 'underground', 'operations' as **experiment feasibility and evidence** criteria with mandatory confidence and coverage reporting, not numeric life/atmosphere equality.
7. Validate rankings by known analog sites, negative controls, withheld expert judgments and sensitivity analysis, not solely by matching a preselected shortlist.
8. Consider a wide global Earth gridded search to find less-studied candidates. This prototype does *not* yet perform that search.
