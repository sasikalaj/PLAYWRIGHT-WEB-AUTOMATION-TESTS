import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const resultsPath = 'test-results/results.json';
if (!fs.existsSync(resultsPath)) process.exit(0);

const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));

// Collect failed tests with error messages
function collectFailedTests(suites: any[]): any[] {
  const failed: any[] = [];
  for (const suite of suites) {
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        if (test.status === 'unexpected') {
          const lastResult = test.results.at(-1);
          const error = lastResult?.error?.message ?? 'Unknown error';
          failed.push({
            title: spec.title,
            error: error.split('\n')[0], // first line only
          });
        }
      }
    }
    failed.push(...collectFailedTests(suite.suites ?? []));
  }
  return failed;
}

const failedTests = collectFailedTests(results.suites ?? []);

if (failedTests.length === 0) {
  console.log('No failures — skipping log push');
  process.exit(0);
}

// Env vars
const LOKI_URL = process.env.GRAFANA_LOKI_URL!;
const LOKI_USER = process.env.GRAFANA_LOKI_USER!;
const GRAFANA_API_KEY = process.env.GRAFANA_API_KEY!;

if (!LOKI_URL || !LOKI_USER || !GRAFANA_API_KEY) {
  console.warn('Loki env vars not set — skipping');
  process.exit(0);
}

const suite = process.env.SUITE ?? 'smoke';
const branch = process.env.GITHUB_REF_NAME ?? 'local';
const run = process.env.GITHUB_RUN_NUMBER ?? '0';

const timestampNs = (BigInt(Date.now()) * 1_000_000n).toString();

// Build Loki payload
const payload = {
  streams: [
    {
      stream: {
        suite,
        branch,
        run,
        level: 'error',
        job: 'playwright',
      },
      values: failedTests.map((t) => [timestampNs, `${t.title} — ${t.error}`]),
    },
  ],
};

const auth = Buffer.from(`${LOKI_USER}:${GRAFANA_API_KEY}`).toString('base64');

const response = await fetch(LOKI_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Basic ${auth}`,
  },
  body: JSON.stringify(payload),
});

if (!response.ok) {
  const text = await response.text();
  console.error(`Loki push failed [${response.status}]: ${text}`);
  process.exit(1);
}

console.log(`Loki push OK — pushed ${failedTests.length} failed test logs`);
