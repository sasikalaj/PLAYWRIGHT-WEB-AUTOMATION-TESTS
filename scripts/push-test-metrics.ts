import fs from 'fs';
import protobuf from 'protobufjs';
import snappy from 'snappyjs';

import dotenv from 'dotenv';
dotenv.config();

// ─── Load results ────────────────────────────────────────────────────────────

const resultsPath = 'test-results/results.json';

if (!fs.existsSync(resultsPath)) {
  console.warn('No results.json found — skipping metrics push');
  process.exit(0);
}

const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));

// ─── Collect all leaf tests across nested suites ──────────────────────────────

interface TestResult {
  status: string;
  duration: number;
}

interface Test {
  projectName: string;
  status: string; // 'expected' | 'unexpected' | 'flaky' | 'skipped'
  results: TestResult[];
}

interface Spec {
  tests: Test[];
}

interface Suite {
  specs?: Spec[];
  suites?: Suite[];
}

function collectTests(suites: Suite[]): Test[] {
  const tests: Test[] = [];
  for (const suite of suites) {
    for (const spec of suite.specs ?? []) {
      tests.push(...spec.tests);
    }
    tests.push(...collectTests(suite.suites ?? []));
  }
  return tests;
}

const allTests = collectTests(results.suites ?? []);

console.log(`Collected ${allTests.length} tests from results.json`);

// ─── Overall metrics ──────────────────────────────────────────────────────────

let maxTestDuration = 0;
for (const test of allTests) {
  const lastResult = test.results.at(-1);
  if (lastResult && lastResult.duration > maxTestDuration) {
    maxTestDuration = lastResult.duration;
  }
}

const metrics = {
  passed: results.stats.expected ?? 0,
  failed: results.stats.unexpected ?? 0,
  flaky: results.stats.flaky ?? 0,
  skipped: results.stats.skipped ?? 0,
  total: allTests.length ?? 0,
  duration_ms: results.stats.duration ?? 0,
  max_test_duration_ms: maxTestDuration,
};

// ─── Per-project metrics ──────────────────────────────────────────────────────

interface ProjectStats {
  passed: number;
  failed: number;
  flaky: number;
  skipped: number;
  total: number;
}

const byProject = new Map<string, ProjectStats>();

for (const test of allTests) {
  const project = test.projectName || 'default';
  if (!byProject.has(project)) {
    byProject.set(project, { passed: 0, failed: 0, flaky: 0, skipped: 0, total: 0 });
  }
  const s = byProject.get(project)!;
  s.total++;
  if (test.status === 'expected') s.passed++;
  else if (test.status === 'unexpected') s.failed++;
  else if (test.status === 'flaky') s.flaky++;
  else if (test.status === 'skipped') s.skipped++;
}

// ─── Env vars ────────────────────────────────────────────────────────────────

const GRAFANA_PROM_URL = process.env.GRAFANA_PROM_URL!; // Prometheus remote write URL
const GRAFANA_USER = process.env.GRAFANA_USER!; // numeric stack ID
const GRAFANA_API_KEY = process.env.GRAFANA_API_KEY!; // API token

if (!GRAFANA_PROM_URL || !GRAFANA_USER || !GRAFANA_API_KEY) {
  console.warn('Grafana env vars not set — skipping metrics push');
  process.exit(0);
}

const suite = process.env.SUITE ?? 'smoke';
const branch = process.env.GITHUB_REF_NAME ?? 'local';
const run = process.env.GITHUB_RUN_NUMBER ?? '0';

// ─── Prometheus protobuf schema ───────────────────────────────────────────────
// Matches https://github.com/prometheus/prometheus/blob/main/prompb/types.proto

const proto = `
  syntax = "proto3";
  package prometheus;

  message WriteRequest {
    repeated TimeSeries timeseries = 1;
  }

  message TimeSeries {
    repeated Label  labels  = 1;
    repeated Sample samples = 2;
  }

  message Label {
    string name  = 1;
    string value = 2;
  }

  message Sample {
    double value     = 1;
    int64  timestamp = 2;
  }
`;

// ─── Build WriteRequest payload ───────────────────────────────────────────────

const root = protobuf.parse(proto).root;
const WriteRequest = root.lookupType('prometheus.WriteRequest');

const timestamp = Date.now(); // milliseconds

// Each metric becomes a separate TimeSeries with its own __name__ label
const commonLabels = [
  { name: 'suite', value: suite },
  { name: 'branch', value: branch },
  { name: 'run', value: run },
];

// Overall metrics — one series each, no project label
const timeseries = Object.entries(metrics).map(([name, value]) => ({
  labels: [
    { name: '__name__', value: `playwright_${name}` }, // e.g. playwright_passed
    ...commonLabels,
  ],
  samples: [{ value, timestamp }],
}));

// Per-project metrics — adds a `project` label so you can fan-out in Grafana
for (const [projectName, s] of byProject) {
  const projectLabels = [...commonLabels, { name: 'project', value: projectName }];
  for (const [stat, value] of Object.entries(s) as [string, number][]) {
    timeseries.push({
      labels: [{ name: '__name__', value: `playwright_project_${stat}` }, ...projectLabels],
      samples: [{ value, timestamp }],
    });
  }
}

// Encode to protobuf binary
const message = WriteRequest.create({ timeseries });
const encoded = WriteRequest.encode(message).finish();

// ─── Snappy compress ──────────────────────────────────────────────────────────
// Prometheus remote write requires snappy block compression (not framing)

const compressed = snappy.compress(Buffer.from(encoded));

// ─── Push to Grafana Cloud ────────────────────────────────────────────────────

const auth = Buffer.from(`${GRAFANA_USER}:${GRAFANA_API_KEY}`).toString('base64');

const response = await fetch(GRAFANA_PROM_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-protobuf', // binary protobuf
    'X-Prometheus-Remote-Write-Version': '0.1.0', // required header
    'Content-Encoding': 'snappy', // compressed
    Authorization: `Basic ${auth}`,
  },
  body: compressed,
});

if (!response.ok) {
  const text = await response.text();
  console.error(`Grafana push failed [${response.status}]: ${text}`);
  process.exit(1);
}

console.log(
  `Grafana push OK [${response.status}] — suite=${suite} passed=${metrics.passed} failed=${metrics.failed} flaky=${metrics.flaky} total=${metrics.total}`
);
