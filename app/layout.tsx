import './globals.css';
import type { Metadata } from 'next';
export const metadata: Metadata = { title:'SIMMAS | Sistem Informasi Magang', description:'Sistem monitoring dan manajemen magang sekolah' };
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="id"><body>{children}</body></html>}
