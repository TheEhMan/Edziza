# Project EDZIZA - NASA Satellite Mars Viewer Upgrade

This **does not replace** the rest of your React project. It updates only your Mars viewer.

## Install (inside the existing `edziza-mars` project)

1. Back up your project.
2. Replace `src/MarsScene.jsx` with the file in this ZIP's `src/` directory.
3. Copy `src/mars-satellite.css` into your existing `src/` directory.
4. Copy `scripts/fetch-mars-wide.mjs` into your existing `scripts/` directory.
5. In the VS Code terminal (project root), run:

   ```cmd
   node scripts/fetch-mars-wide.mjs
   npm run dev
   ```

6. Select **02 Full-screen maps > Mars** and refresh the page.
7. Use **Whole region**, **Hecates Tholus**, **Elysium Mons**, and **Albor Tholus** to explore.

The data script downloads a 33 MB NASA MOLA dataset and about 100 JPEG tiles from NASA Mars Trek. It saves a wide regional 3D topography file and the 2D orbital imagery tiles under `public/`. Downloads need an internet connection. Subsequent runs reuse cached files. No new npm packages are required.

## What changed

- Replaces elevation-based orange colouring with **NASA Viking Orbiter MDIM 2.1 colour mosaic** imagery, draped onto measured MOLA topography.
- Expands the map from ~10 x 10 degrees to **139-165 E, 17-43 N** (~1,300 x 1,540 km).
- Includes three scientifically named volcanoes: Hecates Tholus, Elysium Mons, and Albor Tholus.
- Adds viewpoint buttons, wider camera zoom bounds, and source and resolution labels.
- If data downloads fail, the map shows a flat preview rather than presenting fake relief as NASA data.

## Optional: update old descriptions in App.jsx

Your existing `App.jsx` still has some outdated text. Update them without replacing the whole file:

- `NASA MOLA OPTIONAL` -> `NASA VIKING + MOLA`
- `NASA MOLA topography after download; elevation colors are illustrative.` -> `NASA Viking Orbiter imagery draped over measured MOLA terrain; relief exaggerated.`
- If the story page says the map is *only* elevation-coloured, revise it: `Our regional view uses NASA Viking Orbiter imagery over MOLA relief. The regional MOLA data cannot resolve individual rocks or rover routes.`

## Limitations you MUST disclose to the NASA judges

- **The orbital imagery is real but is not a live camera feed** and may have different dates and resolution across the mosaic.
- **MOLA 16 pixels/degree is coarse** (~3-4 km spacing at Hecates Tholus). This is suitable for *volcano-scale* context, not checking individual rover obstacles or safe landing footprints.
- **The 3D relief is intentionally exaggerated** to make broad landscape forms visible. The UI states the exaggeration factor.
- The wide 3D map and the separate Scientific Analysis page have **different spatial resolutions**. Use the measured higher-resolution analysis output (not this rendered 3D map) for your matching score.
- NASA Viking global mosaic is not HiRISE; future high-zoom improvements should add georeferenced local CTX/HiRISE images or a finer DEM for a chosen small patch.
- The map is a local equirectangular rectangular patch rather than a globe. The edges are approximate for visual exploration, not accurate geodesic distance calculations.

## Sources

- NASA Mars Trek WMTS services and Viking MDIM 2.1 layer:
  https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=mars
- NASA Mars Trek map:
  https://trek.nasa.gov/mars/
- NASA PDS MOLA elevation data:
  https://pds-geosciences.wustl.edu/missions/mgs/megdr.html
- USGS Gazetteer of Planetary Nomenclature - Hecates Tholus:
  https://planetarynames.wr.usgs.gov/Feature/2407
- Elysium Mons:
  https://planetarynames.wr.usgs.gov/Feature/1783
- Albor Tholus:
  https://planetarynames.wr.usgs.gov/Feature/166

Suggested credit on your site: `Mars imagery: NASA/JPL Viking Orbiter global mosaic via Mars Trek. Elevation: NASA/MGS MOLA via PDS.`
