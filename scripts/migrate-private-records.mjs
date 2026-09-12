import {readFile,writeFile} from 'node:fs/promises';
import {get,list} from '@vercel/blob';
import {createSupabaseStore} from '../lib/private-records.mjs';

const [command,path]=process.argv.slice(2);
if(!path)throw Error('Use export <private-backup-path> or import <private-backup-path>. Keep backups outside git.');
const prefixes=['sold-reports/','availability-reviews/','curation-decisions/','leads/'];
if(command==='export'){
 const records=[];
 for(const prefix of prefixes){
  let cursor;
  do{
   const page=await list({prefix,cursor,limit:1000});
   for(const blob of page.blobs){
    const result=await get(blob.url,{access:'private',useCache:false});
    if(!result||result.statusCode!==200)throw Error('Incomplete export: source record could not be read. Nothing imported.');
    records.push({path:blob.pathname,payload:await new Response(result.stream).json()});
   }
   cursor=page.hasMore?page.cursor:undefined;
  }while(cursor);
 }
 await writeFile(path,JSON.stringify({version:1,exportedAt:new Date().toISOString(),records},null,2),{mode:0o600,flag:'wx'});
 console.log(`Exported ${records.length} private records. Source unchanged.`);
}else if(command==='import'){
 const backup=JSON.parse(await readFile(path,'utf8'));
 if(backup.version!==1||!Array.isArray(backup.records))throw Error('Invalid backup.');
 const store=createSupabaseStore({url:process.env.GP_SUPABASE_URL,key:process.env.GP_SUPABASE_SECRET_KEY});
 const pending=[];const paths=new Set();
 for(const record of backup.records){
  if(paths.has(record.path)||!record.payload||typeof record.payload!=='object'||Array.isArray(record.payload))throw Error('Invalid or duplicate backup record.');
  paths.add(record.path);
  const existing=await store.read(record.path);
  if(existing!==null&&canonical(existing)!==canonical(record.payload))throw Error('Destination conflict. Reconcile decisions before importing; no records overwritten.');
  if(existing===null)pending.push(record);
 }
 for(const record of pending){
  await store.write(record.path,record.payload);
  const saved=await store.read(record.path);
  // JSONB can reorder object keys. Compare canonical objects recursively.
  if(canonical(saved)!==canonical(record.payload))throw Error('Imported record verification failed.');
 }
 console.log(`Verified ${backup.records.length} records; imported ${pending.length}. Source unchanged.`);
}else throw Error('Use export or import.');
function canonical(value){
 if(Array.isArray(value))return JSON.stringify(value.map(v=>JSON.parse(canonical(v))));
 if(value&&typeof value==='object')return JSON.stringify(Object.fromEntries(Object.keys(value).sort().map(k=>[k,JSON.parse(canonical(value[k]))])));
 return JSON.stringify(value);
}
