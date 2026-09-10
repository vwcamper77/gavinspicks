'use client';

import { useEffect, useState } from 'react';

type Decision = 'approved' | 'rejected' | 'later' | null;

export default function ReviewActions({ candidateKey }: { candidateKey: string }) {
  const storageKey = `gavinspicks-review:${candidateKey}`;
  const [decision, setDecision] = useState<Decision>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey) as Decision;
    if (saved === 'approved' || saved === 'rejected' || saved === 'later') setDecision(saved);
  }, [storageKey]);

  function choose(next: Exclude<Decision, null>) {
    window.localStorage.setItem(storageKey, next);
    setDecision(next);
  }

  return (
    <div className="mt-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button type="button" onClick={() => choose('approved')} className="rounded-md bg-foreground px-4 py-3 text-sm font-medium text-background">Add to Picks</button>
        <button type="button" onClick={() => choose('rejected')} className="rounded-md border px-4 py-3 text-sm font-medium hover:bg-muted">Reject</button>
        <button type="button" onClick={() => choose('later')} className="rounded-md border px-4 py-3 text-sm font-medium hover:bg-muted">Check later</button>
      </div>
      {decision ? <p className="mt-2 text-xs text-muted-foreground">Marked {decision}. Saved on this device.</p> : null}
    </div>
  );
}
