import {cookies} from 'next/headers';
import {ADMIN_COOKIE,validSession} from '@/lib/admin-auth';
import AdminReports from '@/components/admin-reports';
export const dynamic='force-dynamic';
export const metadata={title:'Admin | Gavin’s Picks',robots:{index:false,follow:false}};
export default async function AdminPage(){return <AdminReports signedIn={validSession((await cookies()).get(ADMIN_COOKIE)?.value)}/>;}
