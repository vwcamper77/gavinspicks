import {shareImage} from '@/lib/share-image';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:Request){return shareImage(new URL(request.url).searchParams.get('id'))}
