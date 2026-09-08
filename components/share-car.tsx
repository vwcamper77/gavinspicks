'use client';
import {useState} from 'react';
import {Share2,Copy,MessageCircle,Mail,Send} from 'lucide-react';
import {Dialog,DialogTrigger,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog';

const sharePhrases=[
 {label:'Share this beauty',intro:'Have a look at this beauty.'},
 {label:'Share this beast',intro:'What a beast. Have a look at this.'},
 {label:'Share this motor',intro:'Now this is a proper motor.'},
 {label:'Share this beaut',intro:'This one’s a beaut.'},
 {label:'Share this one',intro:'Thought you’d like this one.'},
 {label:'Share this rare find',intro:'Have a look at this rare find.'},
 {label:'Share this corker',intro:'This one’s a corker.'},
];
// Stable per car, including its direct share page and after feed refreshes.
function phraseFor(id:string){return sharePhrases[Array.from(id).reduce((hash,char)=>(hash*31+char.charCodeAt(0))>>>0,0)%sharePhrases.length]}
type ShareCarProps={id:string;title:string;price:number};
export default function ShareCar({id,title,price}:ShareCarProps){
 const [status,setStatus]=useState('');
 const url=`https://www.gavinspicks.com/cars/${encodeURIComponent(id)}`;
 const phrase=/\b(V10|V12)\b/i.test(title)?sharePhrases[1]:phraseFor(id);
 const text=`${phrase.intro} ${title} — ${new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:0}).format(price)}. See why it made Gavin’s Picks.`;
 async function copy(){try{await navigator.clipboard.writeText(url);setStatus('Link copied. Send it to someone who’ll get it.')}catch{setStatus('Select and copy the link below.')}}
 async function share(){if(!navigator.share){await copy();return}try{await navigator.share({title:`${title} | Gavin’s Picks`,text,url});setStatus('Share menu opened.')}catch(error){if(!(error instanceof Error&&error.name==='AbortError'))setStatus('Try WhatsApp or copy the link below.')}}
 return <Dialog onOpenChange={()=>setStatus('')}><DialogTrigger className="share-car-trigger" aria-label={`Share ${title} with a friend — ${phrase.label}`}><Share2 size={16}/>{phrase.label}</DialogTrigger><DialogContent className="share-popup"><DialogTitle>Know someone who’d love this?</DialogTitle><DialogDescription>Good cars deserve good company. Send this one to a mate.</DialogDescription><div className="share-preview"><img src={`/api/share-image?id=${encodeURIComponent(id)}`} alt={`${title} — Gavin’s Picks share preview`} width={1200} height={630}/></div><p className="share-car-name">{title}</p><div className="share-options"><a href={`https://wa.me/?text=${encodeURIComponent(text+' '+url)}`} target="_blank" rel="noreferrer"><MessageCircle size={18}/>WhatsApp</a><a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noreferrer"><Share2 size={18}/>Facebook</a><a href={`mailto:?subject=${encodeURIComponent(title+' — Gavin’s Picks')}&body=${encodeURIComponent(text+'\n\n'+url)}`}><Mail size={18}/>Email</a><button onClick={share}><Send size={18}/>More options</button></div><div className="share-copy"><input aria-label="Car share link" readOnly value={url} onFocus={e=>e.target.select()}/><button onClick={copy}><Copy size={16}/>Copy link</button></div><p className="share-status" role="status">{status}</p></DialogContent></Dialog>
}
