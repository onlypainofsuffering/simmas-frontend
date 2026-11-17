import type { Metadata } from 'next';
import PasswordPage from '@/components/shared/PasswordPage';
import { routeTitles } from '@/constants/navigation';

export const metadata: Metadata = { title: routeTitles['/admin/pengaturan'] };

export default function Page() {
  return <PasswordPage role="admin" />;
}
