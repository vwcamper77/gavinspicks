import {createHash} from 'node:crypto';
import {privateStore} from './private-records.mjs';

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
 await (await privateStore()).write(pathFor(decision.url),decision,true);
}
export async function readCurationDecision(url:string):Promise<CurationDecision|null>{
 return (await privateStore()).read(pathFor(url));
}
export async function readCurationDecisions():Promise<CurationDecision[]>{
 return (await privateStore()).all('curation-decisions/');
}
