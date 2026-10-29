import { useCallback, useState } from 'react';
import { cancelJob, fetchJob } from '../api.js';
import { usePolling } from '../usePolling.js';
import Rating from './Rating.jsx';
import StatusBadge from './StatusBadge.jsx';

const RATING_LABELS = {
  overall: 'Totalt',
  security: 'Säkerhet och integritet',
  performance: 'Prestanda',
  a11y: 'Tillgänglighet',
  standards: 'Standarder'
};

const isActive = (job) => !job || ['queued', 'running'].includes(job.status);

const ResultCard = ({ result }) => {
  const reports = Object.entries(RATING_LABELS).filter(([key]) => result.reports[key]);

  return (
    <article className="b3-result">
      <h3 className="b3-result__title">{result.testName}</h3>
      <div className="b3-result__ratings">
        {Object.entries(RATING_LABELS).map(([key, label]) => (
          <Rating key={key} label={label} value={result.ratings[key]} />
        ))}
      </div>
      {reports.map(([key, label], index) => (
        <details key={key} className="b3-result__report" open={index === 0}>
          <summary>{label}</summary>
          <pre className="b3-result__text">{result.reports[key]}</pre>
        </details>
      ))}
    </article>
  );
};

const JobDetail = ({ jobId, testNames }) => {
  const [job, setJob] = useState(null);
  const [error, setError] = useState('');

  const loadJob = useCallback(() => {
    fetchJob(jobId).then(setJob).catch((loadError) => setError(loadError.message));
  }, [jobId]);

  usePolling(loadJob, 3000, isActive(job));

  const handleCancel = async () => {
    try {
      await cancelJob(jobId);
      loadJob();
    } catch (cancelError) {
      setError(cancelError.message);
    }
  };

  if (error) {
    return <p className="b3-job-detail__error" role="alert">{error}</p>;
  }
  if (!job) {
    return <p>Laddar…</p>;
  }

  return (
    <section className="b3-job-detail" aria-labelledby="b3-job-detail-title">
      <header className="b3-job-detail__header">
        <h2 id="b3-job-detail-title" className="b3-job-detail__title">{job.url}</h2>
        <div className="b3-job-detail__meta" aria-live="polite">
          <StatusBadge status={job.status} />
          {job.queuePosition && <span>Plats {job.queuePosition} i kön</span>}
          {job.status === 'running' && <span>Det kan ta flera minuter.</span>}
        </div>
        {job.parts ? (
          <ul className="b3-job-detail__parts">
            {job.parts.map((part) => (
              <li key={part.index} className="b3-job-detail__part">
                <StatusBadge status={part.status} />
                <span>{part.tests.map((id) => testNames[id] ?? `Test ${id}`).join(', ')}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="b3-job-detail__tests">
            {job.tests.map((id) => testNames[id] ?? `Test ${id}`).join(', ')}
          </p>
        )}
        {isActive(job) && (
          <button type="button" className="b3-button" onClick={handleCancel}>Avbryt</button>
        )}
      </header>

      {job.error && <p className="b3-job-detail__error" role="alert">{job.error}</p>}

      {job.results.map((result) => (
        <ResultCard key={result.testId} result={result} />
      ))}

      {job.log && (
        <details className="b3-job-detail__log" open={isActive(job)}>
          <summary>Logg</summary>
          <pre className="b3-result__text">{job.log}</pre>
        </details>
      )}
    </section>
  );
};

export default JobDetail;
