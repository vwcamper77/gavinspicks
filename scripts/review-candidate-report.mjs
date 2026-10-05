import {readFile, rename, writeFile} from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const candidateUrl = new URL('data/worker-candidates.json', root);
const modelUrl = new URL('data/models.json', root);
const stateUrl = new URL('data/review-candidate-report-state.json', root);

const candidatesSource = JSON.parse(await readFile(candidateUrl, 'utf8'));
const models = JSON.parse(await readFile(modelUrl, 'utf8'));
let previous = null;
try {
  previous = JSON.parse(await readFile(stateUrl, 'utf8'));
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
}

function canonicalUrl(value) {
  try {
    const url = new URL(value);
    url.hash = '';
    url.search = '';
    url.hostname = url.hostname.toLowerCase().replace(/^www\./, '');
    url.pathname = url.pathname.replace(/\/+$/, '') || '/';
    return url.toString();
  } catch {
    return String(value || '').trim();
  }
}

function askingPrice(candidate) {
  if (Number.isFinite(candidate.price)) return candidate.price;
  const evidence = [candidate.vehicleIdentity, candidate.note, candidate.title].filter(Boolean).join(' ');
  const match = evidence.match(/£\s?([\d,]+)/);
  return match ? Number(match[1].replaceAll(',', '')) : null;
}

const modelById = new Map(models.map(model => [model.id, model]));
function label(candidate) {
  if (candidate.vehicleIdentity) return candidate.vehicleIdentity.split('|').slice(0, 2).join('|').trim();
  if (candidate.title && !/^Used \d{4}\b/i.test(candidate.title)) return candidate.title;
  const model = modelById.get(candidate.modelId);
  return model ? `${model.make} ${model.name}` : 'Unlabelled candidate advert';
}

const byCanonicalUrl = new Map();
for (const candidate of candidatesSource.candidates ?? []) {
  if (candidate.status !== 'verification-pending') continue;
  const canonical = canonicalUrl(candidate.url);
  if (!canonical) continue;
  const existing = byCanonicalUrl.get(canonical);
  if (!existing || Date.parse(candidate.discoveredAt || 0) > Date.parse(existing.discoveredAt || 0)) {
    byCanonicalUrl.set(canonical, candidate);
  }
}

const previousUrls = new Set(previous?.lastReportedCanonicalUrls ?? []);
const pending = [...byCanonicalUrl.entries()].map(([canonicalUrl, candidate]) => ({canonicalUrl, candidate}));
const newCandidates = pending.filter(item => !previousUrls.has(item.canonicalUrl));
const useful = newCandidates
  .filter(({candidate}) => {
    const price = askingPrice(candidate);
    const year = Number.isInteger(candidate.year)
      ? candidate.year
      : Number(String(candidate.vehicleIdentity || candidate.title || candidate.note || '').match(/\b((?:19|20)\d{2})\b/)?.[1]);
    return candidate.modelId !== 'model-070' && candidate.modelId !== 'model-072' &&
      price !== null && price >= 10000 && price <= 100000 &&
      (!Number.isFinite(year) || (year >= 1995 && year <= 2010)) &&
      !/\b(?:3|4|three|four)[\s/-]*speed\b/i.test(candidate.gearbox || '');
  })
  .map(({canonicalUrl, candidate}) => ({
    canonicalUrl,
    label: label(candidate),
    askingPrice: askingPrice(candidate),
    discoveredAt: candidate.discoveredAt ?? null,
    source: candidate.source ?? null,
  }))
  .filter(item => !/(sensor|battery|brake discs|pads|\bparts?\b)/i.test(item.label))
  .sort((a, b) => Date.parse(b.discoveredAt || 0) - Date.parse(a.discoveredAt || 0))
  .slice(0, 8);

const now = new Date().toISOString();
const nextState = {
  version: 1,
  lastReportedAt: now,
  sourceUpdatedAt: candidatesSource.updatedAt,
  pendingCount: pending.length,
  lastReportedCanonicalUrls: pending.map(item => item.canonicalUrl).sort(),
};

if (process.argv.includes('--write')) {
  const temporary = new URL(`data/review-candidate-report-state-${process.pid}.tmp`, root);
  await writeFile(temporary, `${JSON.stringify(nextState, null, 2)}\n`);
  await rename(temporary, stateUrl);
}

console.log(JSON.stringify({
  baselineEstablished: previous === null,
  sourceUpdatedAt: candidatesSource.updatedAt,
  totalPending: pending.length,
  newlyUnreported: newCandidates.length,
  usefulSelection: useful,
  stateWritten: process.argv.includes('--write'),
}, null, 2));
