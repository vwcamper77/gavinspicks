import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import CarBrowser from '@/components/car-browser';
import feed from '@/data/feed.json';
import {isLiveListing} from '@/lib/eligibility';
export const dynamic='force-dynamic';
type Props={params:Promise<{id:string}>};
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const {id}=await params;
 const car=feed.listings.find(l=>l.id===id);
 if(!car||!isLiveListing(car,Date.now()))return {title:'Find no longer current | Gavin’s Picks',robots:{index:false,follow:true},openGraph:{title:'Find no longer current | Gavin’s Picks',description:'Discover the latest cars on Gavin’s Picks.',images:['/api/share-image']},twitter:{card:'summary_large_image',images:['/api/share-image']}};
 const title=`${car.title} | Gavin’s Picks`;
 const description=`£${car.price.toLocaleString('en-GB')} · ${car.gavinSays||car.notes}`;
 const image=`/api/share-image?id=${encodeURIComponent(id)}`;
 return {title,description,alternates:{canonical:`/cars/${encodeURIComponent(id)}`},openGraph:{title,description,url:`/cars/${encodeURIComponent(id)}`,siteName:'Gavin’s Picks',type:'website',images:[{url:image,width:1200,height:630,alt:car.title}]},twitter:{card:'summary_large_image',title,description,images:[image]}};
}
export default async function CarPage({params}:Props){
 const {id}=await params;
 const car=feed.listings.find(l=>l.id===id);
 if(!car)notFound();
 return <CarBrowser initialNow={Date.now()} selectedId={id}/>;
}
