import {cookies} from 'next/headers';
import {ADMIN_COOKIE,validSession,sameOrigin} from '@/lib/admin-auth';
import {readReports,readReviews,saveReview,removeReport} from '@/lib/admin-store';
import {latestReviews} from '@/lib/availability-review';
import {reviewAvailability} from '@/lib/review-service';
import feed from '@/lib/combined-feed';
import history from '@/data/history.json';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const reply=(body:object,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
const authorized=async()=>validSession((await cookies()).get(ADMIN_COOKIE)?.value);
export async function GET(){
 if(!await authorized())return reply({error:'Please sign in.'},401);
 try{
  const [reports,reviews]=await Promise.all([readReports(),readReviews()]);
  const pending=reports.filter(r=>!reviews.some(v=>v.id===r.id&&v.reportedAt===r.reportedAt));
  return reply({reports:pending.sort((a,b)=>b.reportedAt.localeCompare(a.reportedAt)),hidden:latestReviews(reviews).filter(r=>r.action==='hide'),reviews:reviews.sort((a,b)=>b.reviewedAt.localeCompare(a.reviewedAt))});
 }catch{return reply({error:'Could not load availability reports. Please try again.'},503)}
}
export async function POST(request:Request){
 if(!await authorized())return reply({error:'Please sign in.'},401);
 if(!sameOrigin(request))return reply({error:'Please review from this website.'},403);
 let input;
 try{const text=await request.text();if(text.length>4096)return reply({error:'Review is too long.'},413);input=JSON.parse(text);}catch{return reply({error:'Invalid review.'},400)}
 try{
  const result=await reviewAvailability(input,[...feed.listings,...history],{readReports,readReviews,saveReview,removeReport});
  return reply(result,result.status);
 }catch{return reply({error:'Could not save the review. Nothing is confirmed; refresh before retrying.'},503)}
}
