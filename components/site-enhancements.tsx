'use client';

import {useEffect, useState, type FormEvent} from 'react';
import {createPortal} from 'react-dom';
import {usePathname} from 'next/navigation';
import {Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription} from '@/components/ui/dialog';
import styles from './site-enhancements.module.css';

type Listing = {
  id: string;
  title: string;
  location: string;
  url: string;
  price: number;
  seller: string;
};

type Feed = {listings: Listing[]};

function LocationPanel({listings}:{listings:Listing[]}) {
  return <details className={styles.locations}>
    <summary>Browse seller locations</summary>
    <p>Advertised areas, not exact addresses. Confirm with the seller before travelling.</p>
    <ul>{[...listings].sort((a,b)=>a.location.localeCompare(b.location)).map(l=><li key={l.id}>
      <div><strong>{l.location}</strong><a href={`/cars/${encodeURIComponent(l.id)}`}>{l.title}</a></div>
      <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(l.location+', UK')}`} target="_blank" rel="noreferrer" aria-label={`View ${l.location} on Google Maps`}>View map ↗</a>
    </li>)}</ul>
    {!listings.length&&<p>No current seller locations to show.</p>}
  </details>;
}

type LeadProps={trigger:string; onSaved?:()=>void; compact?:boolean};

function LeadForm({trigger,onSaved,compact=false}:LeadProps) {
  const [state,setState]=useState<'idle'|'saving'|'saved'|'error'>('idle');
  const [message,setMessage]=useState('');
  async function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();
    setState('saving');
    const form=new FormData(e.currentTarget);
    const body={
      email:String(form.get('email')||''),
      name:String(form.get('name')||''),
      lookingFor:String(form.get('lookingFor')||''),
      budget:String(form.get('budget')||''),
      useCase:String(form.get('useCase')||''),
      makes:String(form.get('makes')||''),
      consent:form.get('consent')==='on',
      website:String(form.get('website')||''),
      trigger,
      source:window.location.pathname,
    };
    try{
      const r=await fetch('/api/leads',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
      const data=await r.json().catch(()=>({}));
      if(!r.ok) throw new Error(data.error||'Could not save your details.');
      localStorage.setItem('gp-lead-saved','1');
      setState('saved');
      onSaved?.();
    }catch(err){
      setMessage(err instanceof Error?err.message:'Could not save your details.');
      setState('error');
    }
  }
  if(state==='saved') return <div className={styles.saved}><strong>You’re on the list.</strong><span>Your preferences are saved for future matching-car updates.</span></div>;
  return <form className={compact?styles.leadFormCompact:styles.leadForm} onSubmit={submit}>
    <input className={styles.honeypot} tabIndex={-1} autoComplete="off" name="website" aria-hidden="true"/>
    <div className={styles.formGrid}>
      <label>Email<input name="email" type="email" autoComplete="email" required placeholder="you@example.com"/></label>
      <label>Name <span>optional</span><input name="name" autoComplete="name" placeholder="Gavin"/></label>
      <label className={styles.wide}>What are you looking for?<input name="lookingFor" required placeholder="e.g. E46 M3 manual Coupé, one-owner X50, gated V10"/></label>
      <label>Budget
        <select name="budget" defaultValue="">
          <option value="">Any / not sure</option><option>£10k–£20k</option><option>£20k–£40k</option><option>£40k–£60k</option><option>£60k–£80k</option><option>£80k–£100k</option>
        </select>
      </label>
      <label>How would you use it?
        <select name="useCase" defaultValue="Usable classic">
          <option>Usable classic</option><option>Collector / investment</option><option>Both</option><option>Just browsing</option>
        </select>
      </label>
      <label className={styles.wide}>Makes or models you want us to prioritise <span>optional</span><input name="makes" placeholder="BMW, Porsche, Ferrari, Audi R8…"/></label>
    </div>
    <label className={styles.consent}><input type="checkbox" name="consent" required/> Email me about relevant new Gavin’s Picks and matching cars. I can unsubscribe at any time.</label>
    <button disabled={state==='saving'} type="submit">{state==='saving'?'Saving…':'Tell me about matching cars'}</button>
    {state==='error'&&<p className={styles.error}>{message}</p>}
    <small>We store only the details you submit for Gavin’s Picks updates. We do not publish your email or preferences.</small>
  </form>;
}

export default function SiteEnhancements(){
  const pathname=usePathname();
  const [feed,setFeed]=useState<Feed>({listings:[]});
  const [portalHost,setPortalHost]=useState<HTMLElement|null>(null);
  const [signupOpen,setSignupOpen]=useState(false);

  useEffect(()=>{
    let active=true;
    fetch('/api/feed',{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject()).then((d:Feed)=>{if(active&&Array.isArray(d.listings))setFeed(d)}).catch(()=>{});
    return()=>{active=false};
  },[]);

  useEffect(()=>{
    if(pathname!=='/') return;
    const footer=document.querySelector('.workspace footer');
    if(!footer) return;
    const host=document.createElement('div');
    host.className=styles.portalHost;
    footer.insertAdjacentElement('beforebegin',host);
    setPortalHost(host);
    return()=>{host.remove();setPortalHost(null)};
  },[pathname]);

  useEffect(()=>{
    if(!feed.listings.length) return;
    if(new URLSearchParams(window.location.search).get('why')==='1'){
      const button=document.querySelector<HTMLButtonElement>('.gavin-teaser');
      if(button) window.setTimeout(()=>button.click(),150);
    }
  },[feed.listings,pathname]);

  return portalHost&&createPortal(<>
    <LocationPanel listings={feed.listings}/>
    <Dialog open={signupOpen} onOpenChange={setSignupOpen}>
      <div className={styles.signupInvitation}><span>Looking for something specific?</span><DialogTrigger className={styles.signupTrigger}>Tell Gavin what you want</DialogTrigger></div>
      <DialogContent className={styles.signupDialog}>
        <DialogTitle>What are you looking for?</DialogTitle>
        <DialogDescription>Tell Gavin the car and budget you have in mind.</DialogDescription>
        <LeadForm compact trigger="browse-button"/>
      </DialogContent>
    </Dialog>
  </>,portalHost);
}
