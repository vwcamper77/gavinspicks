import feed from '@/data/feed.json';
import supplemental from '@/data/supplemental-feed.json';
import overrides from '@/data/listing-overrides.json';

type Listing=(typeof feed.listings)[number] | (typeof supplemental.listings)[number];
const byUrl = new Map<string, Listing>();
for (const listing of feed.listings) byUrl.set(listing.url, listing);
for (const listing of supplemental.listings) byUrl.set(listing.url, listing);
const listingOverrides=overrides as Record<string,{price?:number}>;

const combinedFeed = {
  ...feed,
  updatedAt: Date.parse(supplemental.updatedAt) > Date.parse(feed.updatedAt) ? supplemental.updatedAt : feed.updatedAt,
  listings: Array.from(byUrl.values()).map(listing=>({...listing,...(listingOverrides[listing.id]??{})})),
};

export default combinedFeed;
