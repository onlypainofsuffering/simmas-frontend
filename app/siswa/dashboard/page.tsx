import type { Metadata } from 'next';
import Dashboard from '@/components/dashboard/Dashboard';
import { routeTitles } from '@/constants/navigation';

export const metadata: Metadata = { title: routeTitles['/siswa/dashboard'] };

export default function Page() {
  return <Dashboard role="siswa" />;
}
