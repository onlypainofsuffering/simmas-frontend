import type { Metadata } from 'next';
import AdminPlacementsPage from '@/components/admin/AdminPlacementsPage';
import { routeTitles } from '@/constants/navigation';

export const metadata: Metadata = { title: routeTitles['/admin/penempatan'] };

export default function Page() {
  return <AdminPlacementsPage />;
}
