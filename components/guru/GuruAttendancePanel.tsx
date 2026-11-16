'use client';

import { useCallback, useEffect, useState } from 'react';
import { dataOf, label, rowsOf } from '@/lib/api/client';
import { cellValue, titleCase } from '@/lib/utils/resource';
import { guruService } from '@/services/guru.service';
import { StatCard } from '@/components/dashboard/StatCard';
import { Feedback } from '@/components/shared/Feedback';
import { InfoTile } from '@/components/shared/InfoTile';
import { EmptyState } from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import type { Row } from '@/types/api';

export default function GuruAttendancePanel() {
  const [students, setStudents] = useState<Row[]>([]);
  const [detail, setDetail] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    try {
      setStudents(rowsOf(await guruService.getStudents()));
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Gagal memuat siswa bimbingan.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function openDetail(studentId: number) {
    setErr('');
    setDetailLoading(true);
    try {
      setDetail(dataOf(await guruService.getStudentDetail(studentId)));
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Gagal memuat detail absensi.');
    } finally {
      setDetailLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard title="Total Bimbingan" value={students.length} detail="Siswa dibimbing" />
        <StatCard
          title="Sedang Aktif"
          value={students.filter(item => item.siswa?.status === 'SEDANG_MAGANG').length}
          detail="Aktif di tempat magang"
          tone="amber"
        />
        <StatCard
          title="Selesai / Dinilai"
          value={students.filter(item => item.siswa?.status === 'LULUS').length}
          detail="Sudah menyelesaikan PKL"
          tone="green"
        />
      </div>
      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 p-4">
          <h2 className="text-sm font-bold text-slate-800">Statistik dan Riwayat Absensi Siswa</h2>
          <p className="mt-1 text-[11px] text-slate-400">Pilih siswa bimbingan untuk melihat statistik kehadiran dan riwayat absen.</p>
        </div>
        {err && <Feedback err={err} notice="" />}
        {loading ? (
          <EmptyState text="Memuat siswa bimbingan..." />
        ) : students.length ? (
          <div className="overflow-x-auto">
            <Table className="min-w-[560px]">
              <thead className="bg-slate-50 text-[10px] uppercase text-slate-400">
                <tr>
                  {['Nama Siswa', 'Kelas', 'Tempat Magang', 'Status', 'Aksi'].map(item => (
                    <th key={item} className="px-4 py-3">
                      {item}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map(item => {
                  const student = item.siswa || item;
                  const placement = item.penempatan || {};
                  return (
                    <tr key={student.id}>
                      <td className="px-4 py-3 font-semibold text-slate-700">{label(student.nama)}</td>
                      <td className="px-4 py-3">{label(student.kelas)}</td>
                      <td className="px-4 py-3">{label(placement.dudi?.nama_perusahaan)}</td>
                      <td className="px-4 py-3">{label(student.status)}</td>
                      <td className="px-4 py-3">
                        <Button variant="light" onClick={() => openDetail(student.id)}>
                          Lihat Detail
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        ) : (
          <EmptyState text="Belum ada siswa bimbingan." />
        )}
      </Card>
      {detailLoading && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/30 text-sm font-medium text-white">
          Memuat detail absensi...
        </div>
      )}
      {detail && (
        <Modal title={`Absensi · ${label(detail.siswa?.nama)}`} onClose={() => setDetail(null)}>
          <div className="grid gap-3 sm:grid-cols-4">
            {Object.entries(detail.statistik_kehadiran || {}).map(([key, value]) => (
              <InfoTile key={key} label={titleCase(key)} value={label(value)} />
            ))}
          </div>
          <div className="mt-4">
            <InfoTile label="Tempat Magang" value={label(detail.tempat_magang?.nama_perusahaan)} />
          </div>
          <div className="mt-5">
            <h3 className="text-xs font-bold text-slate-700">Riwayat Absensi</h3>
            {detail.riwayat_absensi?.length ? (
              <div className="mt-2 max-h-64 overflow-auto">
                <Table>
                  <thead className="bg-slate-50 text-[10px] text-slate-400">
                    <tr>
                      {['Tanggal', 'Status', 'Masuk', 'Pulang', 'Keterangan', 'Foto'].map(value => (
                        <th key={value} className="px-3 py-2">
                          {value}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {detail.riwayat_absensi.map((item: Row) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2">{label(cellValue(item, 'tanggal'))}</td>
                        <td className="px-3 py-2">{label(item.statusAbsen)}</td>
                        <td className="px-3 py-2">{label(item.jamMasuk)}</td>
                        <td className="px-3 py-2">{label(item.jamKeluar)}</td>
                        <td className="px-3 py-2">{label(item.keterangan)}</td>
                        <td className="space-x-1 px-3 py-2">
                          {item.fotoMasukUrl && (
                            <a className="text-blue-600 hover:underline" href={item.fotoMasukUrl} target="_blank" rel="noreferrer">
                              Masuk
                            </a>
                          )}
                          {item.fotoKeluarUrl && (
                            <a className="text-blue-600 hover:underline" href={item.fotoKeluarUrl} target="_blank" rel="noreferrer">
                              Pulang
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            ) : (
              <EmptyState text="Belum ada riwayat absensi." />
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
