export type ReviewAction='hide'|'dismiss'|'restore';
export type AvailabilityReview={id:string;url:string;title:string;action:ReviewAction;note:string;reviewedAt:string;reportedAt:string|null};
export function latestReviews(reviews:AvailabilityReview[]){
 const latest=new Map<string,AvailabilityReview>();
 for(const review of [...reviews].sort((a,b)=>a.reviewedAt.localeCompare(b.reviewedAt)))latest.set(review.id,review);
 return [...latest.values()];
}
export function hiddenListings<T extends {id:string;url:string}>(listings:T[],reviews:AvailabilityReview[]):string[]{
 const hidden=latestReviews(reviews).filter(r=>r.action==='hide');
 return listings.filter(l=>hidden.some(r=>r.id===l.id||r.url===l.url)).map(l=>l.id);
}
export function validateReview(input:unknown):{id:string;action:ReviewAction;note:string;reportedAt:string|null}|null{
 if(!input||typeof input!=='object')return null;
 const r=input as Record<string,unknown>;
 if(typeof r.id!=='string'||!/^[a-zA-Z0-9_-]{1,150}$/.test(r.id))return null;
 if(r.action!=='hide'&&r.action!=='dismiss'&&r.action!=='restore')return null;
 if(typeof r.note!=='string'||r.note.trim().length<5||r.note.length>1000)return null;
 if(r.reportedAt!==null&&(typeof r.reportedAt!=='string'||!Number.isFinite(Date.parse(r.reportedAt))))return null;
 return {id:r.id,action:r.action,note:r.note.trim(),reportedAt:r.reportedAt};
}
