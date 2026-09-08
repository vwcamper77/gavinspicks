import {list,get,del} from '@vercel/blob';
const [command='list',id]=process.argv.slice(2);
if(command==='resolve'){
 if(!id || !/^(recovered-\d{3}|[a-z0-9-]+)$/.test(id))throw Error('Supply an exact reviewed listing id.');
 await del(`sold-reports/${id}.json`);
 console.log(`Resolved ${id}`);
}else if(command==='list'){
 let cursor;
 do{const page=await list({prefix:'sold-reports/',cursor});for(const item of page.blobs){const result=await get(item.url,{access:'private',useCache:false});if(result?.statusCode===200)console.log(await new Response(result.stream).text());}cursor=page.hasMore?page.cursor:undefined;}while(cursor);
}else throw Error('Use list or resolve <id> after verification and publication.');
