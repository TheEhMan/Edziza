// Pure JavaScript terrain metrics; no external dependencies.
// Sampling: square grid in metre-based local coordinates.
// Elevation is in metres and spacingMeters is the same in x and y.

export function percentile(values, p) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) throw new Error('Cannot calculate percentile without valid measurements.');
  const index = (sorted.length - 1) * p;
  const low = Math.floor(index);
  const t = index - low;
  return sorted[low] * (1 - t) + sorted[Math.min(low + 1, sorted.length - 1)] * t;
}

export function terrainMetrics(grid, spacingMeters) {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  if (rows < 5 || cols < 5 || !Number.isFinite(spacingMeters) || spacingMeters <= 0) {
    throw new Error('The elevation grid must be at least 5x5 with positive spacing.');
  }
  if (grid.some(row => row.length !== cols)) throw new Error('The elevation grid must be rectangular.');

  const elevations = grid.flat().filter(Number.isFinite);
  const completeness = elevations.length / (rows * cols);
  if (completeness < 0.98) {
    throw new Error(`Insufficient valid elevation data: ${(100 * completeness).toFixed(1)}%.`);
  }

  const slopes = [];
  const residualSquares = [];
  for (let r = 1; r < rows - 1; r++) {
    for (let c = 1; c < cols - 1; c++) {
      const nearby = [];
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) nearby.push(grid[r + dy][c + dx]);
      }
      if (!nearby.every(Number.isFinite)) continue;
      // Central finite differences: change in elevation / horizontal metres.
      const dzdx = (grid[r][c + 1] - grid[r][c - 1]) / (2 * spacingMeters);
      const dzdy = (grid[r - 1][c] - grid[r + 1][c]) / (2 * spacingMeters);
      slopes.push(Math.atan(Math.hypot(dzdx, dzdy)) * 180 / Math.PI);
      // Small-scale topographic deviation from the local 3x3 mean.
      const localMean = nearby.reduce((a, b) => a + b, 0) / nearby.length;
      residualSquares.push((grid[r][c] - localMean) ** 2);
    }
  }
  if (slopes.length < 50) throw new Error('Too few valid local slope measurements.');
  const mean = list => list.reduce((a, b) => a + b, 0) / list.length;
  return {
    meanSlopeDegrees: mean(slopes),
    p90SlopeDegrees: percentile(slopes, 0.90),
    rmsRoughnessMetres: Math.sqrt(mean(residualSquares)),
    elevationVariationMetres: percentile(elevations, 0.95) - percentile(elevations, 0.05),
    validCells: elevations.length,
    totalCells: rows * cols,
    slopeSamples: slopes.length
  };
}

export const SCORING = Object.freeze({
  weights: { slope: 0.45, roughness: 0.35, variation: 0.20 },
  // Engineering tolerances chosen by this project; NOT NASA standards.
  tolerances: {
    meanSlopeDegrees: 6,
    p90SlopeDegrees: 10,
    rmsRoughnessMetres: 80,
    elevationVariationMetres: 600
  }
});

export function matchScore(earth, mars) {
  const t = SCORING.tolerances;
  const similarity = (a, b, tolerance) => Math.max(0, 100 * (1 - Math.abs(a - b) / tolerance));
  const slope = 0.6 * similarity(earth.meanSlopeDegrees, mars.meanSlopeDegrees, t.meanSlopeDegrees)
    + 0.4 * similarity(earth.p90SlopeDegrees, mars.p90SlopeDegrees, t.p90SlopeDegrees);
  const roughness = similarity(earth.rmsRoughnessMetres, mars.rmsRoughnessMetres, t.rmsRoughnessMetres);
  const variation = similarity(earth.elevationVariationMetres, mars.elevationVariationMetres, t.elevationVariationMetres);
  const total = SCORING.weights.slope * slope + SCORING.weights.roughness * roughness
    + SCORING.weights.variation * variation;
  return { total, components: { slope, roughness, variation } };
}

export function squareFootprint(center, widthKm, radiusMPerDegree = 111195) {
  const half = widthKm * 500;
  const dlat = half / radiusMPerDegree;
  const dlon = half / (radiusMPerDegree * Math.cos(center.lat * Math.PI / 180));
  const west = center.lon - dlon;
  const east = center.lon + dlon;
  const north = center.lat + dlat;
  const south = center.lat - dlat;
  return { west, east, north, south, geometry: {
    type: 'Polygon',
    coordinates: [[[west, south], [east, south], [east, north], [west, north], [west, south]]]
  }};
}

export function gridCoordinates(center, gridCount, cellMetres, planetRadiusMetres) {
  const metresPerDegree = (2 * Math.PI * planetRadiusMetres) / 360;
  const half = (gridCount - 1) / 2;
  return Array.from({ length: gridCount }, (_, r) =>
    Array.from({ length: gridCount }, (_, c) => {
      const y = (half - r) * cellMetres;
      const x = (c - half) * cellMetres;
      const lat = center.lat + y / metresPerDegree;
      const lon = center.lon + x / (metresPerDegree * Math.cos(center.lat * Math.PI / 180));
      return { lat, lon };
    })
  );
}
