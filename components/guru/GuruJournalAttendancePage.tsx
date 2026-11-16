'use client';

import { useState } from 'react';
import ResourcePage from '@/components/shared/ResourcePage';
import GuruAttendancePanel from './GuruAttendancePanel';

export default function GuruJournalAttendancePage() {
  const [tab, setTab] = useState<'jurnal' | 'absensi'>('jurnal');

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setTab('jurnal')}
          className={`border-b-2 px-3 py-2 text-xs font-semibold ${
            tab === 'jurnal' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500'
          }`}
        >
          Jurnal
        </button>
        <button
          onClick={() => setTab('absensi')}
          className={`border-b-2 px-3 py-2 text-xs font-semibold ${
            tab === 'absensi' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500'
          }`}
        >
          Absensi Siswa
        </button>
      </div>
      {tab === 'jurnal' ? <ResourcePage role="guru" section="jurnal" /> : <GuruAttendancePanel />}
    </div>
  );
}
