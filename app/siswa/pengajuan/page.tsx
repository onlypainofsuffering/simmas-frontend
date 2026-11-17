import type { Metadata } from 'next';
import StudentApplication from '@/components/siswa/StudentApplication';
import { routeTitles } from '@/constants/navigation';

export const metadata: Metadata = { title: routeTitles['/siswa/pengajuan'] };

export default function Page() {
  return <StudentApplication />;
}
