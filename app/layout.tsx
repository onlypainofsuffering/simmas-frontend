import './globals.css';
import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: { default: 'SIMMAS | Sistem Informasi Magang', template: '%s | SIMMAS' },
  description: 'Sistem monitoring dan manajemen magang sekolah',
  icons: { icon: '/Dynamic%20White%20S%20Logo%20on%20Blue.png' },
};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="id"><body>{children}</body></html>}
