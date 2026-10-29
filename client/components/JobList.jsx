import StatusBadge from './StatusBadge.jsx';

const formatDate = (iso) => new Date(iso).toLocaleString('sv-SE', { dateStyle: 'short', timeStyle: 'short' });

const JobList = ({ jobs, selectedId, onSelect }) => (
  <section className="b3-job-list" aria-labelledby="b3-job-list-title">
    <h2 id="b3-job-list-title" className="b3-job-list__title">Historik</h2>
    {jobs.length === 0 ? (
      <p className="b3-job-list__empty">Inga körda tester än.</p>
    ) : (
      <ul className="b3-job-list__items">
        {jobs.map((job) => (
          <li key={job.id}>
            <button
              type="button"
              className={`b3-job-list__item${job.id === selectedId ? ' b3-job-list__item--selected' : ''}`}
              aria-current={job.id === selectedId ? 'true' : undefined}
              onClick={() => onSelect(job.id)}
            >
              <span className="b3-job-list__url">{job.url}</span>
              <span className="b3-job-list__meta">
                <StatusBadge status={job.status} />
                <span>{formatDate(job.createdAt)}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    )}
  </section>
);

export default JobList;
