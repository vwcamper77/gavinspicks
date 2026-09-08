import feed from '../data/feed.json' with {type:'json'};
import {marketProfile} from '../lib/market-evidence.ts';
const listings = feed.listings.filter(l => l.status === 'available' && !['vision-vn06lwy','bp-10652'].includes(l.id));
for (const car of listings) {
 const p=marketProfile(car);
 const gaps=[];
 if (!p) gaps.push('profile missing');
 else {
  if (!p.sales.some(s=>s.currency==='GBP'&&s.match==='variant')) gaps.push('matched UK achieved price missing');
  if (!p.rarity.source) gaps.push('UK allocation not sourced');
  if ((Date.now()-Date.parse(p.checkedAt))/86400000>90) gaps.push('research older than 90 days');
 }
 console.log(`${car.id}: ${gaps.length?gaps.join('; '):'evidence recorded (review comparability)'} `);
}
