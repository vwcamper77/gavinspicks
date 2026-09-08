import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = async (path) => JSON.parse(await readFile(new URL(path, root), 'utf8'));
const [models, state, config] = await Promise.all([
  read('data/models.json'), read('data/search-state.json'), read('data/discovery-sources.json'),
]);
const args = process.argv.slice(2);
const all = args.includes('--all');
const priority = args.includes('--priority');
if (args.some((arg) => !['--all','--priority'].includes(arg)) || (all && priority)) throw new Error('Usage: node scripts/discovery-plan.mjs [--all | --priority]');
// lastCompletedIndex is the count of model rows completed, hence the next zero-based offset.
const offset = all ? 0 : state.lastCompletedIndex;
if (!Number.isInteger(offset) || offset < 0 || offset > models.length) throw new Error('Invalid lastCompletedIndex');
const start = offset % models.length;
const selected = priority ? models.filter(m=>['model-056','model-072','model-075'].includes(m.id)) : Array.from({ length: all ? models.length : Math.min(12, models.length) }, (_, i) => models[(start + i) % models.length]);
const variants = (model) => model.id === 'model-070'
  ? ['Ford Focus RS Mk1', 'Ford Focus RS Mk2', 'Ford Focus RS500']
  : [`${model.make} ${model.name}`];

const searches = selected.flatMap((model) => variants(model).flatMap((variant) => {
  const query = `${variant} UK for sale`;
  const jobs = config.sources.map((source) => ({
    modelId: model.id, variant, source: source.id,
    query: `site:${source.site} ${query}`,
    status: 'pending', checkedAt: null, candidateUrls: [], limitation: null,
  }));
  for (const name of config.facebookGroupSearchTerms ?? []) {
    jobs.push({ modelId: model.id, variant, source: 'facebook-groups', groupSearchTerm: name,
      query: `site:facebook.com/groups "${name}" ${query}`,
      status: 'pending', checkedAt: null, candidateUrls: [], limitation: 'Group URL not yet confirmed; verify group identity before attributing coverage.' });
  }
  for (const group of config.facebookGroups) {
    const url = new URL(group.url);
    const match = url.pathname.match(/^\/groups\/([A-Za-z0-9._-]+)\/?$/);
    if (url.protocol !== 'https:' || !['facebook.com', 'www.facebook.com'].includes(url.hostname) || !match || url.username || url.password || url.port) {
      throw new Error(`Invalid Facebook group URL: ${group.url}`);
    }
    const groupUrl = `https://www.facebook.com/groups/${match[1]}`;
    jobs.push({ modelId: model.id, variant, source: 'facebook-groups', group: group.name,
      query: `site:facebook.com/groups/${match[1]} ${query}`,
      browserSearchUrl: `${groupUrl}/search/?q=${encodeURIComponent(variant)}`,
      status: 'pending', checkedAt: null, candidateUrls: [], limitation: null });
  }
  return jobs;
}));
console.log(JSON.stringify({
  generatedAt: new Date().toISOString(),
  instruction: 'Search plan only. Execute searches and inspect adverts; pending does not mean checked. Preserve the existing eligibility gate.',
  nextCompletedIndex: priority ? state.lastCompletedIndex : (start + selected.length) % models.length,
  mode: priority ? "priority" : all ? "all" : "rotation",
  searches,
}, null, 2));
