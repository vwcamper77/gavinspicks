import {get,list} from '@vercel/blob';

const esc=(v='')=>`"${String(v).replaceAll('"','""')}"`;
const rows=[['email','name','lookingFor','budget','useCase','makes','trigger','source','consentAt','updatedAt']];
let cursor;
do{
  const page=await list({prefix:'leads/',cursor,limit:100});
  for(const blob of page.blobs){
    const item=await get(blob.pathname,{access:'private',useCache:false});
    if(!item)continue;
    const record=await new Response(item.stream).json();
    rows.push(rows[0].map(k=>record[k]??''));
  }
  cursor=page.cursor;
}while(cursor);
console.log(rows.map(row=>row.map(esc).join(',')).join('\n'));
