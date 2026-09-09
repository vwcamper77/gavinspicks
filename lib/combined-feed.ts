import feed from '@/data/feed.json';
import supplemental from '@/data/supplemental-feed.json';

const byUrl = new Map<string, (typeof feed.listings)[number] | (typeof supplemental.listings)[number]>();
for (const listing of supplemental.listings) byUrl.set(listing.url, listing);
for (const listing of feed.listings) byUrl.set(listing.url, listing);

const combinedFeed = {
  ...feed,
  updatedAt: Date.parse(supplemental.updatedAt) > Date.parse(feed.updatedAt) ? supplemental.updatedAt : feed.updatedAt,
  listings: Array.from(byUrl.values()),
};

export default combinedFeed;
