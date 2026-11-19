import type { Metadata } from 'next';
import ProfilePage from '@/components/shared/ProfilePage';
import { routeTitles } from '@/constants/navigation';

export const metadata: Metadata = { title: routeTitles['/siswa/profil'] };

export default function Page() {
  return <ProfilePage role="siswa" />;
}
