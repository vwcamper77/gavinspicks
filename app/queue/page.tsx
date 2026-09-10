import Link from 'next/link';
import queue from '@/data/search-queue.json';

type Job = (typeof queue.jobs)[number];

function isDue(job: Job) {
  if (!job.lastSearchedAt) return true;
  const cadence = 'cadenceHours' in job && typeof job.cadenceHours === 'number' ? job.cadenceHours : 24;
  return Date.now() - new Date(job.lastSearchedAt).getTime() >= cadence * 60 * 60 * 1000;
}

function formatDate(value: string | null) {
  if (!value) return 'Never';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London'
  }).format(new Date(value));
}

export const dynamic = 'force-dynamic';

export default function QueuePage() {
  const jobs = queue.jobs as Job[];
  const due = jobs.filter(isDue);
  const pending = jobs.filter((job) => job.status === 'pending');
  const searched = jobs.filter((job) => job.status === 'searched');
  const blocked = jobs.filter((job) => job.status === 'blocked');
  const failed = jobs.filter((job) => job.status === 'failed');
  const candidates = jobs.reduce((sum, job) => sum + (Array.isArray(job.candidateUrls) ? job.candidateUrls.length : 0), 0);

  const next = [...due]
    .sort((a, b) => {
      if (a.priority !== b.priority) return a.priority ? -1 : 1;
      const at = a.lastSearchedAt ? new Date(a.lastSearchedAt).getTime() : 0;
      const bt = b.lastSearchedAt ? new Date(b.lastSearchedAt).getTime() : 0;
      return at - bt;
    })
    .slice(0, 100);

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">Gavin&apos;s Picks</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">Search Queue</h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">
            The working backlog behind the watchlist. Search jobs are not cars: they create candidate advert URLs, which must then pass the full verification rules before appearing on the site.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/review" className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background">Review candidates</Link>
          <Link href="/rules" className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted">Rules</Link>
          <Link href="/" className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted">Watchlist</Link>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {[
          ['Jobs', queue.jobCount],
          ['Due now', due.length],
          ['Pending', pending.length],
          ['Searched', searched.length],
          ['Blocked', blocked.length],
          ['Failed', failed.length],
          ['Candidate URLs', candidates],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-xl border p-4">
            <div className="text-2xl font-semibold">{value}</div>
            <div className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
          </div>
        ))}
      </section>

      <section className="mt-8 rounded-xl border p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-semibold">Next 100 due jobs</h2>
            <p className="mt-1 text-sm text-muted-foreground">Priority targets first, then oldest search coverage.</p>
          </div>
          <p className="text-sm text-muted-foreground">Queue built {formatDate(queue.generatedAt)}</p>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-3">Priority</th>
                <th className="px-3 py-3">Car</th>
                <th className="px-3 py-3">Source</th>
                <th className="px-3 py-3">Cadence</th>
                <th className="px-3 py-3">Last searched</th>
                <th className="px-3 py-3">Candidates</th>
                <th className="px-3 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {next.map((job) => (
                <tr key={job.id} className="border-b last:border-0">
                  <td className="px-3 py-3 font-medium">{job.priority ? 'HIGH' : '—'}</td>
                  <td className="px-3 py-3">
                    <div className="font-medium">{job.variant}</div>
                    <div className="mt-1 max-w-xl truncate text-xs text-muted-foreground" title={job.query}>{job.query}</div>
                  </td>
                  <td className="px-3 py-3">{job.sourceName}</td>
                  <td className="px-3 py-3">{'cadenceHours' in job ? `${job.cadenceHours}h` : '24h'}</td>
                  <td className="px-3 py-3">{formatDate(job.lastSearchedAt)}</td>
                  <td className="px-3 py-3">{job.candidateUrls?.length ?? 0}</td>
                  <td className="px-3 py-3 capitalize">{job.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
