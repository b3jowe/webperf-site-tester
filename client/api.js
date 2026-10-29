const request = async (path, options = {}) => {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? `Anropet misslyckades (${response.status})`);
  }
  return response.status === 204 ? null : response.json();
};

export const fetchStatus = () => request('/api/status');
export const fetchTests = () => request('/api/tests');
export const fetchJobs = () => request('/api/jobs');
export const fetchJob = (id) => request(`/api/jobs/${id}`);
export const createJob = (job) => request('/api/jobs', { method: 'POST', body: JSON.stringify(job) });
export const cancelJob = (id) => request(`/api/jobs/${id}/cancel`, { method: 'POST' });
