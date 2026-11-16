'use client';

import { useEffect, useState } from 'react';
import { dataOf, getUser, label, rowsOf } from '@/lib/api/client';
import { formatFullDate } from '@/lib/utils/format-date';
import { findRows, idOf } from '@/lib/utils/resource';
import { adminService } from '@/services/admin.service';
import { guruService } from '@/services/guru.service';
import { siswaService } from '@/services/siswa.service';
import { Feedback } from '@/components/shared/Feedback';
import { InfoTile } from '@/components/shared/InfoTile';
import { EmptyState } from '@/components/ui/EmptyState';
import { Card } from '@/components/ui/Card';
import { StatCard } from './StatCard';

export default function Dashboard({ role }: { role: string }) {
  const [datasets, setDatasets] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const sources: Record<string, () => Promise<any>> =
      role === 'admin'
        ? {
            students: adminService.getMonitoringStudents,
            teachers: adminService.getTeachers,
            companies: adminService.getCompanies,
            applications: adminService.getApplications,
            visits: adminService.getVisits,
          }
        : role === 'guru'
          ? {
              students: guruService.getStudents,
              journals: guruService.getJournals,
              visits: guruService.getVisits,
            }
          : {
              dashboard: siswaService.getDashboard,
              journals: siswaService.getJournals,
            };

    setLoading(true);
    setErrors([]);

    Promise.all(
      Object.entries(sources).map(async ([key, fetcher]) => {
        let result: any;
        try {
          result = await fetcher();
        } catch (error) {
          result = { requestError: error instanceof Error ? error.message : 'Gagal memuat data.' };
        }
        if (!active) return;
        setDatasets(current => ({ ...current, [key]: result }));
        if (result?.requestError) setErrors(current => [...current, result.requestError]);
        if (key === 'dashboard') setLoading(false);
      }),
    ).finally(() => {
      if (active) setLoading(false);
    });

    const refreshStudentDashboard = () => {
      if (document.visibilityState !== 'visible') return;
      siswaService
        .getDashboard()
        .then(response => {
          if (active) setDatasets(current => ({ ...current, dashboard: response }));
        })
        .catch(error => {
          if (active) {
            const message = error instanceof Error ? error.message : 'Gagal memuat dashboard siswa.';
            setErrors(current => (current.includes(message) ? current : [...current, message]));
          }
        });
    };

    if (role === 'siswa') window.addEventListener('focus', refreshStudentDashboard);

    return () => {
      active = false;
      if (role === 'siswa') window.removeEventListener('focus', refreshStudentDashboard);
    };
  }, [role]);

  const name = getUser()?.namalengkap || getUser()?.nama || getUser()?.name || 'Pengguna';
  const students = rowsOf(datasets.students);
  const teachers = rowsOf(datasets.teachers);
  const companies = rowsOf(datasets.companies);
  const applications = rowsOf(datasets.applications);
  const visits = rowsOf(datasets.visits);
  const journals = rowsOf(datasets.journals);
  const studentDashboard = datasets.dashboard;
  const studentData = dataOf(studentDashboard);
  const availableCompanies = findRows(studentData, ['list_dudi_disetujui']);

  if (role === 'siswa') {
    const applications = findRows(studentData, ['pengajuan_magang']);
    const approvedApplication = applications.find(application => application.status === 'DISETUJUI');
    const placement = approvedApplication || applications[0] || {};
    const student = studentData?.siswa || {};
    const attendanceToday = studentData?.absen_hari_ini;
    const company = placement.dudi?.nama_perusahaan || '-';
    const adviser = placement.guruPembimbing?.namalengkap || '-';
    const dashboardError = Boolean(studentDashboard?.requestError);
    const applicationStatus =
      placement.status || (loading ? 'Memuat status...' : dashboardError ? 'Status gagal dimuat' : 'Belum mengajukan magang');
    const internshipStatus =
      student.status === 'LULUS'
        ? 'LULUS'
        : approvedApplication
          ? 'SEDANG_MAGANG'
          : student.status || (loading ? 'Memuat status...' : dashboardError ? 'Status gagal dimuat' : 'BELUM_MAGANG');

    return (
      <div className="space-y-4">
        <div className="rounded-xl bg-gradient-to-r from-blue-700 to-sky-500 p-5 text-white">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-blue-100">
            Portal Siswa · {formatFullDate()}
          </div>
          <h2 className="mt-2 text-xl font-bold">Semangat magang, {label(student.nama || name)}!</h2>
          <p className="mt-1 text-xs text-blue-100">Pantau pengajuan, jurnal, dan kegiatan praktik kerja lapangan Anda.</p>
        </div>
        {errors.length > 0 && <Feedback err={errors.join(' ')} notice="" />}
        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard title="Tempat Magang" value={label(company)} detail="Lokasi praktik Anda" />
          <StatCard title="Status Magang" value={label(internshipStatus)} detail="Status siswa dari sekolah" tone="green" />
          <StatCard title="Jurnal Ditulis" value={journals.length} detail="Total jurnal kegiatan" tone="purple" />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Informasi Magang</h3>
                <p className="mt-1 text-[11px] text-slate-400">Detail tempat dan pembimbing magang Anda.</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">
                {label(internshipStatus)}
              </span>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <InfoTile label="Tempat Magang (DUDI)" value={label(company)} />
              <InfoTile label="Guru Pembimbing" value={label(adviser)} />
              <InfoTile label="Posisi" value={label(placement.posisi)} />
              <InfoTile label="Status Pengajuan" value={label(applicationStatus)} />
              <InfoTile
                label="Periode Pengajuan"
                value={label(placement.createdAt ? new Date(placement.createdAt).toLocaleDateString('id-ID', { dateStyle: 'medium' }) : '-')}
              />
              <InfoTile label="Kelas" value={label(student.kelas)} />
              <InfoTile
                label="Kehadiran Hari Ini"
                value={attendanceToday ? `${label(attendanceToday.statusAbsen)} · ${label(attendanceToday.jamMasuk)}` : 'Belum absen'}
              />
            </div>
          </Card>
          <Card className="p-5">
            <h3 className="text-sm font-bold text-slate-800">DUDI Disetujui</h3>
            <p className="mt-1 text-[11px] text-slate-400">Perusahaan yang tersedia untuk pengajuan magang.</p>
            {availableCompanies.length ? (
              <div className="mt-3 divide-y divide-slate-100">
                {availableCompanies.slice(0, 4).map((item, index) => (
                  <div key={idOf(item) || index} className="py-2 text-xs">
                    <div className="font-semibold text-slate-700">{label(item.nama_perusahaan)}</div>
                    <div className="mt-1 text-[10px] text-slate-400">{label(item.bidang_usaha || item.alamat)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 rounded-lg bg-slate-50 p-4 text-center text-xs text-slate-500">
                {loading ? 'Memuat daftar perusahaan...' : 'Belum ada perusahaan yang tersedia.'}
              </p>
            )}
          </Card>
        </div>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Jurnal Kegiatan Terbaru</h3>
              <p className="mt-1 text-[11px] text-slate-400">Aktivitas jurnal magang Anda.</p>
            </div>
            <span className="text-xs font-semibold text-blue-600">{journals.length} jurnal</span>
          </div>
          {journals.length ? (
            <div className="mt-3 divide-y divide-slate-100">
              {journals.slice(0, 4).map((item, index) => (
                <div key={idOf(item) || index} className="flex items-start justify-between gap-3 py-3">
                  <div>
                    <p className="text-xs font-medium text-slate-700">{label(item.rincianKegiatan || item.kegiatan || item.judul)}</p>
                    <p className="mt-1 text-[10px] text-slate-400">{label(item.tanggalPelaksana || item.tanggal)}</p>
                  </div>
                  <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] text-blue-700">
                    {label(item.status || 'MENUNGGU')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState text={loading ? 'Memuat jurnal...' : 'Belum ada jurnal kegiatan.'} />
          )}
        </Card>
      </div>
    );
  }

  type CardItem = {
    title: string;
    value: number;
    detail: string;
    tone: 'blue' | 'purple' | 'green' | 'amber';
  };
  const adminCards: CardItem[] = [
    { title: 'Total Siswa', value: students.length, detail: 'Data siswa terdaftar', tone: 'blue' },
    { title: 'Guru Pembimbing', value: teachers.length, detail: 'Guru terdaftar', tone: 'purple' },
    { title: 'Mitra DUDI', value: companies.length, detail: 'Perusahaan mitra', tone: 'green' },
    { title: 'Menunggu Validasi', value: applications.length, detail: 'Pengajuan menunggu keputusan', tone: 'amber' },
  ];
  const guruCards: CardItem[] = [
    { title: 'Siswa Bimbingan', value: students.length, detail: 'Siswa aktif magang', tone: 'blue' },
    {
      title: 'Jurnal Perlu Evaluasi',
      value: journals.filter(item => /MENUNGGU|REVISI/i.test(String(item.status || ''))).length,
      detail: 'Perlu ditinjau segera',
      tone: 'amber',
    },
    { title: 'Kunjungan Tercatat', value: visits.length, detail: 'Riwayat kunjungan', tone: 'green' },
  ];
  const cards = role === 'admin' ? adminCards : guruCards;

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-gradient-to-r from-blue-700 to-sky-500 p-5 text-white shadow-sm">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-blue-100">
          Portal {role} · {formatFullDate()}
        </div>
        <h2 className="mt-2 text-xl font-bold">Selamat datang kembali, {label(name)}</h2>
        <p className="mt-1 text-xs text-blue-100">
          {role === 'admin'
            ? `${applications.length} pengajuan menunggu validasi Anda.`
            : `${journals.length} jurnal bimbingan menunggu evaluasi.`}
        </p>
      </div>
      {errors.length > 0 && <Feedback err={errors.join(' ')} notice="" />}
      <div className={`grid gap-3 ${role === 'admin' ? 'sm:grid-cols-2 xl:grid-cols-4' : 'sm:grid-cols-3'}`}>
        {cards.map(card => (
          <StatCard
            key={card.title}
            title={card.title}
            value={loading ? '—' : card.value}
            detail={card.detail}
            tone={card.tone}
          />
        ))}
      </div>
      {role === 'admin' ? (
        <div className="grid gap-4 lg:grid-cols-5">
          <Card className="p-5 lg:col-span-3">
            <h3 className="text-sm font-bold text-slate-800">Status Pengajuan Magang</h3>
            <p className="mt-1 text-[11px] text-slate-400">Ringkasan permohonan yang menunggu keputusan admin.</p>
            <div className="mt-6 flex items-center justify-between rounded-lg bg-amber-50 p-4">
              <span className="text-xs font-medium text-amber-800">Menunggu validasi</span>
              <span className="text-lg font-bold text-amber-700">{loading ? '—' : applications.length}</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full w-full rounded-full bg-gradient-to-r from-blue-500 to-sky-400" />
            </div>
            <p className="mt-2 text-[10px] text-slate-400">Daftar pada dashboard mengikuti endpoint pengajuan yang menunggu keputusan.</p>
          </Card>
          <Card className="p-5 lg:col-span-2">
            <h3 className="text-sm font-bold text-slate-800">Aktivitas Kunjungan</h3>
            <p className="mt-1 text-[11px] text-slate-400">Catatan kunjungan terbaru guru pembimbing.</p>
            {visits.slice(0, 3).map((item, index) => (
              <div key={idOf(item) || index} className="border-b border-slate-100 py-3 last:border-0">
                <div className="text-xs font-semibold text-slate-700">
                  {label(item.tempat_magang || item.dudi?.nama_perusahaan || item.nama_perusahaan || item.dudi || item.tempatMagang)}
                </div>
                <div className="mt-1 text-[10px] text-slate-400">
                  {label(item.tanggalKunjungan || item.tanggal)} ·{' '}
                  {label(item.guru_pembimbing || item.guruPembimbing?.namalengkap || item.guru || item.guruPembimbing)}
                </div>
              </div>
            ))}
            {!visits.length && <EmptyState text={loading ? 'Memuat kunjungan...' : 'Belum ada kunjungan tercatat.'} />}
          </Card>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">Jurnal Perlu Evaluasi</h3>
              <span className="text-xs text-amber-600">{journals.length}</span>
            </div>
            {journals.length ? (
              journals.slice(0, 5).map((item, index) => (
                <div key={idOf(item) || index} className="border-b border-slate-100 py-3 last:border-0">
                  <div className="text-xs font-medium text-slate-700">{label(item.rincianKegiatan || item.kegiatan || item.judul)}</div>
                  <div className="mt-1 text-[10px] text-slate-400">
                    {label(item.siswa?.namalengkap || item.siswa || item.namaSiswa)} · {label(item.status || 'MENUNGGU')}
                  </div>
                </div>
              ))
            ) : (
              <EmptyState text={loading ? 'Memuat jurnal...' : 'Semua jurnal sudah dievaluasi.'} />
            )}
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">Daftar Siswa Bimbingan</h3>
              <span className="text-xs text-blue-600">{students.length} siswa</span>
            </div>
            {students.length ? (
              students.slice(0, 5).map((item, index) => {
                const student = item.siswa || item;
                const placement = item.penempatan || {};
                return (
                  <div key={student.id || index} className="flex items-center justify-between gap-3 border-b border-slate-100 py-3 last:border-0">
                    <div>
                      <div className="text-xs font-semibold text-slate-700">{label(student.nama || student.namalengkap)}</div>
                      <div className="mt-1 text-[10px] text-slate-400">
                        {label(student.kelas)} · {label(placement.dudi?.nama_perusahaan)}
                      </div>
                    </div>
                    <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] text-blue-700">
                      {label(student.status || placement.statusPengajuan || 'Aktif')}
                    </span>
                  </div>
                );
              })
            ) : (
              <EmptyState text={loading ? 'Memuat siswa...' : 'Belum ada siswa bimbingan.'} />
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
