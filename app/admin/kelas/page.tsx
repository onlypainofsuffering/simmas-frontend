import type { Metadata } from 'next';
import ResourcePage from '@/components/shared/ResourcePage';
import { routeTitles } from '@/constants/navigation';

export const metadata: Metadata = { title: routeTitles['/admin/kelas'] };

export default function Page() {
  return <ResourcePage role="admin" section="kelas" />;
}
