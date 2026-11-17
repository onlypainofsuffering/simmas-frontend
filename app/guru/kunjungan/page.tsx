import type { Metadata } from 'next';
import ResourcePage from '@/components/shared/ResourcePage';
import { routeTitles } from '@/constants/navigation';

export const metadata: Metadata = { title: routeTitles['/guru/kunjungan'] };

export default function Page() {
  return <ResourcePage role="guru" section="kunjungan" />;
}
