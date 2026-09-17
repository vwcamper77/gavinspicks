export type ReportListing = {
  id: string; modelId: string; title: string; year: number; price: number;
  mileage?: number | null; gearbox: string; seller: string; location: string;
  url: string; checkedAt: string; firstSeen: string; status: string;
  photoChecked: boolean; priceVerified: boolean; availableVerified: boolean;
  specVerified: boolean; ukVerified: boolean;
};

export const REPORT_CRITERIA = {
  yearMin: 1995, yearMax: 2010, priceMin: 10000, priceMax: 100000,
  excludeModelIds: ['model-072', 'model-070'],
  maxPerYear: 4, maxPerModel: 3, maxTotal: 50, maxCheckAgeHours: 24,
} as const;

// Input is the public feed: owner holds and curation decisions have already applied.
// Report freshness is deliberately stricter than the main site's retention policy.
export function buildSelectionReport(listings: ReportListing[], now = Date.now()) {
  const exclusions: Record<string, number> = {};
  const perYear = new Map<number, number>();
  const perModel = new Map<string, number>();
  const top: ReportListing[] = [];
  const reject = (reason: string) => { exclusions[reason] = (exclusions[reason] ?? 0) + 1; };
  const candidates = [...new Map(listings.map(l => [l.url, l])).values()];
  candidates.sort((a, b) => Date.parse(b.firstSeen) - Date.parse(a.firstSeen) || a.id.localeCompare(b.id));
  for (const listing of candidates) {
    const checked = Date.parse(listing.checkedAt);
    if (!Number.isInteger(listing.year) || listing.year < 1995 || listing.year > 2010) { reject('year'); continue; }
    if (!Number.isFinite(listing.price) || listing.price < 10000 || listing.price > 100000) { reject('price'); continue; }
    if (REPORT_CRITERIA.excludeModelIds.some(id => id === listing.modelId) || /\bbmw\s+1m\b|\bfocus\s+rs(?:500)?\b/i.test(listing.title)) { reject('model-excluded'); continue; }
    if (/\b(?:3|4|three|four)[\s/-]*speed\b/i.test(listing.gearbox)) { reject('gearbox'); continue; }
    if (listing.status !== 'available' || ![listing.photoChecked, listing.priceVerified, listing.availableVerified, listing.specVerified, listing.ukVerified].every(flag => flag === true)) { reject('availability'); continue; }
    if (!Number.isFinite(checked) || checked > now + 60000 || now - checked > 86400000) { reject('stale-check'); continue; }
    const yearCount = perYear.get(listing.year) ?? 0;
    const modelCount = perModel.get(listing.modelId) ?? 0;
    if (yearCount >= 4) { reject('year-cap'); continue; }
    if (modelCount >= 3) { reject('model-cap'); continue; }
    if (top.length >= 50) { reject('result-cap'); continue; }
    // Only expose customer-facing fields, not private research notes.
    const {id, modelId, title, year, price, mileage, gearbox, seller, location, url, checkedAt, firstSeen, status, photoChecked, priceVerified, availableVerified, specVerified, ukVerified} = listing;
    top.push({id, modelId, title, year, price, mileage, gearbox, seller, location, url, checkedAt, firstSeen, status, photoChecked, priceVerified, availableVerified, specVerified, ukVerified});
    perYear.set(year, yearCount + 1);
    perModel.set(modelId, modelCount + 1);
  }
  return {
    generatedAt: new Date(now).toISOString(), criteria: REPORT_CRITERIA,
    totalCandidates: candidates.length, totalSelected: top.length, exclusions, top,
    perYear: Array.from({length: 16}, (_, index) => {
      const year = 2010 - index;
      const topListings = top.filter(listing => listing.year === year);
      return {year, count: topListings.length, topListings};
    }),
  };
}
