import type { Metadata } from 'next';
import AttendancePage from '@/components/siswa/AttendancePage';
import { routeTitles } from '@/constants/navigation';

export const metadata: Metadata = { title: routeTitles['/siswa/absensi'] };

export default function Page() {
  return <AttendancePage />;
}
