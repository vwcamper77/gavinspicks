import {get,list,put,del} from '@vercel/blob';
import {randomUUID} from 'node:crypto';
import type {SoldReport} from './sold-reports';
import type {AvailabilityReview} from './availability-review';
async function readAll<T>(prefix:string):Promise<T[]>{
 const rows:T[]=[];let cursor:string|undefined;
 do{
  const page=await list({prefix,cursor,limit:1000});
  const values=await Promise.all(page.blobs.map(async blob=>{
   const result=await get(blob.url,{access:'private',useCache:false});
   if(!result||result.statusCode!==200)throw Error('Could not read stored review.');
   return JSON.parse(await new Response(result.stream).text()) as T;
  }));
  rows.push(...values);cursor=page.hasMore?page.cursor:undefined;
 }while(cursor);
 return rows;
}
export const readReports=()=>readAll<SoldReport>('sold-reports/');
export const readReviews=()=>readAll<AvailabilityReview>('availability-reviews/');
export async function saveReview(review:AvailabilityReview){
 await put(`availability-reviews/${Date.now()}-${randomUUID()}.json`,JSON.stringify(review),{access:'private',addRandomSuffix:false,allowOverwrite:false,contentType:'application/json'});
}
export async function removeReport(id:string){await del(`sold-reports/${id}.json`);}
