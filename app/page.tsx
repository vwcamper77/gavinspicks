import CarBrowser from '@/components/car-browser';
export const dynamic='force-dynamic';
export default function Home(){return <CarBrowser initialNow={Date.now()}/>;}
