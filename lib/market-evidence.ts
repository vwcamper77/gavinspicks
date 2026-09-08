import evidence from '../data/market-evidence.json' with { type: 'json' };

export type Sale = {
  date: string;
  price: number;
  currency: string;
  mileage: number | null;
  note: string;
  url: string;
  match: string;
  fees: string;
};
export type MarketProfile = {
  checkedAt: string;
  servicing: number;
  lowMaintenance: number;
  highMaintenance: number;
  usability: number;
  fun: number;
  appealReason: string;
  rarity: { label: string; source: string | null; note: string };
  sales: Sale[];
  researchNote?: string;
  researchSource?: string;
};
export function profileKey(car: { modelId?: string; title: string }) {
  const title = car.title.toLowerCase();
  switch (car.modelId) {
    case 'model-001':
      return title.includes('spider')
        ? '360-spider'
        : title.includes('modena')
          ? '360-modena'
          : null;
    case 'model-003':
      return '550';
    case 'model-014':
      return title.includes('t350c') ? 't350' : null;
    case 'model-015':
      return title.includes('mk2') && title.includes('4.3') ? 'tuscan' : null;
    case 'model-006':
      return 'r8-v8';
    case 'model-007':
      return title.includes('spyder') ? 'r8-v10-spyder' : null;
    case 'model-047':
      return 'db7-gt';
    case 'model-045':
      return 'db9';
    case 'model-069':
      return title.includes('vanquish s') && title.includes('works')
        ? 'vanquish'
        : null;
    case 'model-067':
      return title.includes('4s') && title.includes('3.9') ? 'hartech' : null;
    case 'model-074':
      return '996-40';
    case 'model-009':
      return title.includes('3r') ? 'noble' : null;
    case 'model-071':
      return 'm5-touring';
    case 'model-075':
      return 'tt-qs';
    case 'model-056':
      return 'z4m-coupe';
    default:
      return null;
  }
}
export function marketProfile(car: {
  modelId?: string;
  title: string;
}): MarketProfile | null {
  const key = profileKey(car);
  return key
    ? ((evidence as Record<string, MarketProfile>)[key] ?? null)
    : null;
}
// A rolling five-year window. Overseas/related observations remain in the evidence table only.
export function chartSales(sales: Sale[], now: string) {
  const end = new Date(now).getTime();
  const startDate = new Date(now);
  startDate.setUTCFullYear(startDate.getUTCFullYear() - 5);
  return sales.filter(
    (s) =>
      s.currency === 'GBP' &&
      s.match === 'variant' &&
      new Date(s.date).getTime() >= startDate.getTime() &&
      new Date(s.date).getTime() <= end,
  );
}
export function ownershipAppeal(
  usability: number,
  fun: number,
  useWeight: number,
) {
  const clamp = (n: number, lo: number, hi: number) =>
    Math.min(hi, Math.max(lo, Number.isFinite(n) ? n : lo));
  const weight = clamp(useWeight, 0, 100) / 100;
  return clamp(usability, 1, 10) * weight + clamp(fun, 1, 10) * (1 - weight);
}
