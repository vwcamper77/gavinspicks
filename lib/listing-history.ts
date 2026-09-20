export type PastFind = {
  id: string;
  label: string;
  url: string;
  source: string;
  status: string;
  note: string;
  checkedAt: string;
  firstSeen?: string | null;
  firstSeenBasis?: string;
  statusObservedAt?: string | null;
  lastSeenAt?: string | null;
  lastAskingPrice?: number | null;
};

export type HistorySort = 'recent' | 'fastest' | 'slowest';

export function observedDuration(car: PastFind): number | null {
  if (!car.firstSeen || !car.statusObservedAt) return null;
  const start = Date.parse(car.firstSeen);
  const end = Date.parse(car.statusObservedAt);
  return Number.isFinite(start) && Number.isFinite(end) && end >= start ? end - start : null;
}

export function formatDuration(duration: number | null): string {
  if (duration === null) return 'Not recorded';
  const minutes = Math.floor(duration / 60_000);
  if (minutes < 1) return 'Under 1 minute';
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const remainder = minutes % 60;
  if (days) return `${days}d ${hours}h`;
  return hours ? `${hours}h ${remainder}m` : `${minutes}m`;
}

export function sortPastFinds(cars: PastFind[], sort: HistorySort): PastFind[] {
  const timestamp = (car: PastFind) => Date.parse(car.statusObservedAt || car.checkedAt) || 0;
  return [...cars].sort((a, b) => {
    if (sort !== 'recent') {
      const left = observedDuration(a), right = observedDuration(b);
      // Missing dates belong at the end in both directions, never as zero-day sales.
      if (left === null && right !== null) return 1;
      if (right === null && left !== null) return -1;
      if (left !== null && right !== null && left !== right) {
        return sort === 'fastest' ? left - right : right - left;
      }
    }
    return timestamp(b) - timestamp(a) || a.id.localeCompare(b.id);
  });
}
