import { readFile, writeFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const queue = JSON.parse(await readFile(new URL('data/search-queue.json', root), 'utf8'));
const now = new Date();
const scheduling = queue.scheduling ?? {};
const batchSize = Number.isInteger(scheduling.workerBatchSize) ? scheduling.workerBatchSize : 50;
const priorityQuota = Number.isInteger(scheduling.priorityQuotaPerRun) ? scheduling.priorityQuotaPerRun : null;
const coverageQuota = Number.isInteger(scheduling.coverageQuotaPerRun) ? scheduling.coverageQuotaPerRun : null;

const dueAt = (job) => {
  if (!job.lastSearchedAt) return 0;
  const last = Date.parse(job.lastSearchedAt);
  if (!Number.isFinite(last)) return 0;
  return last + (Number(job.cadenceHours) || 24) * 60 * 60 * 1000;
};
const isDue = (job) => dueAt(job) <= now.getTime();
const sortDue = (a, b) => {
  const ad = dueAt(a);
  const bd = dueAt(b);
  if (ad !== bd) return ad - bd;
  return String(a.id).localeCompare(String(b.id));
};

const due = (queue.jobs ?? []).filter(isDue);
const priority = due.filter((job) => job.priority).sort(sortDue);
const coverage = due.filter((job) => !job.priority).sort(sortDue);
const selected = [];
const selectedIds = new Set();
const take = (pool, count) => {
  for (const job of pool) {
    if (selected.length >= batchSize || count <= 0) break;
    if (selectedIds.has(job.id)) continue;
    selected.push(job);
    selectedIds.add(job.id);
    count -= 1;
  }
};

if (priorityQuota !== null && coverageQuota !== null) {
  take(priority, Math.min(priorityQuota, batchSize));
  take(coverage, Math.min(coverageQuota, batchSize - selected.length));
  if (selected.length < batchSize) take(priority, batchSize - selected.length);
  if (selected.length < batchSize) take(coverage, batchSize - selected.length);
} else {
  take(priority, batchSize);
  if (selected.length < batchSize) take(coverage, batchSize - selected.length);
}

const output = {
  selectedAt: now.toISOString(),
  queueGeneratedAt: queue.generatedAt ?? null,
  dueCount: due.length,
  priorityDueCount: priority.length,
  coverageDueCount: coverage.length,
  batchSize,
  priorityQuotaPerRun: priorityQuota,
  coverageQuotaPerRun: coverageQuota,
  selectedCount: selected.length,
  jobs: selected.map((job) => ({
    id: job.id,
    modelId: job.modelId,
    make: job.make,
    model: job.model,
    variant: job.variant,
    source: job.source,
    sourceName: job.sourceName,
    query: job.query,
    priority: Boolean(job.priority),
    cadenceHours: job.cadenceHours,
    lastSearchedAt: job.lastSearchedAt ?? null,
    dueAt: dueAt(job) === 0 ? null : new Date(dueAt(job)).toISOString(),
  })),
};

await writeFile(new URL('data/next-worker-batch.json', root), `${JSON.stringify(output, null, 2)}\n`);
console.log(`Selected ${selected.length} jobs from ${due.length} due jobs.`);
