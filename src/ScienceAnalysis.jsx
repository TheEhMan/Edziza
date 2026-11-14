import React, { useEffect, useState } from 'react';

function MetricCell({ label, value, unit = '' }) {
  return <div className="science-metric-cell"><span>{label}</span><strong>{Number.isFinite(value) ? `${value.toFixed(1)}${unit}` : 'Unavailable'}</strong></div>;
}

function SimilarityBar({ label, value, weight }) {
  return <div className="science-similarity-line">
    <div className="science-similarity-heading"><span>{label} <small>({Math.round(weight * 100)}% of score)</small></span><strong>{value.toFixed(1)}/100</strong></div>
    <div className="science-similarity-track"><div style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>
  </div>;
}

function CandidateCard({ site, reference, scoring, onOpenMap }) {
  const winner = site.rank === 1;
  return <article className={`science-result-card ${winner ? 'science-best' : ''}`}>
    <div className="science-result-top">
      <div><span className="science-kicker">RANK #{site.rank} / EDZIZA STUDY AREA</span><h3>{site.name}</h3>
        <p>{site.geology}</p></div>
      <div className="science-score"><strong>{site.score.toFixed(1)}</strong><span>/ 100</span></div>
    </div>
    {winner && <p className="science-winner-note">Highest-ranked terrain match of the three tested areas under these assumptions. A low score still means a weak match.</p>}
    <div className="science-breakdown">
      <SimilarityBar label="Slope similarity" value={site.components.slope} weight={scoring.weights.slope} />
      <SimilarityBar label="Roughness similarity" value={site.components.roughness} weight={scoring.weights.roughness} />
      <SimilarityBar label="Elevation-variation similarity" value={site.components.variation} weight={scoring.weights.variation} />
    </div>
    <div className="science-metrics">
      <MetricCell label="MEAN SLOPE" value={site.metrics.meanSlopeDegrees} unit=" deg" />
      <MetricCell label="STEEP SLOPE (P90)" value={site.metrics.p90SlopeDegrees} unit=" deg" />
      <MetricCell label="RMS ROUGHNESS" value={site.metrics.rmsRoughnessMetres} unit=" m" />
      <MetricCell label="ELEVATION RANGE (P95-P05)" value={site.metrics.elevationVariationMetres} unit=" m" />
    </div>
    <div className="science-result-actions">
      <button className="subtle-button" onClick={() => onOpenMap?.(site.id)}>View this study area on Earth map</button>
      <a href={site.evidence} target="_blank" rel="noreferrer">Geological evidence</a>
    </div>
  </article>;
}

export default function ScienceAnalysis({ onOpenMap }) {
  const [state, setState] = useState({ status: 'loading', data: null });
  useEffect(() => {
    const controller = new AbortController();
    fetch('/analysis-results.json', { cache: 'no-store', signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error('The analysis output has not been generated yet.');
        return response.json();
      })
      .then(data => {
        if (!data.isMeasured || !data.candidates?.length || !data.mars?.metrics) {
          throw new Error('Analysis data is incomplete or not derived from elevation measurements.');
        }
        setState({ status: 'ready', data });
      })
      .catch(error => { if (error.name !== 'AbortError') setState({ status: 'error', message: error.message }); });
    return () => controller.abort();
  }, []);

  if (state.status === 'loading') return <div className="science-info">Loading measured elevation comparisons...</div>;
  if (state.status === 'error') return <div className="science-info">
    <h2>Run your first scientific comparison</h2>
    <p>The measured results do not exist yet. In VS Code, from your project root, run:</p>
    <pre>npm install geotiff@^2{`\n`}node scripts/analyze-sites.mjs</pre>
    <p>Then refresh this page. The script downloads public Copernicus Earth elevation and samples NASA's 128-pixels-per-degree Mars topography.</p>
    <small>{state.message}</small>
  </div>;

  const data = state.data;
  const mars = data.mars.metrics;
  const weights = data.methods.scoring;
  return <div className="science-analysis">
    <section className="science-reference">
      <div><span className="science-kicker">REFERENCE TARGET / MARS</span><h2>{data.mars.name}</h2>
        <p>Selected study patch centred at {data.mars.center.lat.toFixed(2)} N, {data.mars.center.lon.toFixed(2)} E. All locations are analyzed on a {data.methods.squareWidthKm}-km square, {data.methods.sampleSpacingMetres}-m grid.</p>
        <a href={data.mars.evidence} target="_blank" rel="noreferrer">Research on glacial landforms</a>
      </div>
      <div className="science-metrics science-mars-metrics">
        <MetricCell label="MEAN SLOPE" value={mars.meanSlopeDegrees} unit=" deg" />
        <MetricCell label="STEEP SLOPE (P90)" value={mars.p90SlopeDegrees} unit=" deg" />
        <MetricCell label="RMS ROUGHNESS" value={mars.rmsRoughnessMetres} unit=" m" />
        <MetricCell label="ELEVATION RANGE (P95-P05)" value={mars.elevationVariationMetres} unit=" m" />
      </div>
    </section>
    <div className="science-results-label"><h2>Compare Edziza candidates</h2>
      <p>Scores below are calculated from real elevation data. They are relative similarities, not NASA hazard certifications.</p>
    </div>
    <div className="science-result-grid">
      {data.candidates.map(site => <CandidateCard key={site.id} site={site} reference={mars}
        scoring={weights} onOpenMap={onOpenMap} />)}
    </div>
    <section className="science-method-panel">
      <h2>How we calculate the score</h2>
      <p><strong>45% slope similarity + 35% terrain roughness similarity + 20% elevation-variation similarity.</strong> Each 0-100 component penalizes differences outside project-defined tolerances. This is a transparent screening heuristic, not an official NASA score.</p>
      <p><strong>Study resolution:</strong> {data.methods.grid} elevation samples spaced {data.methods.sampleSpacingMetres} metres, with identical physical study-area sizes. Earth uses {data.sources.earthProduct}; Mars uses MOLA at {data.sources.marsPPD} pixels/degree (about 463 metres north-south).</p>
      <p><strong>Geology is separate evidence:</strong> DEMs measure terrain shape, not whether a rock is basalt or whether ice-contact processes occurred. Review the linked NASA, Smithsonian and published research before drawing geological conclusions.</p>
      <ul>{data.methods.caveats.map(note => <li key={note}>{note}</li>)}</ul>
      <p className="science-source-links"><a href={data.sources.earthDEM.startsWith('http') ? data.sources.earthDEM : 'https://registry.opendata.aws/copernicus-dem/'} target="_blank" rel="noreferrer">Earth elevation source</a>
        <a href="https://pds-geosciences.wustl.edu/missions/mgs/megdr.html" target="_blank" rel="noreferrer">NASA MOLA data catalogue</a></p>
      <p className="science-generated">Analysis generated: {new Date(data.generatedAt).toLocaleString()}</p>
    </section>
  </div>;
}
