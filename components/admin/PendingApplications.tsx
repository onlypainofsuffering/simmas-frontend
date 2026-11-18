'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import { label, rowsOf } from '@/lib/api/client';
import { idOf } from '@/lib/utils/resource';
import { recordActivity } from '@/lib/utils/activity-log';
import { adminService } from '@/services/admin.service';
import { ConfirmDialog, type ConfirmRequest } from '@/components/shared/ConfirmDialog';
import { Feedback } from '@/components/shared/Feedback';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { SelectField } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import type { Row } from '@/types/api';

export default function PendingApplications() {
  const [applications, setApplications] = useState<Row[]>([]);
  const [teachers, setTeachers] = useState<Row[]>([]);
  const [selectedTeachers, setSelectedTeachers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [notice, setNotice] = useState('');
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);
  const [confirming, setConfirming] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const [applicationResponse, teacherResponse] = await Promise.all([
        adminService.getApplications(),
        adminService.getActiveTeachers(),
      ]);
      setApplications(rowsOf(applicationResponse));
      setTeachers(rowsOf(teacherResponse));
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Gagal memuat pengajuan dan guru aktif.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function runConfirm() {
    if (!confirm) return;
    const task = confirm.onConfirm;
    setConfirming(true);
    try {
      await task();
    } finally {
      setConfirming(false);
      setConfirm(null);
    }
  }

  function decide(application: Row, status: 'DISETUJUI' | 'DITOLAK') {
    const id = idOf(application);
    if (!id) {
      setErr('ID pengajuan tidak ditemukan.');
      return;
    }

    const body: Row = { status };
    if (status === 'DISETUJUI') {
      const teacherId = selectedTeachers[id];
      if (!teacherId) {
        setErr('Pilih guru pembimbing aktif sebelum menyetujui pengajuan.');
        return;
      }
      body.guruPembimbingId = Number(teacherId);
    }

    setErr('');
    setNotice('');
    const approved = status === 'DISETUJUI';
    setConfirm({
      title: approved ? 'Konfirmasi Persetujuan' : 'Konfirmasi Penolakan',
      description: approved
        ? 'Pengajuan ini akan disetujui dan guru pembimbing terpilih akan ditetapkan. Lanjutkan?'
        : 'Pengajuan ini akan ditolak. Lanjutkan?',
      confirmLabel: approved ? 'Setujui' : 'Tolak',
      tone: approved ? 'primary' : 'danger',
      onConfirm: async () => {
        try {
          const response = await adminService.decideApplication(id, body);
          recordActivity({
            action: approved ? 'Setujui' : 'Tolak',
            menu: 'Pengajuan Magang',
            detail: `${label(application.siswa?.nama)} - ${status}`,
          });
          setNotice(response?.message || `Pengajuan berhasil ${approved ? 'disetujui' : 'ditolak'}.`);
          await load();
        } catch (error) {
          setErr(error instanceof Error ? error.message : 'Gagal memproses pengajuan.');
        }
      },
    });
  }

  return (
    <>
      <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-100 bg-amber-50/70 p-4">
        <div>
          <h2 className="text-sm font-bold text-slate-800">Pengajuan Magang Menunggu Validasi</h2>
          <p className="mt-1 text-[11px] text-slate-500">Pilih guru aktif saat menyetujui penempatan siswa.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-semibold text-amber-800">
            {applications.length} pengajuan
          </span>
        </div>
      </div>
      <Feedback err={err} notice={notice} />
      {loading ? (
        <EmptyState text="Memuat pengajuan..." />
      ) : applications.length ? (
        <div className="divide-y divide-slate-100">
          {applications.map(application => {
            const id = idOf(application);
            return (
              <div key={id} className="grid gap-3 p-4 lg:grid-cols-[1fr_240px_auto] lg:items-center">
                <div>
                  <div className="text-xs font-semibold text-slate-800">
                    {label(application.siswa?.nama)} <span className="font-normal text-slate-400">· {label(application.siswa?.kelas)}</span>
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    {label(application.dudi?.nama_perusahaan)} · {label(application.posisi)}
                  </div>
                  <div className="mt-1 text-[10px] text-slate-400">
                    Diajukan {label(application.createdAt ? new Date(application.createdAt).toLocaleDateString('id-ID', { dateStyle: 'medium' }) : '-')}
                  </div>
                </div>
                <SelectField
                  value={selectedTeachers[id] || ''}
                  onValueChange={value => setSelectedTeachers({ ...selectedTeachers, [id]: value })}
                  placeholder="Pilih Guru Pembimbing Aktif"
                  options={teachers.map(teacher => ({
                    value: teacher.id,
                    label: `${label(teacher.namalengkap)} · ${label(teacher.jurusan)}`,
                  }))}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="danger" onClick={() => decide(application, 'DITOLAK')}>
                    <X size={14} /> Tolak
                  </Button>
                  <Button disabled={!selectedTeachers[id]} onClick={() => decide(application, 'DISETUJUI')}>
                    <Check size={14} /> Setujui Penempatan
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState text="Tidak ada pengajuan yang menunggu keputusan." />
      )}
      </Card>
      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.title || ''}
        description={confirm?.description || ''}
        confirmLabel={confirm?.confirmLabel}
        tone={confirm?.tone}
        loading={confirming}
        onCancel={() => setConfirm(null)}
        onConfirm={runConfirm}
      />
    </>
  );
}
