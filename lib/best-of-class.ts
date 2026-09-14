export type ClassCandidate = {
  id: string;
  modelId: string;
  title?: string;
  mileage?: number | null;
  ownerCount?: number | null;
  firstSeen?: string;
  checkedAt?: string;
  notes?: string;
  evidence?: string;
  gavinSays?: string;
  selectionScore?: number;
};

export function selectionClass(candidate: ClassCandidate): string {
  const title = (candidate.title ?? '').toLowerCase();

  // Existing search policy treats these Focus generations/editions as distinct targets.
  if (candidate.modelId === 'model-070') {
    if (/rs\s*500/.test(title)) return 'model-070:rs500';
    if (/mk\s*1|mk1/.test(title)) return 'model-070:mk1';
    if (/mk\s*2|mk2/.test(title)) return 'model-070:mk2';
    if (/mk\s*3|mk3/.test(title)) return 'model-070:mk3';
  }

  // Existing policy also keeps Clio V6 phases separate.
  if (candidate.modelId === 'model-040') {
    if (/phase\s*1/.test(title)) return 'model-040:phase1';
    if (/phase\s*2/.test(title)) return 'model-040:phase2';
  }

  return candidate.modelId;
}

function textScore(candidate: ClassCandidate): number {
  const text = [candidate.notes, candidate.evidence, candidate.gavinSays].filter(Boolean).join(' ').toLowerCase();
  let score = 0;
  const positives = [
    ['full service history', 12],
    ['service history', 6],
    ['original', 8],
    ['totally standard', 12],
    ['factory', 4],
    ['one owner', 12],
    ['two owner', 8],
    ['low ownership', 7],
    ['recent cambelt', 5],
    ['cambelt', 3],
    ['special order', 10],
    ['limited edition', 8],
    ['massive history', 6],
    ['history file', 5],
  ] as const;
  const negatives = [
    ['category n', -30],
    ['category s', -35],
    ['write-off', -35],
    ['modified', -8],
    ['conversion', -10],
    ['high mileage', -8],
    ['unknown history', -12],
  ] as const;
  for (const [needle, value] of positives) if (text.includes(needle)) score += value;
  for (const [needle, value] of negatives) if (text.includes(needle)) score += value;
  return score;
}

export function classQualityScore(candidate: ClassCandidate): number {
  if (typeof candidate.selectionScore === 'number' && Number.isFinite(candidate.selectionScore)) {
    return 1_000_000_000 + candidate.selectionScore;
  }

  let score = textScore(candidate) * 1_000_000;
  if (typeof candidate.ownerCount === 'number' && Number.isFinite(candidate.ownerCount)) {
    score += Math.max(0, 10 - candidate.ownerCount) * 100_000;
  }
  if (typeof candidate.mileage === 'number' && Number.isFinite(candidate.mileage)) {
    score += Math.max(0, 200_000 - candidate.mileage) * 10;
  }
  const checked = Date.parse(candidate.checkedAt ?? '');
  if (Number.isFinite(checked)) score += Math.floor(checked / 86_400_000);
  return score;
}

export function selectBestOfClass<T extends ClassCandidate>(candidates: T[]): T[] {
  const best = new Map<string, T>();
  for (const candidate of candidates) {
    const key = selectionClass(candidate);
    const incumbent = best.get(key);
    if (!incumbent || classQualityScore(candidate) > classQualityScore(incumbent)) {
      best.set(key, candidate);
    }
  }
  return Array.from(best.values());
}
