'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { Table } from '@/components/ui/Table';
import { PageHeader } from '@/components/shared/PageHeader';
import { usePagination } from '@/hooks/usePagination';
import { getActivities, type ActivityLogEntry } from '@/lib/utils/activity-log';

function actionClass(action: string) {
  if (action === 'Hapus' || action === 'Tolak') return 'bg-rose-50 text-rose-700';
  if (action === 'Tambah' || action === 'Setujui' || action === 'Verifikasi') return 'bg-emerald-50 text-emerald-700';
  return 'bg-blue-50 text-blue-700';
}

export default function AuditUnavailablePage() {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const { page, setPage, totalPages, pageItems } = usePagination(logs, 15);

  useEffect(() => {
    const update = () => setLogs(getActivities());
    update();
    window.addEventListener('simmas-activity-updated', update);
    window.addEventListener('storage', update);
    return () => {
      window.removeEventListener('simmas-activity-updated', update);
      window.removeEventListener('storage', update);
    };
  }, []);

  return (
    <div className="space-y-4">
      <PageHeader
        description="Catatan aksi tambah, ubah, dan hapus data."
        hint="Log disimpan di browser perangkat ini."
      />
      <Card className="overflow-hidden">
        {pageItems.length ? (
          <>
            <div className="overflow-x-auto">
              <Table className="min-w-[760px]">
                <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Waktu</th>
                    <th className="px-5 py-4 font-semibold">Aksi</th>
                    <th className="px-5 py-4 font-semibold">Menu</th>
                    <th className="px-5 py-4 font-semibold">Keterangan</th>
                    <th className="px-5 py-4 font-semibold">Pengguna</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pageItems.map(item => (
                    <tr key={item.id} className="text-slate-600">
                      <td className="whitespace-nowrap px-5 py-3">
                        {new Date(item.occurredAt).toLocaleString('id-ID', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${actionClass(item.action)}`}>
                          {item.action}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-semibold text-slate-700">{item.menu}</td>
                      <td className="px-5 py-3">{item.detail}</td>
                      <td className="px-5 py-3">{item.actor}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
            <div className="border-t border-slate-100 px-5 py-4">
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          </>
        ) : (
          <EmptyState text="Belum ada aktivitas yang tercatat." />
        )}
      </Card>
    </div>
  );
}
