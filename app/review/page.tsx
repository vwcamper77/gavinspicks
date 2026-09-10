import Link from 'next/link';
import candidates from '@/data/worker-candidates.json';
import CandidateReview from '@/components/candidate-review';

export const dynamic='force-dynamic';

export default function ReviewPage(){
 const source=candidates as unknown as {candidates?:Array<{modelId?:string;url:string;source?:string;discoveredAt?:string;status?:string;note?:string;title?:string;year?:number;price?:number;mileage?:number;gearbox?:string;seller?:string;location?:string;image?:string}>};
 const rows=Array.isArray(source.candidates)?source.candidates:[];
 return <main className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-10">
  <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
   <div><p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">Gavin&apos;s Picks</p><h1 className="mt-2 text-4xl font-semibold tracking-tight">Candidate Review</h1><p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">Sweep discoveries, inspect the original advert, then add, reject or defer. Decisions are saved privately and approved cars flow into Available Now.</p></div>
   <div className="flex gap-2"><Link href="/queue" className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted">Search Queue</Link><Link href="/" className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted">Watchlist</Link></div>
  </div>
  <CandidateReview candidates={rows}/>
 </main>;
}
