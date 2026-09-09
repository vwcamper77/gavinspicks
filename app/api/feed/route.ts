import feed from '@/lib/combined-feed';
import {isLiveListing} from '@/lib/eligibility';
export const dynamic='force-dynamic';
export function GET(){const now=Date.now();return Response.json({...feed,listings:feed.listings.filter(l=>isLiveListing(l,now))},{headers:{'Cache-Control':'no-store, max-age=0'}});}
