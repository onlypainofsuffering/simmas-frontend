'use client';

import { useState } from 'react';
import ResourcePage from '@/components/shared/ResourcePage';

export default function AdminMonitoringPage() {
  const [tab, setTab] = useState<'siswa' | 'kunjungan'>('siswa');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 border-b border-slate-200">
        <button
          onClick={() => setTab('siswa')}
          className={`border-b-2 px-3 py-2 text-xs font-semibold ${
            tab === 'siswa' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500'
          }`}
        >
          Monitoring Kehadiran & Jurnal Siswa
        </button>
        <button
          onClick={() => setTab('kunjungan')}
          className={`border-b-2 px-3 py-2 text-xs font-semibold ${
            tab === 'kunjungan' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500'
          }`}
        >
          Kunjungan Guru Pembimbing
        </button>
      </div>
      <ResourcePage role="admin" section={tab === 'siswa' ? 'monitoring-siswa' : 'monitoring-kunjungan'} />
    </div>
  );
}
