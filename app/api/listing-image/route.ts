import feed from '@/lib/combined-feed';
import {readCurationDecisions} from '@/lib/curation-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function photosFor(listing: any): string[] {
  return [...new Set([listing?.image, ...(Array.isArray(listing?.images) ? listing.images : [])])]
    .filter((url): url is string => typeof url === 'string' && /^https?:\/\//i.test(url));
}

async function allApprovedListings() {
  try {
    const decisions = await readCurationDecisions();
    const approved = decisions.filter(decision => decision.action === 'approved' && decision.listing).map(decision => decision.listing!);
    return [...feed.listings, ...approved];
  } catch {
    return feed.listings;
  }
}

async function findListing(id: string, primary: string) {
  const listings = await allApprovedListings();
  if (id) return listings.find(listing => listing.id === id);
  if (primary) return listings.find(listing => listing.image === primary);
  return undefined;
}

async function fetchImage(source: string) {
  const origin = new URL(source).origin;
  const headers = {
    'accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1',
    'referer': `${origin}/`,
  };
  let response = await fetch(source, {redirect: 'follow', cache: 'no-store', headers, signal: AbortSignal.timeout(8000)});
  if (!response.ok || !response.headers.get('content-type')?.toLowerCase().startsWith('image/')) {
    try { await response.body?.cancel(); } catch {}
    response = await fetch(source, {
      redirect: 'follow', cache: 'no-store',
      headers: {'accept': headers.accept, 'user-agent': headers['user-agent']},
      signal: AbortSignal.timeout(8000),
    });
  }
  return response;
}

export async function GET(request: Request) {
  const {searchParams} = new URL(request.url);
  const id = searchParams.get('id') ?? '';
  const primary = searchParams.get('primary') ?? '';
  const index = Number.parseInt(searchParams.get('index') ?? '0', 10);
  if ((!id && !primary) || !Number.isInteger(index) || index < 0) return new Response(null, {status: 400});

  const listing = await findListing(id, primary);
  if (!listing) return new Response(null, {status: 404});
  const photos = photosFor(listing);
  const source = photos[index];
  if (!source) return new Response(null, {status: 404});

  try {
    const upstream = await fetchImage(source);
    const contentType = upstream.headers.get('content-type') ?? '';
    if (!upstream.ok || !contentType.toLowerCase().startsWith('image/')) {
      try { await upstream.body?.cancel(); } catch {}
      return new Response(null, {status: 502, headers: {'Cache-Control': 'no-store'}});
    }
    return new Response(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600, s-maxage=21600, stale-while-revalidate=86400',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return new Response(null, {status: 504, headers: {'Cache-Control': 'no-store'}});
  }
}
