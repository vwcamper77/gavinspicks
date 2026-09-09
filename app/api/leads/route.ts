import {put} from '@vercel/blob';
import {createHash} from 'node:crypto';

export const runtime='nodejs';
export const dynamic='force-dynamic';

const clean=(value:unknown,max:number)=>typeof value==='string'?value.trim().slice(0,max):'';
const emailOk=(value:string)=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)&&value.length<=254;

export async function POST(request:Request){
  let body:Record<string,unknown>;
  try{body=await request.json()}catch{return Response.json({error:'Invalid request.'},{status:400})}
  if(clean(body.website,200)) return Response.json({ok:true});
  const email=clean(body.email,254).toLowerCase();
  const lookingFor=clean(body.lookingFor,500);
  const consent=body.consent===true;
  if(!emailOk(email)) return Response.json({error:'Enter a valid email address.'},{status:400});
  if(!lookingFor) return Response.json({error:'Tell us what you are looking for.'},{status:400});
  if(!consent) return Response.json({error:'Consent is required for email updates.'},{status:400});
  const now=new Date().toISOString();
  const hash=createHash('sha256').update(email).digest('hex');
  const record={
    email,
    name:clean(body.name,120),
    lookingFor,
    budget:clean(body.budget,80),
    useCase:clean(body.useCase,80),
    makes:clean(body.makes,300),
    trigger:clean(body.trigger,80),
    source:clean(body.source,200),
    consent:true,
    consentAt:now,
    updatedAt:now,
  };
  await put(`leads/${hash}.json`,JSON.stringify(record),{
    access:'private',
    addRandomSuffix:false,
    allowOverwrite:true,
    contentType:'application/json',
  });
  return Response.json({ok:true},{status:201,headers:{'Cache-Control':'no-store'}});
}
