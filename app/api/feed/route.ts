import feed from '@/lib/combined-feed';
import {getHiddenListingIds} from '@/lib/public-availability';
import {isLiveListing} from '@/lib/eligibility';
import {readCurationDecisions} from '@/lib/curation-store';
export const dynamic='force-dynamic';

function validHttpUrl(value:unknown):value is string{
 if(typeof value!=='string'||!value.trim())return false;
 try{const url=new URL(value);return url.protocol==='http:'||url.protocol==='https:';}catch{return false;}
}
function isPublishableApproved(listing:any):boolean{
 const text=[listing?.evidence,listing?.photoEvidence,listing?.notes].filter(Boolean).join(' ').toLowerCase();
 const unresolved=/\b(unverified|not publishable|verification required|needs? (?:manual )?review|no (?:usable )?(?:image|photo)|photo(?:s)? unavailable|unable to verify)\b/.test(text);
 return !!listing&&validHttpUrl(listing.url)&&validHttpUrl(listing.image)&&
   typeof listing.title==='string'&&listing.title.trim().length>0&&
   typeof listing.seller==='string'&&listing.seller.trim().length>0&&
   !unresolved;
}

export async function GET(){
 try{
  const [hidden,decisions]=await Promise.all([getHiddenListingIds(),readCurationDecisions()]);
  const approved=decisions.filter(d=>d.action==='approved'&&d.listing&&isPublishableApproved(d.listing)).map(d=>d.listing!);
  const rejectedUrls=new Set(decisions.filter(d=>d.action==='rejected').map(d=>d.url));
  const byUrl=new Map<string,any>();
  for(const listing of feed.listings)if(!rejectedUrls.has(listing.url))byUrl.set(listing.url,listing);
  for(const listing of approved)byUrl.set(listing.url,listing);
  const now=Date.now();
  const listings=Array.from(byUrl.values()).filter(l=>isLiveListing(l,now)&&!hidden.includes(l.id));
  const updatedAt=decisions.reduce((latest,d)=>Date.parse(d.decidedAt)>Date.parse(latest)?d.decidedAt:latest,feed.updatedAt);
  return Response.json({...feed,updatedAt,listings},{headers:{'Cache-Control':'no-store, max-age=0'}});
 }catch{return Response.json({error:'Availability checks are temporarily unavailable.'},{status:503,headers:{'Cache-Control':'no-store'}})}
}
