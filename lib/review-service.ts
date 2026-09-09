import {latestReviews,validateReview,type AvailabilityReview} from './availability-review.ts';
import type {SoldReport,ReportTarget} from './sold-reports.ts';
type Store={readReports():Promise<SoldReport[]>;readReviews():Promise<AvailabilityReview[]>;saveReview(review:AvailabilityReview):Promise<void>;removeReport(id:string):Promise<void>};
export async function reviewAvailability(raw:unknown,targets:ReportTarget[],store:Store){
 const input=validateReview(raw);
 if(!input)return {error:'Choose an action and add a note of at least five characters.',status:400};
 const [reports,reviews]=await Promise.all([store.readReports(),store.readReviews()]);
 const report=reports.find(r=>r.id===input.id);
 const latest=latestReviews(reviews).find(r=>r.id===input.id);
 if(input.action==='restore'){
  if(latest?.action!=='hide')return {error:'This car is not currently hidden.',status:409};
 }else{
  if(!report||report.reportedAt!==input.reportedAt||reviews.some(r=>r.id===input.id&&r.reportedAt===input.reportedAt))return {error:'This report has changed or was already reviewed. Refresh the queue.',status:409};
  if(input.action==='dismiss'&&latest?.action==='hide')return {error:'This car is already hidden. Restore it from the hidden cars list after checking it.',status:409};
 }
 const target=targets.find(l=>l.id===input.id)??report??latest;
 if(!target)return {error:'Car not found.',status:404};
 await store.saveReview({...input,title:target.title||('label' in target?target.label:undefined)||target.id,url:target.url,reviewedAt:new Date().toISOString(),reportedAt:input.action==='restore'?null:input.reportedAt});
 // An immutable review is saved before clearing the pending item. GET reconciles
 // the log too, so cleanup failures cannot return a reviewed item to the queue.
 if(input.action!=='restore')try{await store.removeReport(input.id)}catch{console.error('Reviewed report cleanup pending');}
 return {ok:true,status:200};
}
