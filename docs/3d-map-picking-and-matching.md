# 3D map picking and Earth analog matching: methodology and limits

## User story

A research or engineering student selects **Mars** or **Moon**, navigates an interactive **3D** map, and clicks a target coordinate. EDZIZA uses the closest *curated planetary research profile* to rank eleven Earth analog candidate areas, with eight evidence-guided categories and weighted mission priorities. The app provides Earth maps, georeferenced coordinates, supporting sources, limitations, and a downloadable research brief.

The user's selected coordinate is **not** itself characterized by eight instrument observations. The match is a *reference-region transfer* and is flagged accordingly. It should guide an initial field-test hypothesis, not a landing or engineering decision.

## Map data and actual capabilities

| Viewer | Coverage | Surface geometry | Colors | What a click measures |
| --- | --- | --- | --- | --- |
| Mars | Elysium volcanic region **139–165°E, 17–43°N**; NOT the full planet | Gridded regional NASA MOLA DEM from original project, already bundled; rendered as 3D triangulated terrain (vertical exaggeration ~18.4x at default) | Bundled Viking orbital tiles projected on same regional footprint | Planetocentric latitude/longitude from 3D terrain raycast; MOLA DEM grid elevation at that coordinate |
| Moon | Global globe for coordinate selection | NASA LRO/LOLA `ldem_4.tif` 4 pixels/degree (~7.6 km north-south at the equator) displaced globe, when file has been downloaded; exaggerated **22x** for visibility | NASA LRO WAC 2k color mosaic, when loaded | Planetocentric latitude/longitude from 3D globe raycast; LOLA height at selected grid cell if DEM loaded |
| Earth | Eleven representative field locations | MapLibre external 3D raster DEM service, where available | Satellite imagery / map tiles from external providers | The selected winning Earth location is used; it does not silently default to Mount Edziza |

NASA source links: [SVS CGI Moon Kit, including LOLA and LROC](https://svs.gsfc.nasa.gov/4720/), [NASA Mars Trek](https://trek.nasa.gov/mars/), [NASA MOLA archive](https://pds-geosciences.wustl.edu/missions/mgs/megdr.html), [NASA Mars Trek tiles API](https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=mars).

**Offline behavior:** the complete Mars regional DEM and Viking map tiles are bundled. The full NASA Moon WAC texture and LOLA TIFF are not bundled. Without a working network or a prior `npm run fetch:nasa`, the Moon 3D viewer remains usable for geographic picking but shows a neutral **smooth sphere**, clearly labeled as *not* measured lunar relief. The user's provided circular Moon image remains accessible under *Detailed map*, and is explicitly a visual reference, not a calibrated planetary atlas.

## Mapping a click to a research profile

`src/planetarySelection.js` computes great-circle distances using the approximate mean body radius (Mars 3389.5 km, Moon 1737.4 km) to the three documented profile anchors for that body. The nearest of the three is the *comparison profile*. Moon research-vicinity flag: within 100 km of its anchor. Mars flag: within 150 km. These are project-defined conservative disclosure thresholds, not validated geological boundaries or homogeneous source footprints.

When a click falls farther away, the app visibly marks it as **low-confidence spatial extrapolation**. The numerical eight-domain ranking **does not change between two clicked pixels mapped to the same anchor**; it represents how Earth candidates cover the reference profile's research tasks. This limitation is deliberately visible to prevent false scientific precision.

If the user needs evidence for a specific distant, uncharacterized Moon location, the next scientific step is to ingest registered and validated global layers (geology classes, local LOLA slope/roughness, LRO Diviner, polar illumination, ice indicators, etc.) and compute a new profile. The present prototype does not claim that functionality.

## Field site result

The selected Earth candidate uses its own latitude/longitude and approximate map center. In v4 the Earth map incorrectly fell back to the Edziza site for non-Edziza winners; v5 uses `EARTH_ANALOGS` coordinates in `src/EarthMap.jsx`. The results update when the planetary anchor changes, or when the user changes priorities. A candidate chosen manually stays selected until a new target is picked. The research brief records both the clicked coordinate and the anchor distance.

## QA

`npm run verify` exercises 3D selection distance calculations, antimeridian wrapping, source raster sampling, Mars/Moon pick wiring, ranker behavior, Earth site map wiring, and the prior eight-domain / MOLA checks. Automatic tests do not substitute for a live WebGL browser interaction test or NASA dataset availability check.
