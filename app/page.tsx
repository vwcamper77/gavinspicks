import CarBrowser from '@/components/car-browser';
import {safeHiddenListingIds} from '@/lib/public-availability';
export const dynamic='force-dynamic';
export default async function Home(){return <CarBrowser initialNow={Date.now()} initialHiddenIds={await safeHiddenListingIds()}/>;}
