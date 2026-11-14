# NASA Mars and Moon data — methods, provenance, and limitations

This project uses NASA observations only where the source instrument/dataset can support the claim. No local Mars atmospheric variables, lunar local temperatures, crater ice concentrations, or elevations are manually invented.

## Mars — Viking imagery + Mars Global Surveyor MOLA

- **Imagery:** bundled NASA Viking orbital mosaic tiles, already incorporated into the project's Elysium volcano map; bounds 139–165°E and 17–43°N
- **Altimetry:** original NASA PDS Mars Global Surveyor MOLA MEGDR regional grid in `public/mars-wide-elevation.json`, 16 pixels per degree. Source archive: <https://pds-geosciences.wustl.edu/missions/mgs/megdr.html>. The input JSON records the exact file URL.
- **Per-site values:** `npm run refresh:mars-sites` processes each volcano's stored coordinates and computes a *bilinear interpolation of four neighboring DEM cells*. The generated file is `public/nasa-data/mars-mola-sites.json`. These are DEM estimates in metres relative to the Mars areoid, not laser measurements at a landing point.
- **Current values:** Hecates Tholus 4,026 m; Elysium Mons 13,202 m; Albor Tholus 3,650 m. These numbers are derived from **the actual bundled grid**, not NASA Fact Sheet planetary height averages. They depend on the project's chosen locations and grid resolution.
- The 3D Mars mesh uses NASA MOLA terrain with **exaggerated vertical relief**. It is not a rover-scale hazard map.
- Temperature, pressure, gravity and solar day are **NASA global references** with per-value source links. No local wind/humidity/solar readings are assigned to unvisited volcanoes.

## Moon — Lunar Reconnaissance Orbiter (LRO) WAC + LOLA

- **NASA source:** <https://svs.gsfc.nasa.gov/4720/> (NASA Goddard Scientific Visualization Studio, CGI Moon Kit).
- **Color map:** `lroc_color_2k.jpg`, derived from LRO Wide Angle Camera orbital imagery; in 3D it is applied to a smooth sphere. NASA notes this color rendering is optimized for visualization rather than scientific analysis. The source is aligned with 0° longitude in the texture center. The app can display the image in both 3D and 2D; both support mouse/touch zoom.
- **Elevation grid:** NASA LRO/LOLA `ldem_4.tif`, a global 1440 × 720 TIFF at **4 pixels per degree**, encoded as floating-point **kilometres** above a reference sphere with radius **1,737.4 km**. NASA SVS states this is a reformat of the LOLA grid archived by NASA's Planetary Data System.
- **Sampling:** for each site, `x = floor((longitude + 180) / 360 * width)`, `y = floor((90 - latitude) / 180 * height)`; clamp to bounds. Read the nearest grid cell via `geotiff`, then multiply km by 1,000 to report metres. This is a coarse global raster sample (~7.6 km north-south spacing), **not** a surveyed elevation at the Apollo 11 LM, an identified spot on Shackleton's rim, or a specific point on the Aristarchus Plateau. In particular, polar cells are approximate and this grid is too coarse to model crater-wall hazards or ice distribution.
- **Availability:** run `npm run fetch:nasa` with internet access to save `public/nasa-data/lroc_color_2k.jpg`, `ldem_4.tif`, and `moon-lola-sites.json`. If these assets are not present, the Vite dev server proxies the official NASA file (`/nasa-remote/...`) for CORS-safe on-demand loading, with an external NASA fallback in static hosting. If none of those work, lunar DEM elevation is shown as **Not available**, not fabricated. The release ZIP was not able to bundle an independently verified LOLA raster download.
- **Physical references:** NASA Moon Fact Sheet (<https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html>) for mean gravity, solar day and atmospheric conditions. **No** current local lunar surface temperature, atmospheric wind, surface irradiance or ice-abundance measurements are asserted.

## Earth and comparison limitations

Earth climate parameters (`T2M`, `PS`, `RH2M`, `WS10M`, `ALLSKY_SFC_SW_DWN`) are from the NASA POWER climatology API, a gridded historical data product, not present-day weather. The original matched-footprint terrain score still uses Copernicus Earth DEM and separate Mars MOLA data; the Moon is **not** added to that analysis because no matched-resolution terrain metrics were computed.

## Dataset citation links

- NASA PDS Mars MOLA MEGDR: <https://pds-geosciences.wustl.edu/missions/mgs/megdr.html>
- NASA Goddard SVS CGI Moon Kit (WAC color / LOLA gridded elevation): <https://svs.gsfc.nasa.gov/4720/>
- NASA LRO LOLA archives: <https://pds-geosciences.wustl.edu/missions/lro/lola.html>
- NASA Mars Fact Sheet: <https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html>
- NASA Moon Fact Sheet: <https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html>
- NASA POWER API: <https://power.larc.nasa.gov/docs/services/api/temporal/climatology/>
