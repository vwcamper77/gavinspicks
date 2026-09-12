import {privateStore} from './private-records.mjs';
import {randomUUID} from 'node:crypto';
import type {SoldReport} from './sold-reports';
import type {AvailabilityReview} from './availability-review';
async function readAll<T>(prefix:string):Promise<T[]>{
 return (await privateStore()).all(prefix) as Promise<T[]>;
}
export const readReports=()=>readAll<SoldReport>('sold-reports/');
export const readReviews=()=>readAll<AvailabilityReview>('availability-reviews/');
export async function saveReview(review:AvailabilityReview){
 await (await privateStore()).write(`availability-reviews/${Date.now()}-${randomUUID()}.json`,review);
}
export async function removeReport(id:string){await (await privateStore()).remove(`sold-reports/${id}.json`);}
