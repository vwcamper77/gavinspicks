import {getPublicSelectionReport} from '@/lib/public-selection-report';

export const dynamic = 'force-dynamic';

export async function GET() {
  const headers = {'Cache-Control': 'no-store, max-age=0'};
  try {
    return Response.json(await getPublicSelectionReport(), {headers});
  } catch {
    return Response.json({error: 'The report cannot be generated while availability checks are unavailable.'}, {status: 503, headers});
  }
}
