import feed from '@/lib/combined-feed';
import {getHiddenListingIds} from '@/lib/public-availability';
import {isLiveListing} from '@/lib/eligibility';
import {readCurationDecisions} from '@/lib/curation-store';
export const dynamic='force-dynamic';
export async function GET(){
 try{
  const [hidden,decisions]=await Promise.all([getHiddenListingIds(),readCurationDecisions()]);
  const approved=decisions.filter(d=>d.action==='approved'&&d.listing).map(d=>d.listing!);
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
