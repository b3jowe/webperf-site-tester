import { useCallback, useEffect, useState } from 'react';
import { fetchJobs, fetchStatus, fetchTests } from './api.js';
import { usePolling } from './usePolling.js';
import DockerStatus from './components/DockerStatus.jsx';
import JobDetail from './components/JobDetail.jsx';
import JobForm from './components/JobForm.jsx';
import JobList from './components/JobList.jsx';

const App = () => {
  const [catalog, setCatalog] = useState(null);
  const [status, setStatus] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    fetchTests().then(setCatalog).catch(() => setCatalog(null));
    fetchStatus().then(setStatus).catch(() => setStatus(null));
  }, []);

  const loadJobs = useCallback(() => {
    fetchJobs().then(setJobs).catch(() => {});
  }, []);

  usePolling(loadJobs, 3000);

  const handleCreated = (job) => {
    setJobs((current) => [job, ...current]);
    setSelectedId(job.id);
  };

  const testNames = Object.fromEntries((catalog?.tests ?? []).map((test) => [test.id, test.name]));

  return (
    <div className="b3-app">
      <header className="b3-app__header">
        <h1 className="b3-app__title">Webperf-tester</h1>
        <p className="b3-app__lead">
          Kör samma tester som <a href="https://webperf.se">webperf.se</a> via webperf_core.
        </p>
      </header>

      <DockerStatus status={status} />

      <main className="b3-app__main">
        <div className="b3-app__sidebar">
          {catalog && <JobForm catalog={catalog} onCreated={handleCreated} />}
          <JobList jobs={jobs} selectedId={selectedId} onSelect={setSelectedId} />
        </div>
        <div className="b3-app__content">
          {selectedId ? (
            <JobDetail key={selectedId} jobId={selectedId} testNames={testNames} />
          ) : (
            <p className="b3-app__empty">Starta ett test eller välj ett tidigare jobb i listan.</p>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
