export type ReportTarget = { id: string; url: string; label?: string; title?: string };
export type SoldReport = { id: string; url: string; title: string; reportedAt: string; status: 'pending' };
export type ReportStore = { exists(path: string): Promise<boolean>; save(path: string, report: SoldReport): Promise<void> };
export async function acceptSoldReport(request: Request, targets: ReportTarget[], store: ReportStore): Promise<Response> {
 const reply = (body: object, status = 200) => Response.json(body, {status, headers: {'Cache-Control':'no-store'}});
 if (request.headers.get('origin') !== new URL(request.url).origin) return reply({error:'Please report from this website.'},403);
 if (!request.headers.get('content-type')?.startsWith('application/json')) return reply({error:'Expected JSON.'},415);
 if (Number(request.headers.get('content-length')) > 512) return reply({error:'Report too large.'},413);
 let input;
 try { const text = await request.text(); if (text.length > 512) return reply({error:'Report too large.'},413); input = JSON.parse(text); }
 catch { return reply({error:'Invalid report.'},400); }
 const target = targets.find(t => t.id === input?.id);
 if (!target) return reply({error:'Listing not found.'},404);
 const path = `sold-reports/${target.id}.json`;
 try {
  if (!(await store.exists(path))) {
   try { await store.save(path, {id:target.id,url:target.url,title:target.title || target.label || target.id,reportedAt:new Date().toISOString(),status:'pending'}); }
   catch (error) { if (!(await store.exists(path))) throw error; }
  }
  return reply({status:'pending',message:'Reported. We’ll recheck the seller’s advert before changing its status.'},202);
 } catch (error) { console.error('Sold-report storage error', error instanceof Error ? error.name + ': ' + error.message : 'Unknown error'); return reply({error:'Could not save your report. Please try again.'},503); }
}
