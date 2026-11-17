import type { Metadata } from 'next';
import GuruJournalAttendancePage from '@/components/guru/GuruJournalAttendancePage';
import { routeTitles } from '@/constants/navigation';

export const metadata: Metadata = { title: routeTitles['/guru/jurnal-absensi'] };

export default function Page() {
  return <GuruJournalAttendancePage />;
}
