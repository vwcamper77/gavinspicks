'use client';
import {useCallback,useEffect,useState,type FormEvent} from 'react';
import type {SoldReport} from '@/lib/sold-reports';
import type {AvailabilityReview,ReviewAction} from '@/lib/availability-review';
type Queue={reports:SoldReport[];hidden:AvailabilityReview[];reviews:AvailabilityReview[]};
const when=(value:string)=>new Date(value).toLocaleString('en-GB');
export default function AdminReports({signedIn}:{signedIn:boolean}){
 const [authenticated,setAuthenticated]=useState(signedIn),[queue,setQueue]=useState<Queue|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[tab,setTab]=useState<'pending'|'hidden'|'history'>('pending'),[notice,setNotice]=useState('');
 const load=useCallback(async()=>{
  setError('');
  try{const r=await fetch('/api/admin/reports',{cache:'no-store'});const d=await r.json();if(r.status===401){setAuthenticated(false);setQueue(null);return}if(!r.ok)throw Error(d.error);setQueue(d)}catch(e){setError(e instanceof Error?e.message:'Could not load reports.')}
 },[]);
 useEffect(()=>{if(authenticated)void load()},[authenticated,load]);
 async function login(e:FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setError('');const form=e.currentTarget;
  try{const r=await fetch('/api/admin/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({passcode:new FormData(form).get('passcode')})});const d=await r.json();if(!r.ok)throw Error(d.error);form.reset();setAuthenticated(true)}catch(e){setError(e instanceof Error?e.message:'Could not sign in.')}finally{setBusy(false)}
 }
 async function logout(){setBusy(true);try{const r=await fetch('/api/admin/session',{method:'DELETE'});if(!r.ok)throw Error('Could not sign out.');setAuthenticated(false);setQueue(null)}catch(e){setError(String(e))}finally{setBusy(false)}}
 async function review(id:string,action:ReviewAction,note:string,reportedAt:string|null){
  setBusy(true);setError('');setNotice('');
  try{const r=await fetch('/api/admin/reports',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,action,note,reportedAt})});const d=await r.json();if(r.status===401)setAuthenticated(false);if(!r.ok)throw Error(d.error);setNotice(action==='hide'?'Car hidden from current picks.':action==='restore'?'Admin hold removed. The car must still pass the normal availability checks.':'Report dismissed and recorded.');await load()}catch(e){setError(e instanceof Error?e.message:'Could not save review.')}finally{setBusy(false)}
 }
 return <main className="admin-workspace"><header className="admin-header"><div><a href="/">← Gavin’s Picks</a><h1>Owner admin</h1></div>{authenticated&&<button onClick={logout} disabled={busy}>Sign out</button>}</header>
 {error&&<p className="admin-error" role="alert">{error}</p>}{notice&&<p className="admin-notice" role="status">{notice}</p>}
 {!authenticated?<form className="admin-login" onSubmit={login}><h2>Owner sign-in</h2><p>Enter your Gavin’s Picks owner passcode. This device stays signed in for 30 days unless you sign out.</p><label>Owner passcode<input name="passcode" type="password" required autoComplete="current-password" inputMode="text"/></label><button disabled={busy}>{busy?'Signing in…':'Continue'}</button></form>:<>
 <p>Open the seller’s advert and check its status before making a decision. Visitor reports alone do not prove a car is sold.</p>
 <nav className="admin-tabs" aria-label="Report views"><button aria-pressed={tab==='pending'} onClick={()=>setTab('pending')}>Pending ({queue?.reports.length??'…'})</button><button aria-pressed={tab==='hidden'} onClick={()=>setTab('hidden')}>Hidden cars ({queue?.hidden.length??'…'})</button><button aria-pressed={tab==='history'} onClick={()=>setTab('history')}>Review history</button><button onClick={load} disabled={busy}>Refresh</button></nav>
 {!queue?<p role="status">{error?'Reports are unavailable. Use Refresh to retry.':'Loading reports…'}</p>:tab==='history'?<div className="admin-list">{queue.reviews.map((r,i)=><article className="admin-review" key={r.reviewedAt+r.id+i}><h2>{r.title}</h2><p><strong>{r.action==='hide'?'Hidden':r.action==='restore'?'Hold removed':'Report dismissed'}</strong> · {when(r.reviewedAt)}</p><p>{r.note}</p><a href={r.url} target="_blank" rel="noreferrer">Open original advert ↗</a></article>)}{!queue.reviews.length&&<p>No reviews yet.</p>}</div>:<div className="admin-list">{(tab==='pending'?queue.reports:queue.hidden).map(r=><ReviewCard key={r.id+tab} report={r} hidden={tab==='hidden'} busy={busy} onReview={review}/>)}{!(tab==='pending'?queue.reports:queue.hidden).length&&<p className="admin-empty">{tab==='pending'?'No reports waiting for review.':'No cars hidden by admin.'}</p>}</div>}
 </>}
 </main>;
}
function ReviewCard({report,hidden,busy,onReview}:{report:SoldReport|AvailabilityReview;hidden:boolean;busy:boolean;onReview:(id:string,action:ReviewAction,note:string,reportedAt:string|null)=>Promise<void>}){
 const [note,setNote]=useState('');
 return <article className="admin-review"><h2>{report.title}</h2><p>{hidden?'Hidden':'Reported'} {when('reviewedAt' in report?report.reviewedAt:report.reportedAt)}</p>{'note' in report&&<p>Last review: {report.note}</p>}<div className="admin-links"><a href={report.url} target="_blank" rel="noreferrer">Check original advert ↗</a><a href={`/cars/${encodeURIComponent(report.id)}`} target="_blank" rel="noreferrer">View car page ↗</a></div><label>Your review note<textarea value={note} onChange={e=>setNote(e.target.value)} maxLength={1000} placeholder="What did you find on the seller’s advert?"/></label><div className="admin-actions">{hidden?<button disabled={busy||note.trim().length<5} onClick={()=>onReview(report.id,'restore',note,null)}>Remove admin hold</button>:<><button disabled={busy||note.trim().length<5} onClick={()=>onReview(report.id,'hide',note,report.reportedAt)}>Confirm unavailable & hide</button><button disabled={busy||note.trim().length<5} onClick={()=>onReview(report.id,'dismiss',note,report.reportedAt)}>Still available — dismiss report</button></>}</div></article>;
}
