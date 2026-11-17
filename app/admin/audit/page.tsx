import type { Metadata } from 'next';
import AuditUnavailablePage from '@/components/admin/AuditUnavailablePage';
import { routeTitles } from '@/constants/navigation';

export const metadata: Metadata = { title: routeTitles['/admin/audit'] };

export default function Page() {
  return <AuditUnavailablePage />;
}
