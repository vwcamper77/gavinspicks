import feed from '@/lib/combined-feed';

export const runtime='nodejs';
export const dynamic='force-dynamic';

const cache=new Map<string,{at:number,status:'live'|'dead'|'unknown'}>();
const TTL=10*60*1000;

async function check(url:string){
  const cached=cache.get(url);
  if(cached&&Date.now()-cached.at<TTL)return cached.status;
  let status:'live'|'dead'|'unknown'='unknown';
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),5000);
  try{
    let r=await fetch(url,{method:'HEAD',redirect:'follow',cache:'no-store',signal:controller.signal,headers:{'user-agent':'GavinsPicks-LinkCheck/1.0'}});
    if(r.status===405||r.status===403){
      r=await fetch(url,{method:'GET',redirect:'follow',cache:'no-store',signal:controller.signal,headers:{'user-agent':'GavinsPicks-LinkCheck/1.0','range':'bytes=0-2047'}});
    }
    if(r.status===404||r.status===410)status='dead';
    else if(r.ok)status='live';
    try{await r.body?.cancel()}catch{}
  }catch{}
  clearTimeout(timer);
  cache.set(url,{at:Date.now(),status});
  return status;
}

export async function POST(request:Request){
  let body:{ids?:unknown};
  try{body=await request.json()}catch{return Response.json({dead:[],unknown:[]},{status:400})}
  const ids=Array.isArray(body.ids)?body.ids.filter((v):v is string=>typeof v==='string').slice(0,40):[];
  const known=new Map(feed.listings.map(l=>[l.id,l.url]));
  const selected=ids.flatMap(id=>known.has(id)?[[id,known.get(id)!] as const]:[]);
  const results=await Promise.all(selected.map(async([id,url])=>[id,await check(url)] as const));
  return Response.json({
    dead:results.filter(([,s])=>s==='dead').map(([id])=>id),
    unknown:results.filter(([,s])=>s==='unknown').map(([id])=>id),
  },{headers:{'Cache-Control':'no-store'}});
}
