import {cookies} from 'next/headers';
import {ADMIN_COOKIE,SESSION_SECONDS,validAdminKey,createSession,sameOrigin} from '@/lib/admin-auth';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const reply=(body:object,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
export async function POST(request:Request){
 if(!sameOrigin(request))return reply({error:'Please sign in from this website.'},403);
 if(!process.env.GP_ADMIN_KEY)return reply({error:'Admin access has not been configured.'},503);
 let key:unknown;
 try{const text=await request.text();if(text.length>512)return reply({error:'Invalid access key.'},400);key=JSON.parse(text).key;}catch{return reply({error:'Invalid access key.'},400)}
 if(!validAdminKey(key))return reply({error:'That access key is not correct.'},401);
 (await cookies()).set(ADMIN_COOKIE,createSession(),{httpOnly:true,secure:new URL(request.url).protocol==='https:',sameSite:'strict',path:'/',maxAge:SESSION_SECONDS});
 return reply({ok:true});
}
export async function DELETE(request:Request){
 if(!sameOrigin(request))return reply({error:'Please sign out from this website.'},403);
 (await cookies()).delete(ADMIN_COOKIE);return reply({ok:true});
}
