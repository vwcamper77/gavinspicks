import {createHash,createHmac,timingSafeEqual} from 'node:crypto';
export const ADMIN_COOKIE='gp_admin';
export const SESSION_SECONDS=30*24*60*60;
const OWNER_PASSCODE_SHA256='ad178de44c4f3753663b8ea75da2e6e9c9defe53c78c638feb00f8c369f1d1c0';
const digest=(value:string)=>createHash('sha256').update(value).digest();
const hex=(value:string)=>createHash('sha256').update(value).digest('hex');
export function validAdminKey(value:unknown,key=process.env.GP_ADMIN_KEY):boolean{
 return !!key&&key.length>=40&&typeof value==='string'&&value.length<=256&&timingSafeEqual(digest(value),digest(key));
}
export function validOwnerPasscode(value:unknown):boolean{
 if(typeof value!=='string'||value.length<8||value.length>64)return false;
 return timingSafeEqual(Buffer.from(hex(value),'hex'),Buffer.from(OWNER_PASSCODE_SHA256,'hex'));
}
export function createSession(key=process.env.GP_ADMIN_KEY,now=Date.now()):string{
 if(!key||key.length<40)throw Error('Admin access is not configured.');
 const expiry=String(now+SESSION_SECONDS*1000);
 return `${expiry}.${createHmac('sha256',key).update('admin:'+expiry).digest('hex')}`;
}
export function validSession(value:string|undefined,key=process.env.GP_ADMIN_KEY,now=Date.now()):boolean{
 if(!key||key.length<40||!value)return false;
 const [expiry,signature,...extra]=value.split('.');
 if(extra.length||!/^\d{13}$/.test(expiry)||!/^[a-f0-9]{64}$/.test(signature??''))return false;
 if(Number(expiry)<=now||Number(expiry)>now+SESSION_SECONDS*1000)return false;
 return timingSafeEqual(Buffer.from(signature,'hex'),createHmac('sha256',key).update('admin:'+expiry).digest());
}
export function sameOrigin(request:Request){return request.headers.get('origin')===new URL(request.url).origin;}
