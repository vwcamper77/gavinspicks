'use client';

import {useEffect, useMemo, useState, type FormEvent} from 'react';
import {createPortal} from 'react-dom';
import {usePathname} from 'next/navigation';
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

const coordRules: Array<[RegExp, number, number]> = [
  [/antrim/i,54.72,-6.21],[/st albans/i,51.75,-0.34],[/bedford/i,52.14,-0.47],
  [/buckinghamshire|princes risborough/i,51.72,-0.83],[/eastbourne/i,50.77,0.29],
  [/ripon/i,54.14,-1.52],[/fulham|london/i,51.50,-0.13],[/bicester/i,51.90,-1.15],
  [/nottingham/i,52.95,-1.15],[/tonbridge/i,51.20,0.28],[/kineton|warwickshire/i,52.15,-1.52],
  [/maidenhead/i,51.52,-0.72],[/colchester|great tey/i,51.89,0.90],[/rickmansworth/i,51.64,-0.47],
  [/solihull|west midlands/i,52.41,-1.78],[/northampton/i,52.24,-0.90],[/sandycroft|flintshire/i,53.20,-3.00],
  [/kent/i,51.20,0.70],[/surrey/i,51.24,-0.57],[/essex/i,51.73,0.47],[/hertfordshire/i,51.81,-0.24],
  [/oxfordshire/i,51.75,-1.26],[/yorkshire/i,53.96,-1.08],[/cheshire/i,53.19,-2.52],
  [/lancashire/i,53.76,-2.70],[/greater manchester|manchester/i,53.48,-2.24],[/merseyside|liverpool/i,53.41,-2.99],
  [/birmingham/i,52.49,-1.89],[/bristol/i,51.45,-2.59],[/bath/i,51.38,-2.36],[/dorset/i,50.75,-2.33],
  [/hampshire/i,51.06,-1.31],[/sussex/i,50.91,-0.49],[/cambridgeshire|cambridge/i,52.21,0.12],
  [/norfolk|norwich/i,52.63,1.30],[/suffolk|ipswich/i,52.06,1.15],[/leicester/i,52.64,-1.13],
  [/derby/i,52.92,-1.47],[/sheffield/i,53.38,-1.47],[/leeds/i,53.80,-1.55],[/newcastle/i,54.98,-1.62],
  [/edinburgh/i,55.95,-3.19],[/glasgow/i,55.86,-4.25],[/cardiff/i,51.48,-3.18],[/swansea/i,51.62,-3.94],
];

function coords(location: string): [number, number] | null {
  const hit = coordRules.find(([re]) => re.test(location));
  return hit ? [hit[1], hit[2]] : null;
}

function xy(lat: number, lon: number) {
  const minLat=49.8,maxLat=58.8,minLon=-8.2,maxLon=2.2;
  return {
    x: 38 + ((lon-minLon)/(maxLon-minLon))*344,
    y: 34 + ((maxLat-lat)/(maxLat-minLat))*520,
  };
}

function MapPanel({listings}:{listings:Listing[]}) {
  const points = useMemo(() => listings.map(l => {
    const c=coords(l.location);
    return c ? {...l, lat:c[0], lon:c[1], ...xy(c[0],c[1])} : null;
  }).filter(Boolean) as Array<Listing & {lat:number;lon:number;x:number;y:number}>, [listings]);

  return <section className={styles.mapPanel} aria-label="Map of current Gavin's Picks">
    <div className={styles.mapCopy}>
      <p className={styles.kicker}>WHERE THE CURRENT PICKS ARE</p>
      <h2>See what is actually near you.</h2>
      <p>{points.length} of {listings.length} current cars are plotted from their advertised seller location. Tap a marker to open the car.</p>
      <div className={styles.newSearches}>
        <strong>New usable-classic searches</strong>
        <span>BMW E46 M3 manual Coupé · up to 50,000 miles</span>
        <span>BMW E39 M5 manual · up to 50,000 miles</span>
      </div>
    </div>
    <div className={styles.mapWrap}>
      <svg viewBox="0 0 420 600" role="img" aria-label="United Kingdom map with current car locations">
        <path className={styles.mapLand} d="M208 23l-18 25 7 31-23 30 12 37-23 22 12 28-28 28 11 40-24 24 18 23-8 34 23 27-4 35 27 18 13 40 32 21 14 35 28 2 9-28 32-10 4-31-18-24 17-22-10-28 15-26-18-23 14-33-22-19 14-40-21-24 2-35-30-15-1-33-31-15-5-38-27-22z"/>
        <path className={styles.mapLand} d="M102 395l-25 12-11 29 16 30 25 7 20-20-7-30z"/>
        {points.map(p => <a key={p.id} href={`/cars/${encodeURIComponent(p.id)}`}>
          <circle className={styles.markerHalo} cx={p.x} cy={p.y} r="10"/>
          <circle className={styles.marker} cx={p.x} cy={p.y} r="5">
            <title>{p.title} · {p.location} · £{p.price.toLocaleString('en-GB')}</title>
          </circle>
        </a>)}
      </svg>
      <div className={styles.mapLegend}>Approximate seller location · confirm before travelling</div>
    </div>
  </section>;
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
  const [exitOpen,setExitOpen]=useState(false);
  const [signupOpen,setSignupOpen]=useState(false);

  useEffect(()=>{
    let active=true;
    fetch('/api/feed',{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject()).then((d:Feed)=>{if(active&&Array.isArray(d.listings))setFeed(d)}).catch(()=>{});
    return()=>{active=false};
  },[]);

  useEffect(()=>{
    if(pathname!=='/') return;
    const metrics=document.querySelector('.metrics');
    if(!metrics) return;
    const host=document.createElement('div');
    host.className=styles.portalHost;
    metrics.insertAdjacentElement('afterend',host);
    setPortalHost(host);
    return()=>{host.remove();setPortalHost(null)};
  },[pathname]);

  useEffect(()=>{
    if(!feed.listings.length) return;
    const byUrl=new Map(feed.listings.map(l=>[l.url,l]));
    document.querySelectorAll<HTMLElement>('article.car').forEach(card=>{
      const original=card.querySelector<HTMLAnchorElement>('a.listing-link');
      if(!original) return;
      const listing=byUrl.get(original.href)||feed.listings.find(l=>original.href===l.url);
      if(!listing) return;
      if(!card.querySelector('.gp-why-link')){
        const a=document.createElement('a');
        a.className=`gp-why-link ${styles.whyLink}`;
        a.href=`/cars/${encodeURIComponent(listing.id)}?why=1`;
        a.textContent='Why Gavin picked it →';
        original.insertAdjacentElement('beforebegin',a);
      }
    });
    if(new URLSearchParams(window.location.search).get('why')==='1'){
      const button=document.querySelector<HTMLButtonElement>('.gavin-teaser');
      if(button) window.setTimeout(()=>button.click(),150);
    }
  },[feed.listings,pathname]);

  useEffect(()=>{
    if(pathname!=='/'||!feed.listings.length) return;
    const ids=feed.listings.map(l=>l.id).slice(0,40);
    fetch('/api/link-health',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({ids})})
      .then(r=>r.ok?r.json():Promise.reject())
      .then((d:{dead?:string[]})=>{
        if(!Array.isArray(d.dead)||!d.dead.length)return;
        const dead=new Set(d.dead);
        document.querySelectorAll<HTMLElement>('article.car').forEach(card=>{
          const original=card.querySelector<HTMLAnchorElement>('a.listing-link');
          const listing=feed.listings.find(l=>l.url===original?.href);
          if(listing&&dead.has(listing.id)) card.remove();
        });
        const remaining=feed.listings.filter(l=>!dead.has(l.id)).length;
        const metric=document.querySelector<HTMLElement>('.metrics strong');
        if(metric) metric.textContent=remaining.toString().padStart(2,'0');
      }).catch(()=>{});
  },[feed.listings,pathname]);

  useEffect(()=>{
    if(typeof window==='undefined'||localStorage.getItem('gp-lead-saved')==='1')return;
    const last=Number(localStorage.getItem('gp-exit-dismissed')||0);
    if(last&&Date.now()-last<7*86400000)return;
    let armed=false;
    const arm=window.setTimeout(()=>{armed=true},10000);
    const onOut=(e:MouseEvent)=>{if(armed&&e.clientY<=0&&!e.relatedTarget)setExitOpen(true)};
    document.addEventListener('mouseout',onOut);
    const mobile=window.setTimeout(()=>{if(window.matchMedia('(pointer: coarse)').matches)setExitOpen(true)},45000);
    return()=>{clearTimeout(arm);clearTimeout(mobile);document.removeEventListener('mouseout',onOut)};
  },[]);

  function dismissExit(){
    setExitOpen(false);
    localStorage.setItem('gp-exit-dismissed',String(Date.now()));
  }

  return <>
    {portalHost&&createPortal(<>
      <MapPanel listings={feed.listings}/>
      <section className={styles.signupPanel}>
        <div><p className={styles.kicker}>GET THE NEXT GOOD ONE FIRST</p><h2>What are you looking for?</h2><p>Tell Gavin the car, budget and type of ownership you want. We’ll build the client list around real demand rather than generic newsletter sign-ups.</p></div>
        <LeadForm trigger="homepage-inline"/>
      </section>
    </>,portalHost)}
    <button className={styles.floatingSignup} onClick={()=>setSignupOpen(true)}>Get latest picks</button>
    {(signupOpen||exitOpen)&&<div className={styles.overlay} role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget){setSignupOpen(false);dismissExit()}}}>
      <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="gp-signup-title">
        <button className={styles.close} onClick={()=>{setSignupOpen(false);dismissExit()}} aria-label="Close">×</button>
        <p className={styles.kicker}>{exitOpen?'BEFORE YOU GO':'LATEST PICKS'}</p>
        <h2 id="gp-signup-title">{exitOpen?'Wait — don’t you want to know about cars like this?':'Tell us what you want to find.'}</h2>
        <p>Give us the target and your budget. We’ll use it to surface the cars that are actually relevant to you.</p>
        <LeadForm compact trigger={exitOpen?'exit-intent':'floating-button'} onSaved={()=>window.setTimeout(()=>{setExitOpen(false);setSignupOpen(false)},900)}/>
      </section>
    </div>}
  </>;
}
