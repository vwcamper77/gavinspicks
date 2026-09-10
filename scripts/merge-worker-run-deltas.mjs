import { mkdir, readdir, readFile, unlink, writeFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = async (path) => JSON.parse(await readFile(new URL(path, root), 'utf8'));
const readOptional = async (path, fallback) => {
  try { return await read(path); } catch (error) {
    if (error?.code === 'ENOENT') return fallback;
    throw error;
  }
};

const canonicalUrl = (value) => {
  try {
    const url = new URL(value);
    url.hash = '';
    url.hostname = url.hostname.toLowerCase().replace(/^www\./, '');
    for (const key of [...url.searchParams.keys()]) {
      if (/^utm_/i.test(key) || ['fbclid', 'gclid', 'msclkid'].includes(key.toLowerCase())) url.searchParams.delete(key);
    }
    const query = url.searchParams.toString();
    return `${url.protocol}//${url.hostname}${url.pathname.replace(/\/$/, '')}${query ? `?${query}` : ''}`;
  } catch {
    return String(value).trim();
  }
};

await mkdir(new URL('data/worker-runs/', root), { recursive: true });
const runFiles = (await readdir(new URL('data/worker-runs/', root))).filter((name) => name.endsWith('.json')).sort();
if (!runFiles.length) {
  console.log('No worker run deltas to merge.');
  process.exit(0);
}

const state = await readOptional('data/search-job-state.json', { jobs: {} });
const worker = await readOptional('data/worker-candidates.json', { candidates: [] });
state.jobs ??= {};
worker.candidates ??= [];

const existingByUrl = new Map(worker.candidates.map((candidate, index) => [canonicalUrl(candidate.url), index]));
let newestAt = state.updatedAt ?? null;
let jobsMerged = 0;
let candidatesAdded = 0;

for (const file of runFiles) {
  const delta = await read(`data/worker-runs/${file}`);
  const createdAt = delta.createdAt ?? null;
  if (createdAt && (!newestAt || Date.parse(createdAt) > Date.parse(newestAt))) newestAt = createdAt;

  const jobs = Array.isArray(delta.jobs)
    ? Object.fromEntries(delta.jobs.filter((job) => job?.id).map(({ id, ...job }) => [id, job]))
    : (delta.jobs ?? {});
  for (const [id, result] of Object.entries(jobs)) {
    state.jobs[id] = result;
    jobsMerged += 1;
  }

  for (const candidate of delta.candidates ?? []) {
    if (!candidate?.url || !candidate?.modelId) continue;
    const key = canonicalUrl(candidate.url);
    const existingIndex = existingByUrl.get(key);
    if (existingIndex === undefined) {
      worker.candidates.push(candidate);
      existingByUrl.set(key, worker.candidates.length - 1);
      candidatesAdded += 1;
      continue;
    }
    const old = worker.candidates[existingIndex];
    worker.candidates[existingIndex] = {
      ...old,
      ...candidate,
      discoveredAt: old.discoveredAt ?? candidate.discoveredAt,
      note: candidate.note?.length >= (old.note?.length ?? 0) ? candidate.note : old.note,
    };
  }
}

state.updatedAt = newestAt ?? new Date().toISOString();
state.note = 'Cumulative worker-write state. Job results are merged from immutable run deltas and folded back into data/search-queue.json by scripts/build-search-queue.mjs.';
worker.updatedAt = newestAt ?? new Date().toISOString();

await writeFile(new URL('data/search-job-state.json', root), `${JSON.stringify(state, null, 2)}\n`);
await writeFile(new URL('data/worker-candidates.json', root), `${JSON.stringify(worker, null, 2)}\n`);
for (const file of runFiles) await unlink(new URL(`data/worker-runs/${file}`, root));

console.log(`Merged ${jobsMerged} job results and added ${candidatesAdded} new candidate URLs from ${runFiles.length} worker run delta(s).`);
