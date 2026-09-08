'use client';
import {useState} from 'react';
export default function SoldReportButton({id}:{id:string}){
 const [state,setState]=useState<'idle'|'sending'|'sent'|'error'>('idle');
 async function report(){
  setState('sending');
  try{const r=await fetch('/api/reports',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})});if(!r.ok)throw Error();setState('sent');}
  catch{setState('error');}
 }
 return <div className="sold-report"><button type="button" onClick={report} disabled={state==='sending'||state==='sent'}>{state==='sending'?'Sending…':state==='sent'?'Reported — recheck pending':'Mark as sold'}</button><output>{state==='sent'?'Thank you. We’ll check the seller’s advert before changing its status.':state==='error'?'Could not save your report. Please try again.':'Seen it sold? Flag it for the next hourly check.'}</output></div>;
}
