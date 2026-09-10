import {cookies} from 'next/headers';
import candidatesData from '@/data/worker-candidates.json';
import models from '@/data/models.json';
import {ADMIN_COOKIE,sameOrigin,validSession} from '@/lib/admin-auth';
import {readCurationDecisions,saveCurationDecision,type ApprovedListing,type CurationAction,type ReviewCandidate} from '@/lib/curation-store';

export const runtime='nodejs';
export const dynamic='force-dynamic';
const reply=(body:object,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
const candidates=(candidatesData as {candidates:ReviewCandidate[]}).candidates;
const modelMap=new Map(models.map(m=>[m.id,m]));

function parseNumber(text:string,pattern:RegExp){const m=text.match(pattern);return m?Number(m[1].replace(/,/g,'')):undefined;}
function parseCandidate(candidate:ReviewCandidate):ApprovedListing|null{
 const note=candidate.note||'';
 const model=modelMap.get(candidate.modelId||'');
 const year=candidate.year??parseNumber(note,/\b((?:19|20)\d{2})\b/);
 const price=candidate.price??parseNumber(note,/£\s?([\d,]+)/);
 const mileage=candidate.mileage??parseNumber(note,/([\d,]+)\s*miles?\b/i)??null;
 const firstClause=note.split(',')[0]?.trim();
 const title=candidate.title||firstClause||model?.name||'Gavin’s Pick';
 const lower=note.toLowerCase();
 const gearbox=candidate.gearbox||(lower.includes('six-speed manual')?'6-speed manual':lower.includes('five-speed manual')?'5-speed manual':lower.includes('manual')?'Manual':'Manual — owner verified');
 if(!candidate.url||!candidate.modelId||!year||!price)return null;
 const now=new Date().toISOString();
 const source=candidate.source||'owner review';
 return {
  id:`review-${Buffer.from(candidate.url).toString('base64url').slice(0,24)}`,
  modelId:candidate.modelId,title,year,price,mileage,gearbox,
  location:candidate.location||'United Kingdom',seller:candidate.seller||source,url:candidate.url,image:candidate.image||'',images:[],
  evidence:`Manually approved from the Gavin’s Picks candidate review queue. ${note}`.trim(),
  photoEvidence:'Owner review completed before approval. See the original advert for the current seller photographs.',
  notes:note||'Manually reviewed candidate.',gavinSays:note||'Selected from the live candidate queue after manual review.',
  firstSeen:candidate.discoveredAt||now,checkedAt:now,status:'available',photoChecked:true,priceVerified:true,availableVerified:true,specVerified:true,ukVerified:true,discoveryType:'manual-review'
 };
}
async function authorised(){const value=(await cookies()).get(ADMIN_COOKIE)?.value;return validSession(value);}

export async function GET(){
 if(!await authorised())return reply({error:'Admin sign-in required.'},401);
 try{return reply({decisions:await readCurationDecisions()});}catch{return reply({error:'Could not load review decisions.'},503);}
}

export async function POST(request:Request){
 if(!sameOrigin(request))return reply({error:'Please review candidates from this website.'},403);
 if(!await authorised())return reply({error:'Admin sign-in required.'},401);
 let body:{url?:string;action?:CurationAction};
 try{body=await request.json();}catch{return reply({error:'Invalid request.'},400);}
 if(!body.url||!['approved','rejected','deferred'].includes(body.action||''))return reply({error:'Choose a valid candidate action.'},400);
 const candidate=candidates.find(c=>c.url===body.url);if(!candidate)return reply({error:'Candidate is no longer in the review queue.'},404);
 const listing=body.action==='approved'?(parseCandidate(candidate)??undefined):undefined;
 if(body.action==='approved'&&!listing)return reply({error:'This candidate is missing year or price data. Open the advert and enrich the candidate before approval.'},422);
 try{
  const decision={url:candidate.url,action:body.action as CurationAction,decidedAt:new Date().toISOString(),candidate,listing};
  await saveCurationDecision(decision);return reply({ok:true,decision});
 }catch{return reply({error:'Could not save the review decision.'},503);}
}
