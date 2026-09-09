import {cache} from 'react';
import feed from '@/lib/combined-feed';
import {readReviews} from '@/lib/admin-store';
import {hiddenListings} from '@/lib/availability-review';
export const getHiddenListingIds=cache(async()=>hiddenListings(feed.listings,await readReviews()));
export async function safeHiddenListingIds(){
 try{return await getHiddenListingIds()}catch{console.error('Availability decisions could not be loaded');return feed.listings.map(l=>l.id)}
}
