import type { Metadata } from 'next';
import AdminMonitoringPage from '@/components/admin/AdminMonitoringPage';
import { routeTitles } from '@/constants/navigation';

export const metadata: Metadata = { title: routeTitles['/admin/monitoring'] };

export default function Page() {
  return <AdminMonitoringPage />;
}
