import Link from 'next/link';
import candidates from '@/data/worker-candidates.json';

export const dynamic = 'force-dynamic';

type Candidate = {
  id?: string;
  title?: string;
  model?: string;
  variant?: string;
  year?: number;
  price?: number;
  mileage?: number;
  gearbox?: string;
  seller?: string;
  sourceName?: string;
  url?: string;
  image?: string;
  status?: string;
  notes?: string;
  evidence?: string;
};

function money(value?: number) {
  return typeof value === 'number' ? new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(value) : 'Price unknown';
}

function miles(value?: number) {
  return typeof value === 'number' ? `${new Intl.NumberFormat('en-GB').format(value)} miles` : 'Mileage unknown';
}

export default function ReviewPage() {
  const source = candidates as unknown as { candidates?: Candidate[] } | Candidate[];
  const rows: Candidate[] = Array.isArray(source) ? source : Array.isArray(source.candidates) ? source.candidates : [];

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-10">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">Gavin&apos;s Picks</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">Candidate Review</h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">
            Sweep discovered cars before they become Picks. Open the source advert, verify gearbox and availability, then add, reject or defer.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/queue" className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted">Search Queue</Link>
          <Link href="/" className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted">Watchlist</Link>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border p-4"><div className="text-2xl font-semibold">{rows.length}</div><div className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">Candidates</div></div>
        <div className="rounded-xl border p-4"><div className="text-2xl font-semibold">{rows.filter(r => /manual/i.test(r.gearbox || '')).length}</div><div className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">Manual signal</div></div>
        <div className="rounded-xl border p-4"><div className="text-2xl font-semibold">{rows.filter(r => typeof r.price === 'number' && r.price < 100000).length}</div><div className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">Under £100k</div></div>
        <div className="rounded-xl border p-4"><div className="text-2xl font-semibold">{rows.filter(r => r.url).length}</div><div className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">Source links</div></div>
      </div>

      {rows.length === 0 ? (
        <section className="rounded-2xl border p-8 text-center">
          <h2 className="text-xl font-semibold">No review candidates loaded</h2>
          <p className="mt-2 text-sm text-muted-foreground">The worker candidate file is currently empty or uses a different schema.</p>
        </section>
      ) : (
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((car, index) => {
            const title = car.title || car.model || car.variant || `Candidate ${index + 1}`;
            return (
              <article key={car.id || car.url || `${title}-${index}`} className="overflow-hidden rounded-2xl border bg-background shadow-sm">
                {car.image ? (
                  <div className="aspect-[4/3] overflow-hidden bg-muted">
                    <img src={car.image} alt="" className="h-full w-full object-cover" />
                  </div>
                ) : null}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-semibold leading-tight">{title}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">{[car.year, car.seller || car.sourceName].filter(Boolean).join(' · ')}</p>
                    </div>
                    {car.status ? <span className="rounded-full border px-2 py-1 text-xs capitalize">{car.status}</span> : null}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg bg-muted/50 p-3"><div className="text-xs uppercase tracking-wide text-muted-foreground">Price</div><div className="mt-1 font-medium">{money(car.price)}</div></div>
                    <div className="rounded-lg bg-muted/50 p-3"><div className="text-xs uppercase tracking-wide text-muted-foreground">Mileage</div><div className="mt-1 font-medium">{miles(car.mileage)}</div></div>
                    <div className="col-span-2 rounded-lg bg-muted/50 p-3"><div className="text-xs uppercase tracking-wide text-muted-foreground">Gearbox</div><div className="mt-1 font-medium">{car.gearbox || 'Needs verification'}</div></div>
                  </div>

                  {(car.evidence || car.notes) ? <p className="mt-4 text-sm leading-6 text-muted-foreground">{car.evidence || car.notes}</p> : null}

                  <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    {car.url ? <a href={car.url} target="_blank" rel="noreferrer" className="rounded-md border px-4 py-3 text-center text-sm font-medium hover:bg-muted">Open advert</a> : null}
                    <button type="button" disabled title="Approval persistence is the next wiring step" className="rounded-md bg-foreground px-4 py-3 text-sm font-medium text-background opacity-60">Add to Picks</button>
                    <button type="button" disabled title="Rejection persistence is the next wiring step" className="rounded-md border px-4 py-3 text-sm font-medium opacity-60">Reject</button>
                    <button type="button" disabled title="Deferral persistence is the next wiring step" className="rounded-md border px-4 py-3 text-sm font-medium opacity-60">Check later</button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
