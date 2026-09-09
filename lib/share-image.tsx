import {ImageResponse} from 'next/og';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import feed from '@/lib/combined-feed';
import {isLiveListing} from '@/lib/eligibility';

export async function shareImage(id:string|null){
 const car=feed.listings.find(l=>l.id===id&&isLiveListing(l,Date.now()));
 const logo=`data:image/png;base64,${(await readFile(path.join(process.cwd(),'public/supercar-logo.png'))).toString('base64')}`;
 let photo:string|undefined;
 // Only fetch an existing, approved seller photo. Never accept arbitrary image URLs.
 if(car){try{const r=await fetch(car.image,{signal:AbortSignal.timeout(5000)});const type=r.headers.get('content-type')||'';if(r.ok&&/^image\/(jpeg|png|webp)/.test(type)){const bytes=await r.arrayBuffer();if(bytes.byteLength<8000000)photo=`data:${type.split(';')[0]};base64,${Buffer.from(bytes).toString('base64')}`}}catch{/* A seller image outage must not break the branded preview. */}}
 return new ImageResponse(<div style={{display:'flex',width:'100%',height:'100%',background:'#102820',color:'#fffaf0',fontFamily:'sans-serif'}}>
  <div style={{display:'flex',width:car?'55%':'43%',height:'100%',position:'relative',alignItems:'center',justifyContent:'center',background:'#17372a'}}>
   <img src={photo||logo} alt="" width={car?660:516} height={630} style={{objectFit:photo?'cover':'contain',padding:photo?0:42}}/>
   {photo&&<div style={{display:'flex',position:'absolute',bottom:30,left:28,padding:'12px 18px',background:'#102820',color:'#e9b869',fontSize:21}}>ONE OF GAVIN’S PICKS</div>}
  </div>
  <div style={{display:'flex',flexDirection:'column',flex:1,padding:'38px 34px',justifyContent:'space-between',borderLeft:'3px solid #d19a45'}}>
   <div style={{display:'flex',alignItems:'center',gap:14}}><img src={logo} alt="" width={86} height={86}/><div style={{display:'flex',fontSize:22,color:'#e9b869',letterSpacing:2}}>GAVIN’S PICKS</div></div>
   <div style={{display:'flex',flexDirection:'column',gap:20}}><div style={{display:'flex',fontSize:car?43:60,fontWeight:700,lineHeight:1.08}}>{car?car.title:'Rare finds. Available now.'}</div><div style={{display:'flex',fontSize:car?35:26,color:'#e9b869'}}>{car?`£${car.price.toLocaleString('en-GB')}`:'Selected cars. Properly good finds.'}</div></div>
   <div style={{display:'flex',flexDirection:'column',gap:12}}><div style={{display:'flex',fontSize:22}}>{car?'A proper corker. See why Gavin picked it.':'Handpicked by Gavin. Available to buy.'}</div><div style={{display:'flex',fontSize:18,color:'#b8c9be'}}>gavinspicks.com</div></div>
  </div>
 </div>,{width:1200,height:630,headers:{'Cache-Control':'public, max-age=300, s-maxage=300'}});
}
