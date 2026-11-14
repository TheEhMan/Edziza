# CyberLeek | Data availability and uncertainty

**Purpose:** Suggest Earth field locations for planetary science and engineering *field-test experiments*, not physical Moon/Mars equivalents or safe landing/crew sites.

CyberLeek v7 includes **8 Earth study candidates × 6 planetary reference profiles** and eight documented research domains each. All category records are present, with source links and interpreted feature tags; that does **not** mean eight co-registered measured environmental data products are present for all locations. The score is a declared tag-coverage/mission-transfer heuristic, not NASA instrument data. See [`v7-scoring-numeric-evidence.md`](v7-scoring-numeric-evidence.md).

| Domain | Existing scientific resource to consult | What v7 actually uses | Gap before claiming real planetary data-driven matching |
|---|---|---|---|
| Geology / mineralogy | NASA THEMIS/CRISM, USGS geologic maps, LRO WAC/M³ | Linked planetary/Earth geology descriptions + tagged goals | Matched geology polygons and mineral abundance measurements |
| Terrain | NASA MOLA for Mars, LRO LOLA for Moon, NASADEM or Copernicus for Earth | Actual coarse NASA DEM heights **displayed** where downloaded; separately curated roughness/landform feature tags are **scored** | Same-size mapped study polygons and slope/roughness statistics at matched cell sizes |
| Thermal / illumination | NASA POWER Earth, THEMIS/TES Mars, LRO Diviner Moon | Earth POWER climatology where online; global NASA temperature and solar context separately; research-goal tags in rank | Spatial/seasonal local readings and consistent model comparisons |
| Ice / resources | Mars SWIM/SHARAD; lunar polar temperature/illumination; terrestrial permafrost | Interpretations and mission tests; no invented % ice | Verified same-footprint resource observations and quality flags |
| Dust / erosion | NASA POWER wind, Mars dust observations; lunar regolith studies | Earth modeled wind online, Mars/Moon global pressure facts; qualitative field analog traits | Local aeolian activity indices; lunar surface dust is not atmospheric wind |
| Biology / habitability | Earth microbiology field surveys and planetary-protection research | Experimental objectives and site descriptions | No indigenous Mars/Moon life confirmed; no invented local life readings |
| Caves / subsurface | USGS/NPS terrestrial lava-tube surveys; candidate planetary pits/skylights | Documented terrestrial cave opportunities, lunar/Mars research possibilities | Orbital candidate pit does not imply a confirmed accessible cave |
| Operations | NASA landing/hazard studies; robotics field experiment reports | Test-relevance tags; global gravity/day references separately | Validated landing ellipses, mechanical soil strengths, rock size/slope, access permissions |

## Limitation rules

1. Arbitrary 3D clicks are **mapped to the nearest of three documented planetary reference profiles per world**. A click's own geology, life, ice or rock strength is **not reconstructed** from its coordinates. The distance and evidence confidence are shown separately from the score.
2. The eight Earth analogs are **curated examples**, not a full global Earth search and not novel/discovered sites by default.
3. Slope, rock size, terrain roughness, elevation, chemistry and thermal states cannot be assumed equivalent between NASA products with different spatial resolutions and measurement dates.
4. The Moon does **not** have conventional atmospheric wind; Earth's gravity/atmosphere/radiation are fundamentally different from the Moon and Mars. A high task-fit index is compatible with profound physical dissimilarities.
5. The original round Moon illustration is an uploaded **non-georeferenced, low-resolution reference**, not a scientifically accurate site-selection basemap. The official NASA Moon Trek 2D tile map is the alternative.
6. Earth climate via NASA POWER is **modeled climatology**, not current field station data. Planetary fact sheets give **global averages/reference values**, not measurements at the specific clicked pixel.
7. Field access, permits, indigenous/local stewardship, hazards and site conservation must be independently checked. Recommendations are not a permit to conduct fieldwork.
8. The ranking has **not been calibrated, blind-validated or compared to a standardized NASA analog suitability benchmark**. Do not claim superior scientific accuracy to NASA Trek or peer-reviewed methods.

## Future science milestones

Ingest consistent DEM footprint-level slope/roughness from Earth/Mars/Moon; NASA POWER and Diviner/THEMIS temperature with date/resolution masks; published geology maps/mineral products; permafrost/ice and subsurface evidence quality; field feasibility and permit data; and independent positive/negative test sites. Distinguish observed values, absence of detection, not applicable (e.g., lunar wind), estimates and missing data. Maintain a reproducible source manifest and blinded assessment against external expert judgments.

Sources: [NASA SVS CGI Moon Kit](https://svs.gsfc.nasa.gov/4720/); [NASA Mars MOLA](https://pds-geosciences.wustl.edu/missions/mgs/megdr.html); [NASA POWER climatology](https://power.larc.nasa.gov/docs/services/api/temporal/climatology/); [NASA Mars Trek](https://trek.nasa.gov/mars/); [NASA Moon Trek](https://trek.nasa.gov/moon/).
