"use client";
import {useEffect,useMemo,useState,type FormEvent} from 'react';

type Candidate={modelId?:string;url:string;source?:string;discoveredAt?:string;status?:string;note?:string;title?:string;year?:number;price?:number;mileage?:number;gearbox?:string;seller?:string;location?:string;image?:string};
type Decision={url:string;action:'approved'|'rejected'|'deferred';decidedAt:string};

const pounds=(n?:number)=>typeof n==='number'?new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:0}).format(n):'Price not parsed';
const numberFrom=(text:string,re:RegExp)=>{const m=text.match(re);return m?Number(m[1].replace(/,/g,'')):undefined};
function derive(c:Candidate){
 const note=c.note||''; const lower=note.toLowerCase();
 const year=c.year??numberFrom(note,/\b((?:19|20)\d{2})\b/);
 const price=c.price??numberFrom(note,/£\s?([\d,]+)/);
 const mileage=c.mileage??numberFrom(note,/([\d,]+)\s*miles?\b/i);
 const title=c.title||note.split(',')[0]?.trim()||'Candidate';
 const gearbox=c.gearbox||(lower.includes('six-speed manual')?'6-speed manual':lower.includes('five-speed manual')?'5-speed manual':lower.includes('manual')?'Manual signal':'Needs gearbox check');
 return {title,year,price,mileage,gearbox};
}

export default function CandidateReview({candidates}:{candidates:Candidate[]}){
 const [decisions,setDecisions]=useState<Record<string,Decision>>({});
 const [busy,setBusy]=useState<string|null>(null); const [message,setMessage]=useState(''); const [signedIn,setSignedIn]=useState<boolean|null>(null);
 const load=async()=>{const r=await fetch('/api/admin/curation',{cache:'no-store'});if(r.status===401){setSignedIn(false);return}if(!r.ok)throw Error();const d=await r.json();setDecisions(Object.fromEntries((d.decisions||[]).map((x:Decision)=>[x.url,x])));setSignedIn(true)};
 useEffect(()=>{load().catch(()=>setMessage('Could not load saved review decisions.'))},[]);
 const pending=useMemo(()=>candidates.filter(c=>!decisions[c.url]||decisions[c.url].action==='deferred'),[candidates,decisions]);
 const approved=Object.values(decisions).filter(d=>d.action==='approved').length;
 const rejected=Object.values(decisions).filter(d=>d.action==='rejected').length;
 async function signIn(e:FormEvent<HTMLFormElement>){e.preventDefault();setMessage('');setBusy('login');const form=e.currentTarget;try{const r=await fetch('/api/admin/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({passcode:new FormData(form).get('passcode')})});const d=await r.json();if(!r.ok)throw Error(d.error||'Could not sign in.');form.reset();await load()}catch(e){setMessage(e instanceof Error?e.message:'Could not sign in.')}finally{setBusy(null)}}
 async function decide(c:Candidate,action:Decision['action']){
  setBusy(c.url);setMessage('');
  try{const r=await fetch('/api/admin/curation',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:c.url,action})});const d=await r.json();if(r.status===401)setSignedIn(false);if(!r.ok)throw Error(d.error||'Could not save decision.');setDecisions(v=>({...v,[c.url]:d.decision}));}
  catch(e){setMessage(e instanceof Error?e.message:'Could not save decision.')}finally{setBusy(null)}
 }
 if(signedIn===false)return <section className="mx-auto max-w-md rounded-2xl border p-6 sm:p-8"><h2 className="text-2xl font-semibold">Owner sign-in</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Enter your Gavin’s Picks owner passcode. This device stays signed in for 30 days.</p>{message&&<p className="mt-4 rounded-lg border p-3 text-sm" role="alert">{message}</p>}<form onSubmit={signIn} className="mt-5 space-y-3"><label className="block text-sm font-medium">Owner passcode<input name="passcode" type="password" required autoComplete="current-password" className="mt-2 w-full rounded-md border bg-background px-3 py-3"/></label><button disabled={busy==='login'} className="w-full rounded-md bg-foreground px-4 py-3 text-sm font-medium text-background disabled:opacity-50">{busy==='login'?'Signing in…':'Open review queue'}</button></form></section>;
 return <>
  <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
   <div className="rounded-xl border p-4"><div className="text-2xl font-semibold">{pending.length}</div><div className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">To review</div></div>
   <div className="rounded-xl border p-4"><div className="text-2xl font-semibold">{approved}</div><div className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">Added</div></div>
   <div className="rounded-xl border p-4"><div className="text-2xl font-semibold">{rejected}</div><div className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">Rejected</div></div>
   <div className="rounded-xl border p-4"><div className="text-2xl font-semibold">{candidates.length}</div><div className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">Discovered</div></div>
  </div>
  {message&&<p className="mb-5 rounded-lg border p-3 text-sm" role="status">{message}</p>}
  <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
   {pending.map((c)=>{const d=derive(c);const working=busy===c.url;return <article key={c.url} className="overflow-hidden rounded-2xl border bg-background shadow-sm">
    {c.image?<div className="aspect-[4/3] overflow-hidden bg-muted"><img src={c.image} alt="" className="h-full w-full object-cover"/></div>:<div className="flex aspect-[4/3] items-center justify-center bg-muted px-6 text-center text-sm text-muted-foreground">Open the original advert to inspect seller photos</div>}
    <div className="p-5"><div className="flex items-start justify-between gap-3"><div><h2 className="text-xl font-semibold leading-tight">{d.title}</h2><p className="mt-1 text-sm text-muted-foreground">{[d.year,c.source].filter(Boolean).join(' · ')}</p></div><span className="rounded-full border px-2 py-1 text-xs">{c.status||'candidate'}</span></div>
    <div className="mt-4 grid grid-cols-2 gap-3 text-sm"><div className="rounded-lg bg-muted/50 p-3"><div className="text-xs uppercase tracking-wide text-muted-foreground">Price</div><div className="mt-1 font-medium">{pounds(d.price)}</div></div><div className="rounded-lg bg-muted/50 p-3"><div className="text-xs uppercase tracking-wide text-muted-foreground">Mileage</div><div className="mt-1 font-medium">{typeof d.mileage==='number'?`${d.mileage.toLocaleString('en-GB')} miles`:'Not parsed'}</div></div><div className="col-span-2 rounded-lg bg-muted/50 p-3"><div className="text-xs uppercase tracking-wide text-muted-foreground">Gearbox</div><div className="mt-1 font-medium">{d.gearbox}</div></div></div>
    {c.note&&<p className="mt-4 text-sm leading-6 text-muted-foreground">{c.note}</p>}
    <div className="mt-5 grid grid-cols-2 gap-2"><a href={c.url} target="_blank" rel="noreferrer" className="col-span-2 rounded-md border px-4 py-3 text-center text-sm font-medium hover:bg-muted">Open original advert</a><button disabled={working} onClick={()=>decide(c,'approved')} className="rounded-md bg-foreground px-4 py-3 text-sm font-medium text-background disabled:opacity-50">Add to Picks</button><button disabled={working} onClick={()=>decide(c,'rejected')} className="rounded-md border px-4 py-3 text-sm font-medium disabled:opacity-50">Reject</button><button disabled={working} onClick={()=>decide(c,'deferred')} className="col-span-2 rounded-md border px-4 py-3 text-sm font-medium disabled:opacity-50">Check later</button></div>
    </div></article>})}
  </section>
  {!pending.length&&<section className="rounded-2xl border p-8 text-center"><h2 className="text-xl font-semibold">Review queue cleared</h2><p className="mt-2 text-sm text-muted-foreground">New worker discoveries will appear here automatically.</p></section>}
 </>;
}
