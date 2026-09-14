import { readFile, writeFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = async (path) => JSON.parse(await readFile(new URL(path, root), 'utf8'));
const [queue, worker] = await Promise.all([
  read('data/discovery-queue.json'),
  read('data/worker-candidates.json'),
]);

const canonical = (value) => {
  try {
    const url = new URL(value);
    url.hash = '';
    url.searchParams.sort();
    return url.toString().replace(/\/$/, '');
  } catch {
    return String(value).replace(/\/$/, '');
  }
};

const blockedHosts = new Set([
  'wikipedia.org','en.wikipedia.org','fr.wikipedia.org','de.wikipedia.org','it.wikipedia.org',
  'reddit.com','www.reddit.com','youtube.com','www.youtube.com','youtu.be',
  'manuals.plus','www.manuals.plus','theclassicvaluer.com','www.theclassicvaluer.com',
]);
const blockedExtensions = /\.(pdf|docx?|xlsx?|pptx?)(?:$|[?#])/i;
const blockedPathTerms = /\b(buying-guide|buyers-guide|price-guide|brochure|manual|wikipedia|forum|news|article|roadtest|road-test|values?)\b/i;

function plausibleAdvertUrl(value) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (!['http:','https:'].includes(url.protocol)) return false;
    if (blockedHosts.has(host)) return false;
    if (blockedExtensions.test(url.pathname)) return false;
    if (blockedPathTerms.test(url.pathname)) return false;
    return true;
  } catch {
    return false;
  }
}

// Keep the verification queue focused on things that could actually be adverts.
// Old noisy discovery results are pruned as well as new worker candidates.
for (const group of queue) {
  group.urls = (group.urls ?? []).filter(plausibleAdvertUrl);
}

const known = new Set();
for (const group of queue) {
  for (const url of group.urls ?? []) known.add(canonical(url));
}

const grouped = new Map();
for (const candidate of worker.candidates ?? []) {
  if (candidate.status !== 'verification-pending' || !candidate.url || !candidate.modelId) continue;
  if (!plausibleAdvertUrl(candidate.url)) continue;
  const key = canonical(candidate.url);
  if (known.has(key)) continue;
  known.add(key);
  const list = grouped.get(candidate.modelId) ?? [];
  list.push(candidate.url);
  grouped.set(candidate.modelId, list);
}

for (const [modelId, urls] of grouped) {
  queue.push({
    modelIds: [modelId],
    urls,
    status: 'Queue worker candidate adverts; full current-status, photo and specification verification required before publication',
    discoveredAt: worker.updatedAt ?? new Date().toISOString(),
  });
}

await writeFile(new URL('data/discovery-queue.json', root), `${JSON.stringify(queue, null, 2)}\n`);
console.log(`Merged ${[...grouped.values()].reduce((sum, urls) => sum + urls.length, 0)} new candidate advert URLs after advert-quality filtering.`);
