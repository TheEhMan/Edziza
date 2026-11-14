// Eight-domain analog screening catalogue. All textual site/domain assessments are
// evidence-guided project interpretations, NOT uniformly measured NASA site records.
// Sources are included for audit; tags are intended for a transparent ranking demonstration.
export const DOMAINS = [
  { id: 'geology', label: 'Geology & materials', short: 'Geology', question: 'Which rocks, minerals and deposits can we practice sampling?', defaultWeight: 4,
    data: 'NASA/USGS planetary geologic maps; LROC, THEMIS; geological site descriptions.' },
  { id: 'terrain', label: 'Terrain & topography', short: 'Terrain', question: 'What landforms and traversal problems are comparable?', defaultWeight: 4,
    data: 'NASA MOLA Mars DEM; LRO/LOLA Moon DEM; Copernicus and Earth terrain models.' },
  { id: 'thermal', label: 'Temperature & illumination', short: 'Thermal', question: 'Can we practice in relevant heat, cold or lighting conditions?', defaultWeight: 2,
    data: 'NASA POWER Earth climate; LRO Diviner temperatures; Moon illumination mapping; Mars THEMIS.' },
  { id: 'resources', label: 'Water, ice & resources', short: 'Ice & resources', question: 'Can resource prospecting, drilling or sampling be exercised?', defaultWeight: 3,
    data: 'NASA/agency cryosphere products; LRO polar maps; Mars MOLA/SHARAD and SWIM reports.' },
  { id: 'dust', label: 'Dust, wind & surface processes', short: 'Dust & erosion', question: 'What surface processing can we imitate without confusing air and vacuum?', defaultWeight: 2,
    data: 'NASA POWER wind and Earth aerosols; Martian THEMIS imagery; lunar surface/regolith observations.' },
  { id: 'biology', label: 'Biology & biosignatures', short: 'Life & biosignatures', question: 'How can sampling, preservation and contamination control be tested?', defaultWeight: 2,
    data: 'NASA astrobiology analog field descriptions; laboratory and field biosignature research.' },
  { id: 'subsurface', label: 'Caves & underground', short: 'Subsurface', question: 'Could subsurface scouting, imaging or drilling be tested?', defaultWeight: 2,
    data: 'NASA/JPL candidate pit imagery; Earth field geology, documented lava tubes and ice-cemented ground.' },
  { id: 'operations', label: 'Exploration & operations', short: 'Operations', question: 'Does this field site support meaningful hardware and mission trials?', defaultWeight: 3,
    data: 'NASA analog mission and fieldwork reports; terrain and logistical context (not an accessibility clearance).' }
];

const entries = (source, raw) => Object.fromEntries(DOMAINS.map(({ id }) => {
  const entry = raw[id];
  if (!entry || typeof entry[0] !== 'string' || !entry[0].trim() || !entry[1]?.trim()) {
    throw new Error(`Missing domain ${id}`);
  }
  return [id, { summary: entry[0], features: entry[1].trim().split(/\s+/), source: entry[2] || source }];
}));
const NASA_ANALOG = 'https://science.nasa.gov/solar-system/planetary-analogs/';
const NASA_FIELD = 'https://astrobiology.nasa.gov/research-locations/';
const NASA_OPERATIONS = 'https://www.nasa.gov/analog-missions/';
const NASA_CAVES = 'https://science.nasa.gov/resource/seven-possible-cave-skylights-on-mars/';
const NASA_LOLA = 'https://svs.gsfc.nasa.gov/4720/';
const NASA_MARS = 'https://science.nasa.gov/resource/elysium/';
const NASA_MOON = 'https://science.nasa.gov/moon/';

function earth(id, name, region, lat, lon, source, reason, raw, mapZoom = 9) {
  return { id, name, region, lat, lon, source, reason,
    coords: [lon, lat], zoom: mapZoom, pitch: 52, bearing: 0, domains: entries(source, raw) };
}

// Site anchors are representative map centers, not boundaries of homogeneous areas.
export const EARTH_ANALOGS = [
  earth('snowshoe', 'Snowshoe Lava Field', 'Mount Edziza, British Columbia, Canada', 57.65, -130.667,
    'https://bcparks.ca/mount-edziza-park/', 'Basaltic lava and ice-contact process research, but not a direct Moon or Mars climate analog.', {
      geology: ['Exposed basaltic lava-field analog; local mineral abundances are not included.', 'basalt volcanic'],
      terrain: ['Rocky lava flow surfaces and volcanic relief allow traverse hypotheses.', 'lava-flow rough rocky'],
      thermal: ['High-latitude alpine conditions; Earth air and seasonality remain unlike lunar or Martian cycles.', 'cold dry-swings'],
      resources: ['Glaciers and volcanic/ice interaction provide ice-field research opportunities.', 'ice volcanic-rock'],
      dust: ['Loose volcanic fragment and erosion study; not a Martian global dust storm.', 'grit volcanic-fragments'],
      biology: ['Living Earth environment; sampling contamination and rock/ice microbial tests are possible research goals.', 'sampling-control extremophile-tests'],
      subsurface: ['Ice/rock contacts offer subsurface-sampling concepts; lava-tube presence at this pin is not established.', 'subsurface-sampling'],
      operations: ['Remote rugged site useful for planning traverses, communications and field logistics, subject to permission.', 'remote rough-route sampling']
    }, 11.1),
  earth('summit', 'Mount Edziza Summit', 'Mount Edziza, British Columbia, Canada', 57.72, -130.63,
    'https://bcparks.ca/mount-edziza-park/', 'Steep glaciated volcano terrain; strong for cold mobility tests, weaker for flat landing plains.', {
      geology: ['Volcanic edifice and exposed rock; specific rock chemistry must be verified in the field.', 'volcanic basalt'],
      terrain: ['Steep glaciated volcanic slopes; strong traverse hazard analog.', 'steep rough rocky'],
      thermal: ['Cold alpine setting with seasons and long summer daylight.', 'cold polar-light'],
      resources: ['Glaciers and exposed volcanic rock for ice and material-handling concepts.', 'ice volcanic-rock'],
      dust: ['Rock fragments and glacial erosion; no equivalence to airless lunar dust.', 'grit volcanic-fragments'],
      biology: ['Earth biology present; useful for contamination protocols, not sterile-site simulation.', 'sampling-control extremophile-tests'],
      subsurface: ['Glacier/rock interfaces suit shallow sampling scenarios; cave opening not documented by this source.', 'subsurface-sampling ice-cemented'],
      operations: ['Challenging remote steep-terrain field exercise; access constraints require separate review.', 'remote rough-route hazard-assessment']
    }, 10.4),
  earth('desolation', 'Desolation Lava Field', 'Mount Edziza, British Columbia, Canada', 57.816667, -130.616667,
    'https://bcparks.ca/mount-edziza-park/', 'Lava flows and cinder cones support testing volcanic geologic interpretation and rover traction.', {
      geology: ['Basaltic lava-flow and volcanic-cone landscape.', 'volcanic basalt pyroclastic'],
      terrain: ['Variable rough lava and cinder cones for path planning.', 'lava-flow rough steep rocky'],
      thermal: ['Cool northern plateau conditions; does not reproduce planetary vacuum or low pressure.', 'cold dry-swings'],
      resources: ['Volcanic rock provides an engineering materials analog; site ice is not quantified.', 'volcanic-rock regolith'],
      dust: ['Cinders and granular volcanic material offer loose-particle mobility testing.', 'grit volcanic-fragments loose-grains'],
      biology: ['Field sampling can exercise biological contamination controls in an Earth ecosystem.', 'sampling-control extremophile-tests'],
      subsurface: ['Lava-flow geology supports subsurface mapping exercises; no confirmed cave is asserted at the pin.', 'subsurface-sampling'],
      operations: ['Remote rough-terrain rover and sampling exercise candidate, pending local access rules.', 'remote rough-route rover sampling']
    }, 11.1),
  earth('atacama', 'Yungay / Atacama Desert', 'Antofagasta Region, Chile', -24.1, -69.93,
    NASA_FIELD, 'Extreme dry-soil and biosignature testing analog. Famous site, included as a benchmark.', {
      geology: ['Arid desert soils and mineral alteration context; not a generic basaltic shield volcano.', 'sedimentary salt regolith'],
      terrain: ['Dry, rocky or sediment-covered plains support sampling and route-planning trials.', 'flat rocky dusty-plain'],
      thermal: ['Very arid conditions, strong daytime solar exposure and diurnal thermal cycles.', 'hot dry dry-swings high-sun'],
      resources: ['Scarce accessible surface water supports dry-resource prospecting experiments.', 'dry regolith'],
      dust: ['Windblown desert particles support aeolian transport and instrument-dust screening.', 'aeolian dust grit loose-grains'],
      biology: ['Extremely low-biomass soil investigations are useful for biosignature detection and contamination controls.', 'low-biomass biosignature-tests sampling-control'],
      subsurface: ['Subsurface soil sampling and layer-preservation tests; no lava tube claimed at the map point.', 'subsurface-sampling'],
      operations: ['Accessible in some areas for specialist campaigns; permits and safety must be separately assessed.', 'rover sampling field-campaign']
    }, 9),
  earth('haughton', 'Haughton Impact Crater', 'Devon Island, Nunavut, Canada', 75.377, -89.667,
    'https://science.nasa.gov/solar-system/planetary-analogs/10-things-to-know-about-planetary-analogs/', 'NASA-proven Arctic impact structure and remote expedition operations benchmark.', {
      geology: ['Meteorite-impact crater and shocked rock geology; not a volcanic shield.', 'impact rocky regolith'],
      terrain: ['Impact crater, rocky rough terrain and exposed slopes for rover hazard comparison.', 'crater steep rough rocky'],
      thermal: ['Freezing Arctic temperatures and strong polar seasonal light cycles.', 'cold polar-light dry-swings'],
      resources: ['Polar ground and seasonally frozen terrain offer ice-handling scenario research.', 'ice permafrost'],
      dust: ['Loose polar sediment and granular abrasion can be studied; no direct lunar vacuum match.', 'grit loose-grains'],
      biology: ['Cold-desert contamination-control research, despite Earth microbiology.', 'low-biomass sampling-control extremophile-tests'],
      subsurface: ['Crater sediments and frozen-ground coring are relevant; crater is not a verified cave.', 'subsurface-sampling ice-cemented'],
      operations: ['Documented NASA rover/exploration-operations analog in isolated extreme terrain.', 'remote rover sampling polar-ops rough-route hazard-assessment']
    }, 9),
  earth('dryvalleys', 'McMurdo Dry Valleys', 'Victoria Land, Antarctica', -77.5, 162.5,
    NASA_FIELD, 'Polar, hyper-arid, microbe-bearing landscape especially useful for cold subsurface exploration.', {
      geology: ['Exposed polar desert sediments, rock and weathering products.', 'sedimentary rocky regolith'],
      terrain: ['Polar valleys, rocky ground and ice-cemented surfaces.', 'polar rough rocky flat'],
      thermal: ['Extreme cold, dryness and polar illumination regime.', 'cold dry polar-light dark'],
      resources: ['Ice-cemented ground and nearby ice provide drill-sampling analog contexts.', 'ice permafrost ice-cemented'],
      dust: ['Dry sediment, erosion and particle transport under Earth winds.', 'aeolian grit loose-grains'],
      biology: ['NASA describes cryptoendolithic microbes and preserved biosignatures in this harsh setting.', 'low-biomass biosignature-tests extremophile-tests sampling-control'],
      subsurface: ['Ice-cemented subsurface soil and rock are relevant drilling subjects.', 'ice-cemented subsurface-sampling drilling'],
      operations: ['Remote polar field operations, traverse planning and restricted environmental access.', 'remote polar-ops drilling sampling hazard-assessment']
    }, 8.2),
  earth('fagradalsfjall', 'Fagradalsfjall Lava Field', 'Reykjanes Peninsula, Iceland', 63.895, -22.27,
    'https://science.nasa.gov/solar-system/planetary-analogs/nasas-goddard-instrument-field-team-iceland-2025/team-lava/', 'Recent lava flow and volcanic vent processes investigated by NASA field teams.', {
      geology: ['Recent basaltic volcanic lava and vents for field spectroscopy and morphology.', 'basalt volcanic pyroclastic'],
      terrain: ['Lava flows, cones and broken rock; active-hazard zones require monitoring.', 'lava-flow rough rocky steep'],
      thermal: ['Cold North Atlantic conditions with volcanic thermal anomalies; not a permanent thermal proxy.', 'cold dry-swings'],
      resources: ['Fresh volcanic rock enables sample and material-processing trials.', 'volcanic-rock regolith'],
      dust: ['Fresh fragmental rock can simulate gritty surface handling.', 'grit volcanic-fragments loose-grains'],
      biology: ['NASA field studies investigate sampling protocols and life-detection methods on Icelandic volcanics.', 'biosignature-tests sampling-control extremophile-tests'],
      subsurface: ['Volcanic flow structure offers subsurface-geology questions; no mapped tube is asserted here.', 'subsurface-sampling'],
      operations: ['NASA has used Iceland volcanic fieldwork for science-instrument and traverse exercises.', 'rough-route sampling field-campaign rover']
    }, 10),
  earth('lavabeds', 'Lava Beds National Monument', 'Northern California, United States', 41.741, -121.519,
    'https://www.nps.gov/articles/nps-geodiversity-atlas-lava-beds-national-monument-california.htm', 'Documented basaltic flows and lava tubes support lunar subsurface reconnaissance.', {
      geology: ['NPS describes basalt-to-rhyolite volcanic flows with cinder cones and other features.', 'basalt volcanic pyroclastic'],
      terrain: ['Rough lava flows, vents and varied volcanic relief.', 'lava-flow rough rocky steep'],
      thermal: ['Seasonally variable terrestrial conditions; light/dark caves support instrument practice.', 'dry-swings dark'],
      resources: ['Volcanic rock and subsurface material research opportunities; not a verified ice resource analog.', 'volcanic-rock regolith'],
      dust: ['Broken lava fragments and unconsolidated volcanic surfaces.', 'grit loose-grains volcanic-fragments'],
      biology: ['Earth cave biology requires strict biosafety; useful for contamination-avoidance trials.', 'sampling-control extremophile-tests'],
      subsurface: ['Documented lava tubes make this a strong field analog for cave entry and mapping.', 'lava-tube cave subsurface-sampling'],
      operations: ['Cave navigation, surface rover traverses and equipment trials could be designed where permitted.', 'rough-route sampling field-campaign rover hazard-assessment']
    }, 10.4),
  earth('deathvalley', 'Badwater / Death Valley', 'California, United States', 36.23, -116.767,
    'https://www.nps.gov/deva/learn/nature/salt-flats.htm', 'Hot dry basin and exposed salts; vehicles are not allowed off established roads at Badwater.', {
      geology: ['Salt and sedimentary basin deposits, not a basaltic mare or impact crater.', 'salt sedimentary regolith'],
      terrain: ['Relatively level basin floors and rugged neighboring badlands.', 'flat dusty-plain rocky'],
      thermal: ['High heat, intense sunlight and dry conditions.', 'hot dry high-sun dry-swings'],
      resources: ['Evaporite salts offer resource-detection analog questions, but not frozen water.', 'salt dry regolith'],
      dust: ['Wind-driven dust, sand and erosion provide dust-interface tests.', 'aeolian dust grit loose-grains'],
      biology: ['Dryland biosignature and contamination exercises; not a sterile planet stand-in.', 'sampling-control biosignature-tests'],
      subsurface: ['Desert sediment coring scenarios; no cave is assumed at Badwater.', 'subsurface-sampling'],
      operations: ['Badwater salt-flat surfaces are protected: no off-road vehicle testing; permitted observation and sampling proposals would require park approval.', 'sampling field-campaign']
    }, 10.8),
  earth('kilauea', 'Kīlauea Volcanic Field', 'Hawaiʻi, United States', 19.421, -155.287,
    'https://astrobiology.nasa.gov/research-locations/', 'Basalt landscapes and volcanic tubes provide geology and subsurface analogs.', {
      geology: ['Basaltic eruptions, lava sheets and volcanic vents.', 'basalt volcanic pyroclastic'],
      terrain: ['Broken and smooth lava surfaces with rough volcanic relief.', 'lava-flow rough rocky steep'],
      thermal: ['Warm and humid Earth setting; very different from lunar vacuum or Martian cold.', 'hot high-sun'],
      resources: ['Basalt and volcanic material support construction-feedstock concepts.', 'volcanic-rock regolith'],
      dust: ['Volcanic ash and rock grains support materials characterization.', 'volcanic-fragments grit loose-grains'],
      biology: ['Life-colonization gradients across young lava support contamination and biosignature tests.', 'biosignature-tests sampling-control extremophile-tests'],
      subsurface: ['NASA astrobiology lists lava tubes for studying possible ancient-Mars subsurface habitats.', 'lava-tube cave subsurface-sampling'],
      operations: ['Geological traverse and instruments testing potential where safe and authorized.', 'rover sampling field-campaign hazard-assessment']
    }, 10),
  earth('cratersmoon', 'Craters of the Moon', 'Idaho, United States', 43.444, -113.516,
    'https://www.nps.gov/crmo/learn/education/geology-for-students.htm', 'Rocky basaltic flow fields and lava tubes for lunar volcanic-route simulations.', {
      geology: ['Basaltic fissure eruptions, cinder cones and lava fields.', 'basalt volcanic pyroclastic'],
      terrain: ['Rough lava, fissures, cones and relatively open lava plains.', 'lava-flow rough rocky flat'],
      thermal: ['Dry continental conditions with pronounced daily and seasonal temperature variation.', 'dry-swings dry'],
      resources: ['Exposed basalt and volcanic rubble for engineering-material handling.', 'volcanic-rock regolith'],
      dust: ['Fine volcanic particles and broken lava rubble for regolith-handling exercises.', 'volcanic-fragments grit loose-grains'],
      biology: ['Sample cleanliness and pioneering vegetation studies, not sterile planetary conditions.', 'sampling-control biosignature-tests'],
      subsurface: ['Documented lava tubes and fissures for cave-navigation research.', 'lava-tube cave subsurface-sampling'],
      operations: ['Rugged but comparatively accessible volcanic field for traverse demonstrations, subject to park rules.', 'rover sampling field-campaign rough-route']
    }, 10)
];

const target = (world, id, name, source, mission, raw, limitations) => ({
  world, id, name, source, mission, limitations,
  domains: Object.fromEntries(DOMAINS.map(({ id: domain }) => {
    const entry = raw[domain];
    if (!entry || !entry[0]?.trim() || !entry[1]?.trim()) throw new Error(`Missing target ${id}: ${domain}`);
    return [domain, { observation: entry[0], goals: entry[1].trim().split(/\s+/), source: entry[2] || source }];
  }))
});

const MARS_GLOBAL = 'https://science.nasa.gov/mars/';
const MOON_POLAR = 'https://science.nasa.gov/resource/shackleton-craters-illuminated-rim-shadowed-interior/';
const MOON_ARIST = 'https://science.nasa.gov/3d-resources/moon-aristarchus-region/';
const MOON_MARE = 'https://science.nasa.gov/image-detail/20100528/';
export const TARGETS = [
  target('mars', 'hecates', 'Hecates Tholus', NASA_MARS,
    'Test lava-and-ice geological interpretation and rough volcanic rover operations.', {
      geology: ['Volcanic edifice in NASA-mapped Elysium volcanic province; site mineral fractions not sampled here.', 'volcanic basalt'],
      terrain: ['Volcano flanks and relief in MOLA terrain; patch-scale rover hazards need finer maps.', 'steep rough rocky'],
      thermal: ['Martian cold and strong diurnal contrasts; no verified local weather series included.', 'cold dry-swings'],
      resources: ['Ancient glacier-related landforms have been discussed; present ice abundance at this pin is unverified.', 'ice permafrost'],
      dust: ['Martian surface particles and atmospheric dust processes require windblown-grit tests.', 'grit dust aeolian'],
      biology: ['No confirmed Martian life; contamination-aware biosignature sampling is a test objective.', 'sampling-control biosignature-tests'],
      subsurface: ['Volcanic/ice contact motivates drilling and soil-core tests; no confirmed local tube is claimed.', 'subsurface-sampling ice-cemented'],
      operations: ['Volcanic traverse and remote sensing are appropriate research concepts, not approved landing plans.', 'rover rough-route remote sampling']
    }, 'Low pressure, Mars gravity, radiation, and global dust cannot be reproduced outdoors on Earth.'),
  target('mars', 'elysium', 'Elysium Mons', NASA_MARS,
    'Choose an Earth volcanic field for basalt mineral analysis, lava-flow mapping and rover testing.', {
      geology: ['Large Martian shield volcano mapped in the NASA MOLA Elysium region.', 'volcanic basalt'],
      terrain: ['Broad shield volcano and flank lava-flow morphology; DEM cells are regional.', 'lava-flow rocky rough'],
      thermal: ['Cold, thin-atmosphere Mars conditions; aim for dry field operations.', 'cold dry'],
      resources: ['Volcanic rock/regolith resources are a sampling objective; site ice quantity not measured here.', 'volcanic-rock regolith'],
      dust: ['Surface soil and aeolian grit can affect rover instruments.', 'grit aeolian loose-grains'],
      biology: ['No confirmed Martian life; use contamination-aware sampling and instruments testing.', 'sampling-control biosignature-tests'],
      subsurface: ['Volcanic units motivate shallow coring; no cave has been confirmed at this chosen point.', 'subsurface-sampling lava-tube'],
      operations: ['Rover traction, mineral mapping and rough-track sampling are useful field-test objectives.', 'rover rough-route sampling']
    }, 'Earth basalt is weathered and biologically active; Mars has different gravity, atmosphere and radiation.'),
  target('mars', 'albor', 'Albor Tholus', 'https://science.nasa.gov/photojournal/albor-tholus/',
    'Investigate cratered volcanic relief and steep-slope mobility on Earth.', {
      geology: ['NASA THEMIS shows a volcano with a pronounced caldera in the Elysium province.', 'volcanic basalt'],
      terrain: ['Steep caldera relief and volcanic flank terrain; precise safe routes need site DEM.', 'steep crater rough'],
      thermal: ['Cold, dusty Martian environment; no measured site-specific thermal series used.', 'cold dry-swings'],
      resources: ['Basaltic volcanic materials are a collection target; no measured local ice inventory.', 'volcanic-rock regolith'],
      dust: ['Grit and rockfall accumulation can be an operational process analog.', 'grit volcanic-fragments'],
      biology: ['No confirmed indigenous life; clean sampling remains mission-relevant.', 'sampling-control biosignature-tests'],
      subsurface: ['Crater/flank drilling and layer examination are analog objectives, not evidence of a known cave.', 'subsurface-sampling'],
      operations: ['Steep terrain requires cautious routing and hazard scouting.', 'rover rough-route hazard-assessment']
    }, 'Earth crater/volcano operations cannot reproduce Martian low-pressure atmosphere and gravity.'),
  target('moon', 'apollo11', 'Apollo 11 / Tranquility Base', MOON_MARE,
    'Find basaltic Earth terrain suited to regolith handling, flat-ground rover trials and sample geology.', {
      geology: ['NASA describes the Mare Tranquillitatis basin as relatively smooth basaltic lava plains.', 'basalt volcanic'],
      terrain: ['Relatively smooth mare with impact overprints; rover-scale roughness not computed here.', 'flat rocky'],
      thermal: ['Vacuum exposure causes extreme day/night heating and cooling; outdoors only partially analog.', 'hot dry-swings'],
      resources: ['Regolith and local basalt materials are relevant; no local exposed ice is established.', 'regolith volcanic-rock'],
      dust: ['Lunar abrasive regolith has no wind transport; test loose-grain handling, not aeolian physics.', 'grit loose-grains'],
      biology: ['No confirmed indigenous lunar life; contamination control is the Earth-test objective.', 'sampling-control'],
      subsurface: ['Lunar mare volcanic structures motivate optional lava-tube methods; no tube is claimed at Apollo 11.', 'subsurface-sampling lava-tube'],
      operations: ['Sample collection, rover handling and navigation across rocky plains.', 'rover sampling field-campaign']
    }, 'No Earth field site reproduces lunar vacuum, one-sixth gravity, radiation or real lunar dust properties.'),
  target('moon', 'shackleton', 'Shackleton crater / South Pole', MOON_POLAR,
    'Find a cold crater or polar Earth site for ice prospecting, difficult lighting and remote traverse tests.', {
      geology: ['NASA maps an impact crater in ancient polar highlands; precise mineralogy varies.', 'impact rocky'],
      terrain: ['Steep crater rim and permanently shadowed interior require hazard-aware planning.', 'crater steep polar rough'],
      thermal: ['Rim sunlight and permanently shadowed cold floors; Earth seasonal polar darkness is only partial analog.', 'cold polar-light dark'],
      resources: ['Polar cold traps may host water ice; this prototype makes no local ice-grade estimate.', 'ice permafrost'],
      dust: ['Airless lunar regolith and dust adhesion are important; terrestrial gritty soil is a handling analog only.', 'grit loose-grains'],
      biology: ['No confirmed lunar life; clean ice coring and contamination control are useful test scenarios.', 'sampling-control extremophile-tests'],
      subsurface: ['Cold subsurface and shadowed material motivate ice coring, not a confirmed cave.', 'ice-cemented subsurface-sampling drilling'],
      operations: ['Remote polar route planning, prospecting, robotic hazard mapping and sampling.', 'remote polar-ops drilling hazard-assessment']
    }, 'Permanent shadows, lunar gravity and cryogenic-vacuum chemistry require separate laboratory testing.'),
  target('moon', 'aristarchus', 'Aristarchus Plateau', MOON_ARIST,
    'Discover lava-field and subsurface analogs for pyroclastic deposits, sinuous rilles and traverse science.', {
      geology: ['NASA maps volcanic pyroclastic mantling and basaltic flows in the Aristarchus region.', 'pyroclastic basalt volcanic'],
      terrain: ['Sinuous rilles, crater margins and volcanic relief create complex routing challenges.', 'lava-flow steep rough'],
      thermal: ['Airless day/night heat extremes demand instrument thermal testing beyond any Earth field match.', 'hot dry-swings'],
      resources: ['Pyroclastic material and possible volcanic volatiles motivate resource characterization, not proven ore.', 'volcanic-rock regolith'],
      dust: ['Loose pyroclastic material and abrasive grains motivate handling tests, not lunar wind analogs.', 'volcanic-fragments grit loose-grains'],
      biology: ['No confirmed indigenous life; field tests can validate sample cleanliness.', 'sampling-control biosignature-tests'],
      subsurface: ['Sinuous rilles suggest volcanic channels/collapse; their cavities are not verified at this map point.', 'lava-tube cave subsurface-sampling'],
      operations: ['Rover imaging, vent stratigraphy, sample handling and rough route planning.', 'rover sampling rough-route']
    }, 'The actual lunar pyroclastic chemistry, vacuum, reduced gravity and dust charging are different from Earth.'),
];

export const DEFAULT_WEIGHTS = Object.fromEntries(DOMAINS.map(domain => [domain.id, domain.defaultWeight]));
export const getTarget = (world, id) => TARGETS.find(target => target.world === world && target.id === id) || TARGETS.find(target => target.world === world);
export const getEarthAnalog = id => EARTH_ANALOGS.find(site => site.id === id) || EARTH_ANALOGS[0];
