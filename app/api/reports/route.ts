import {get,put} from '@vercel/blob';
import feed from '@/data/feed.json';
import history from '@/data/history.json';
import {acceptSoldReport} from '@/lib/sold-reports';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function POST(request:Request){
 return acceptSoldReport(request,[...feed.listings,...history],{
  async exists(path){const r=await get(path,{access:'private',useCache:false}); if(r?.statusCode===200)await r.stream.cancel(); return r!==null;},
  async save(path,report){await put(path,JSON.stringify(report),{access:'private',addRandomSuffix:false,allowOverwrite:false,contentType:'application/json'});}
 });
}
