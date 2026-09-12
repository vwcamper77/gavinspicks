import {privateStore} from '../lib/private-records.mjs';
const store=await privateStore();
const [command='list',id]=process.argv.slice(2);
if(command==='resolve'){
 if(!id || !/^(recovered-\d{3}|[a-z0-9-]+)$/.test(id))throw Error('Supply an exact reviewed listing id.');
 await store.remove(`sold-reports/${id}.json`);
 console.log(`Resolved ${id}`);
}else if(command==='list'){
 for(const report of await store.all('sold-reports/')) console.log(JSON.stringify(report));
}else throw Error('Use list or resolve <id> after verification and publication.');
