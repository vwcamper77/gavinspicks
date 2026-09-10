import {createHash} from 'node:crypto';
import {get,list,put} from '@vercel/blob';

export type CurationAction='approved'|'rejected'|'deferred';
export type ReviewCandidate={
 modelId?:string;url:string;source?:string;discoveredAt?:string;status?:string;note?:string;
 title?:string;year?:number;price?:number;mileage?:number;gearbox?:string;seller?:string;location?:string;image?:string;
};
export type ApprovedListing={
 id:string;modelId:string;title:string;year:number;price:number;mileage:number|null;gearbox:string;location:string;seller:string;url:string;image:string;
 evidence:string;photoEvidence:string;notes:string;firstSeen:string;checkedAt:string;status:'available';photoChecked:boolean;priceVerified:boolean;availableVerified:boolean;specVerified:boolean;ukVerified:boolean;discoveryType:'manual-review';gavinSays:string;images:string[];
};
export type CurationDecision={url:string;action:CurationAction;decidedAt:string;candidate:ReviewCandidate;listing?:ApprovedListing};

const keyFor=(url:string)=>createHash('sha256').update(url).digest('hex');
const pathFor=(url:string)=>`curation-decisions/${keyFor(url)}.json`;

export async function saveCurationDecision(decision:CurationDecision){
 await put(pathFor(decision.url),JSON.stringify(decision),{access:'private',addRandomSuffix:false,allowOverwrite:true,contentType:'application/json'});
}

export async function readCurationDecision(url:string):Promise<CurationDecision|null>{
 const page=await list({prefix:pathFor(url),limit:1});
 const blob=page.blobs[0]; if(!blob)return null;
 const result=await get(blob.url,{access:'private',useCache:false});
 if(!result||result.statusCode!==200)return null;
 return JSON.parse(await new Response(result.stream).text()) as CurationDecision;
}

export async function readCurationDecisions():Promise<CurationDecision[]>{
 const rows:CurationDecision[]=[];let cursor:string|undefined;
 do{
  const page=await list({prefix:'curation-decisions/',cursor,limit:1000});
  const batch=await Promise.all(page.blobs.map(async blob=>{const result=await get(blob.url,{access:'private',useCache:false});if(!result||result.statusCode!==200)return null;return JSON.parse(await new Response(result.stream).text()) as CurationDecision;}));
  rows.push(...batch.filter((x):x is CurationDecision=>!!x));cursor=page.hasMore?page.cursor:undefined;
 }while(cursor);
 return rows;
}
