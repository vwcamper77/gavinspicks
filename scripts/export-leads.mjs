import {privateStore} from '../lib/private-records.mjs';

const esc=(v='')=>`"${String(v).replaceAll('"','""')}"`;
const rows=[['email','name','lookingFor','budget','useCase','makes','trigger','source','consentAt','updatedAt']];
for(const record of await (await privateStore()).all('leads/')) rows.push(rows[0].map(k=>record[k]??''));
console.log(rows.map(row=>row.map(esc).join(',')).join('\n'));
