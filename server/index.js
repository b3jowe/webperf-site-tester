import express from 'express';
import path from 'node:path';
import { getDockerStatus } from './docker.js';
import { cancelJob, createJob, getJob, listJobs, loadJobs } from './jobs.js';
import { DEFAULT_TESTS, isValidTestId, LANGUAGES, TESTS } from './tests.js';

const PORT = Number(process.env.PORT ?? 3000);
// Servern startar Docker-containrar, så den lyssnar bara lokalt om inget annat anges
const HOST = process.env.HOST ?? '127.0.0.1';
const isProduction = process.argv.includes('--production') || process.env.NODE_ENV === 'production';

const parseUrl = (value) => {
  try {
    const url = new URL(String(value).trim());
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
};

const app = express();
app.use(express.json());

app.get('/api/status', async (req, res) => {
  res.json(await getDockerStatus());
});

app.get('/api/tests', (req, res) => {
  res.json({ tests: TESTS, defaultTests: DEFAULT_TESTS, languages: LANGUAGES });
});

app.get('/api/jobs', (req, res) => {
  res.json(listJobs());
});

app.post('/api/jobs', async (req, res) => {
  const { url, tests, language = 'sv', mobile = false } = req.body ?? {};
  const parsedUrl = parseUrl(url);
  const testIds = Array.isArray(tests) ? [...new Set(tests.map(Number))] : [];

  if (!parsedUrl) {
    return res.status(400).json({ error: 'Ange en giltig http- eller https-adress.' });
  }
  if (testIds.length === 0 || !testIds.every(isValidTestId)) {
    return res.status(400).json({ error: 'Välj minst ett giltigt test.' });
  }
  if (!LANGUAGES.includes(language)) {
    return res.status(400).json({ error: 'Språket stöds inte.' });
  }

  const job = await createJob({ url: parsedUrl, tests: testIds, language, mobile: Boolean(mobile) });
  res.status(201).json(job);
});

app.get('/api/jobs/:id', async (req, res) => {
  const job = await getJob(req.params.id);
  return job ? res.json(job) : res.status(404).json({ error: 'Jobbet finns inte.' });
});

app.post('/api/jobs/:id/cancel', async (req, res) => {
  const cancelled = await cancelJob(req.params.id);
  return cancelled ? res.status(204).end() : res.status(409).json({ error: 'Jobbet kan inte avbrytas.' });
});

if (isProduction) {
  const distDir = path.resolve('dist');
  app.use(express.static(distDir));
  app.use((req, res) => res.sendFile(path.join(distDir, 'index.html')));
} else {
  const { createServer } = await import('vite');
  const vite = await createServer({ server: { middlewareMode: true }, appType: 'spa' });
  app.use(vite.middlewares);
}

await loadJobs();
app.listen(PORT, HOST, () => {
  console.log(`webperf-tester körs på http://${HOST}:${PORT}`);
});
