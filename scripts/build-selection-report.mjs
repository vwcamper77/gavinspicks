import {mkdir, writeFile, rename} from 'node:fs/promises';
import {buildSelectionReport} from '../lib/selection-report.ts';

const response = await fetch('https://www.gavinspicks.com/api/feed', {signal: AbortSignal.timeout(30000), cache: 'no-store'});
if (!response.ok) throw new Error(`Public feed unavailable (${response.status}); previous report retained.`);
const feed = await response.json();
if (!Array.isArray(feed.listings)) throw new Error('Public feed has no listings array; previous report retained.');
const report = buildSelectionReport(feed.listings);
const directory = new URL('../data/reports/', import.meta.url);
await mkdir(directory, {recursive: true});
const target = new URL('latest-selection-report.json', directory);
const temporary = new URL(`selection-report-${process.pid}.tmp`, directory);
await writeFile(temporary, `${JSON.stringify(report, null, 2)}\n`);
await rename(temporary, target);
console.log(JSON.stringify({totalSelected: report.totalSelected, totalCandidates: report.totalCandidates, exclusions: report.exclusions}));
