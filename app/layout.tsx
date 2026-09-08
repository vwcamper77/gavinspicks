import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'Gavin’s Picks — Cars',description:'Verified UK manual and limited-production car finds, 1995–2010 plus named BMW 1M and Audi ur-quattro exceptions, £10,000–£100,000.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en-GB"><body>{children}</body></html>}
