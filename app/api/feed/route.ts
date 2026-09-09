import feed from '@/lib/combined-feed';
import {getHiddenListingIds} from '@/lib/public-availability';
import {isLiveListing} from '@/lib/eligibility';
export const dynamic='force-dynamic';
export async function GET(){try{const hidden=await getHiddenListingIds();const now=Date.now();return Response.json({...feed,listings:feed.listings.filter(l=>isLiveListing(l,now)&&!hidden.includes(l.id))},{headers:{'Cache-Control':'no-store, max-age=0'}});}catch{return Response.json({error:'Availability checks are temporarily unavailable.'},{status:503,headers:{'Cache-Control':'no-store'}})}}
