import { randomUUID } from 'node:crypto';
import { appendFile, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { runWebperf, stopContainer } from './docker.js';
import { SITESPEED_PLUGIN_TESTS, TESTS } from './tests.js';

const DATA_DIR = path.resolve(process.env.DATA_DIR ?? 'data/jobs');
const LOG_TAIL_LINES = 200;
const RESULT_FILE = /^result.*\.json$/;

const jobs = new Map();
const queue = [];
let running = null;

const jobDir = (id) => path.join(DATA_DIR, id);

const saveJob = (job) =>
  writeFile(path.join(jobDir(job.id), 'job.json'), JSON.stringify(job, null, 2));

const updateJob = async (job, changes) => {
  Object.assign(job, changes);
  await saveJob(job);
};

const readJson = async (file) => JSON.parse(await readFile(file, 'utf-8'));

const testName = (id) => TESTS.find((test) => test.id === id)?.name ?? `Test ${id}`;

// Varje körning skriver sin egen resultatfil, så ett test som hänger eller
// kraschar inte tar med sig resultaten från de andra testerna.
// Sitespeed-pluginerna körs ihop eftersom webperf_core kör dem i samma sitespeed.io-körning.
const splitIntoParts = (tests) => {
  const pluginTests = tests.filter((id) => SITESPEED_PLUGIN_TESTS.includes(id));
  const otherTests = tests.filter((id) => !SITESPEED_PLUGIN_TESTS.includes(id));
  return [
    ...(pluginTests.length > 0 ? [pluginTests] : []),
    ...otherTests.map((id) => [id])
  ].map((partTests, index) => ({ index, tests: partTests, status: 'queued' }));
};

// webperf_core sätter -1 när ett betyg inte är relevant för testet
const toRating = (value) => (typeof value === 'number' && value >= 0 ? value : null);

const toResult = (entry) => ({
  testId: entry.type_of_test,
  testName: testName(entry.type_of_test),
  date: entry.date,
  ratings: {
    overall: toRating(entry.rating),
    security: toRating(entry.rating_sec),
    performance: toRating(entry.rating_perf),
    a11y: toRating(entry.rating_a11y),
    standards: toRating(entry.rating_stand)
  },
  reports: {
    overall: entry.report,
    security: entry.report_sec,
    performance: entry.report_perf,
    a11y: entry.report_a11y,
    standards: entry.report_stand
  }
});

const readResults = async (id) => {
  const files = (await readdir(jobDir(id)).catch(() => [])).filter((file) => RESULT_FILE.test(file));
  const entries = await Promise.all(files.map(async (file) => {
    try {
      return (await readJson(path.join(jobDir(id), file))).tests;
    } catch {
      return [];
    }
  }));
  // type_of_test -1 är webperf_core:s sammanvägning av flera tester i samma körning
  return entries
    .flat()
    .filter((entry) => entry.type_of_test >= 0)
    .map(toResult)
    .sort((a, b) => a.testId - b.testId);
};

const readLogTail = async (id) => {
  try {
    const log = await readFile(path.join(jobDir(id), 'log.txt'), 'utf-8');
    return log.split('\n').slice(-LOG_TAIL_LINES).join('\n');
  } catch {
    return '';
  }
};

const runPart = async (job, part, logFile) => {
  const name = `webperf-${job.id}-${part.index}`;
  const outputFile = `result-${part.index}.json`;
  running = { jobId: job.id, name };
  part.status = 'running';
  await saveJob(job);
  await appendFile(logFile, `\n=== Kör ${part.tests.map(testName).join(', ')} ===\n`);

  const { code, timedOut } = await runWebperf({
    name,
    jobDir: jobDir(job.id),
    outputFile,
    url: job.url,
    tests: part.tests,
    language: job.language,
    mobile: job.mobile,
    onOutput: (text) => appendFile(logFile, text).catch(() => {})
  });

  const hasResult = await readJson(path.join(jobDir(job.id), outputFile)).then(() => true, () => false);
  if (job.status === 'cancelled') {
    part.status = 'cancelled';
  } else if (hasResult) {
    part.status = 'done';
  } else {
    part.status = 'failed';
    part.error = timedOut ? 'tidsgränsen nåddes' : `avslutades med kod ${code}`;
  }
  await saveJob(job);
};

const failedPartsMessage = (job) => job.parts
  .filter((part) => part.status === 'failed')
  .map((part) => `${part.tests.map(testName).join(', ')} (${part.error})`)
  .join('; ');

const runNext = async () => {
  if (running || queue.length === 0) {
    return;
  }
  const job = jobs.get(queue.shift());
  const logFile = path.join(jobDir(job.id), 'log.txt');
  running = { jobId: job.id, name: null };

  try {
    await updateJob(job, { status: 'running', startedAt: new Date().toISOString() });
    for (const part of job.parts) {
      if (job.status === 'cancelled') {
        part.status = 'cancelled';
        continue;
      }
      await runPart(job, part, logFile);
    }

    if (job.status === 'cancelled') {
      await updateJob(job, { finishedAt: new Date().toISOString() });
    } else {
      const failed = failedPartsMessage(job);
      const anyDone = job.parts.some((part) => part.status === 'done');
      await updateJob(job, {
        status: anyDone ? 'done' : 'failed',
        error: failed ? `Följande tester gav inget resultat: ${failed}. Se loggen.` : undefined,
        finishedAt: new Date().toISOString()
      });
    }
  } catch (error) {
    await updateJob(job, {
      status: 'failed',
      error: error.code === 'ENOENT' ? 'Hittar inte docker. Är Docker installerat?' : error.message,
      finishedAt: new Date().toISOString()
    });
  } finally {
    running = null;
    runNext();
  }
};

export const loadJobs = async () => {
  await mkdir(DATA_DIR, { recursive: true });
  for (const id of await readdir(DATA_DIR)) {
    try {
      const job = await readJson(path.join(jobDir(id), 'job.json'));
      if (job.status === 'queued' || job.status === 'running') {
        job.status = 'failed';
        job.error = 'Servern startades om innan testet blev klart.';
        await saveJob(job);
      }
      jobs.set(job.id, job);
    } catch {
      // Ignorera mappar utan giltig job.json
    }
  }
};

export const listJobs = () =>
  [...jobs.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

export const getJob = async (id) => {
  const job = jobs.get(id);
  if (!job) {
    return null;
  }
  return {
    ...job,
    queuePosition: queue.indexOf(id) + 1 || null,
    results: await readResults(id),
    log: await readLogTail(id)
  };
};

export const createJob = async ({ url, tests, language, mobile }) => {
  const job = {
    id: randomUUID(),
    url,
    tests,
    parts: splitIntoParts(tests),
    language,
    mobile,
    status: 'queued',
    createdAt: new Date().toISOString()
  };
  await mkdir(jobDir(job.id), { recursive: true });
  await saveJob(job);
  jobs.set(job.id, job);
  queue.push(job.id);
  runNext();
  return job;
};

export const cancelJob = async (id) => {
  const job = jobs.get(id);
  if (!job || !['queued', 'running'].includes(job.status)) {
    return false;
  }
  const queueIndex = queue.indexOf(id);
  if (queueIndex >= 0) {
    queue.splice(queueIndex, 1);
  }
  await updateJob(job, { status: 'cancelled', finishedAt: new Date().toISOString() });
  if (running?.jobId === id && running.name) {
    await stopContainer(running.name);
  }
  return true;
};
