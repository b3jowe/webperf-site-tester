import { spawn } from 'node:child_process';

export const IMAGE = process.env.WEBPERF_IMAGE ?? 'webperfse/webperf-core:latest';
const RUNNER_DIR = '/usr/src/runner';
const CONTAINER_OUTPUT = `${RUNNER_DIR}/output`;
// Gäller per körning (ett test eller Sitespeed-pluginerna tillsammans), inte per jobb
const TIMEOUT_MS = Number(process.env.WEBPERF_TIMEOUT_MIN ?? 15) * 60 * 1000;

const exitsCleanly = (args) => new Promise((resolve) => {
  const proc = spawn('docker', args, { stdio: 'ignore' });
  proc.on('error', () => resolve(false));
  proc.on('close', (code) => resolve(code === 0));
});

export const getDockerStatus = async () => {
  const docker = await exitsCleanly(['info', '--format', '{{.ServerVersion}}']);
  const image = docker && await exitsCleanly(['image', 'inspect', IMAGE]);
  return { docker, image, imageName: IMAGE };
};

export const stopContainer = (name) => exitsCleanly(['kill', name]);

// Kör webperf_core i en engångscontainer och skriver outputFile till jobDir.
// Parametrarna för minne följer webperf_core:s egen GitHub Action.
export const runWebperf = ({ name, jobDir, outputFile, url, tests, language, mobile, onOutput }) =>
  new Promise((resolve, reject) => {
    const args = [
      'run', '--rm',
      '--name', name,
      '--shm-size=4g',
      '-e', 'MAX_OLD_SPACE_SIZE=3000',
      '-v', `${jobDir}:${CONTAINER_OUTPUT}`,
      '-w', RUNNER_DIR,
      IMAGE,
      'python3', 'default.py',
      '-u', url,
      '-t', tests.join(','),
      '-L', language,
      '-o', `${CONTAINER_OUTPUT}/${outputFile}`
    ];
    if (mobile) {
      args.push('-m');
    }

    let timedOut = false;
    const proc = spawn('docker', args);
    const timer = setTimeout(() => {
      timedOut = true;
      onOutput(`\nAvbryter: körningen tog längre än ${TIMEOUT_MS / 60000} minuter.\n`);
      stopContainer(name);
    }, TIMEOUT_MS);

    proc.stdout.on('data', (chunk) => onOutput(chunk.toString()));
    proc.stderr.on('data', (chunk) => onOutput(chunk.toString()));
    proc.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
    proc.on('close', (code) => {
      clearTimeout(timer);
      resolve({ code, timedOut });
    });
  });
