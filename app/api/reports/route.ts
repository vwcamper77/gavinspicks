import {privateStore} from '@/lib/private-records.mjs';
import feed from '@/lib/combined-feed';
import history from '@/data/history.json';
import {acceptSoldReport} from '@/lib/sold-reports';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function POST(request:Request){
 return acceptSoldReport(request,[...feed.listings,...history],{
  async exists(path){return (await (await privateStore()).read(path))!==null;},
  async save(path,report){await (await privateStore()).write(path,report);}
 });
}
