import { readFile, writeFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = async (path) => JSON.parse(await readFile(new URL(path, root), 'utf8'));
const readOptional = async (path, fallback) => {
  try { return await read(path); } catch (error) {
    if (error?.code === 'ENOENT') return fallback;
    throw error;
  }
};

const [baseModels, extraModels, config, existing] = await Promise.all([
  read('data/models.json'),
  read('data/extra-models.json'),
  read('data/discovery-sources.json'),
  readOptional('data/search-queue.json', { jobs: [] }),
]);

const models = [...baseModels, ...extraModels];
const previous = new Map((existing.jobs ?? []).map((job) => [job.id, job]));
const slug = (value) => String(value).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);

const variantsFor = (model) => model.searchVariants ?? (model.id === 'model-070'
  ? ['Ford Focus RS Mk1', 'Ford Focus RS Mk2', 'Ford Focus RS500']
  : model.id === 'model-077'
    ? ['Ford Focus ST170 original low mileage', 'Ford Focus ST170 Estate', 'Ford Focus ST225 ST2 ST3 original low mileage']
    : [`${model.make} ${model.name}`]);

const jobs = [];
for (const model of models) {
  for (const variant of variantsFor(model)) {
    const mileage = model.maxMileageInclusive
      ? ` up to ${model.maxMileageInclusive} miles`
      : model.maxMileageExclusive ? ` under ${model.maxMileageExclusive} miles` : '';
    const ownership = model.maxOwnerCount ? ` maximum ${model.maxOwnerCount} total owners` : '';
    const baseQuery = `${variant} UK for sale${mileage}${ownership}`;

    for (const source of config.sources) {
      const id = `${model.id}:${source.id}:${slug(variant)}`;
      const old = previous.get(id) ?? {};
      const query = source.id === 'specialist-dealers'
        ? `${baseQuery} specialist dealer current stock`
        : `site:${source.site} ${baseQuery}`;

      jobs.push({
        id,
        modelId: model.id,
        make: model.make,
        model: model.name,
        variant,
        source: source.id,
        sourceName: source.name,
        query,
        priority: ['model-056','model-070','model-072','model-075','model-076','model-078','model-082','model-085','model-088','model-096','model-097'].includes(model.id),
        status: old.status ?? 'pending',
        lastSearchedAt: old.lastSearchedAt ?? null,
        lastResultCount: old.lastResultCount ?? null,
        candidateUrls: Array.isArray(old.candidateUrls) ? old.candidateUrls : [],
        limitation: old.limitation ?? null,
      });
    }
  }
}

const output = {
  generatedAt: new Date().toISOString(),
  modelCount: models.length,
  sourceCount: config.sources.length,
  jobCount: jobs.length,
  purpose: 'Durable search backlog. Search jobs create candidate advert URLs; only actual adverts move into data/discovery-queue.json for photo/spec/current-availability verification.',
  rules: {
    rejectBeforeVerification: ['informational pages', 'Wikipedia', 'magazine/PDF articles', 'buyer guides', 'generic search pages', 'historical sale-result pages', 'obvious parts/wanted adverts'],
    neverPublishWithout: ['current live advert', 'fixed qualifying price where required', 'current availability evidence', 'seller photographs checked', 'gearbox/specification verified'],
  },
  jobs,
};

await writeFile(new URL('data/search-queue.json', root), `${JSON.stringify(output, null, 2)}\n`);
console.log(`Built ${jobs.length} search jobs across ${models.length} watchlist targets and ${config.sources.length} sources.`);
