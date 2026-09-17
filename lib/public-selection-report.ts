import {GET as getFeed} from '@/app/api/feed/route';
import {buildSelectionReport, type ReportListing} from '@/lib/selection-report';

export async function getPublicSelectionReport() {
  const response = await getFeed();
  if (!response.ok) throw new Error('Availability checks are temporarily unavailable.');
  const feed = await response.json() as {listings: ReportListing[]};
  return buildSelectionReport(feed.listings);
}
