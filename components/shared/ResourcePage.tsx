'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Eye, Filter, Pencil, Plus, RefreshCw, Save, Search, Trash2, X } from 'lucide-react';
import { api, dataOf, json, label, rowsOf } from '@/lib/api/client';
import { resourceConfigs, preferredColumns, statusChoices } from '@/constants/resource-config';
import { cellValue, idOf, titleCase } from '@/lib/utils/resource';
import { toInputDate } from '@/lib/utils/format-date';
import { adminService } from '@/services/admin.service';
import { guruService } from '@/services/guru.service';
import { FormField } from '@/components/forms/FormField';
import { Feedback } from '@/components/shared/Feedback';
import { PageHeader } from '@/components/shared/PageHeader';
import { SearchInput } from '@/components/shared/SearchInput';
import { StatCard } from '@/components/dashboard/StatCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loading } from '@/components/ui/Loading';
import Modal from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Table } from '@/components/ui/Table';
import type { Row } from '@/types/api';

export default function ResourcePage({ role, section }: { role: string; section: string }) {
  const cfg = resourceConfigs[`${role}:${section}`] || {};
  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [notice, setNotice] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [modal, setModal] = useState(false);
  const [edit, setEdit] = useState<Row | null>(null);
  const [form, setForm] = useState<Row>({});
  const [query, setQuery] = useState('');
  const [detail, setDetail] = useState<Row | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [dudiOptions, setDudiOptions] = useState<Row[]>([]);

  const fields = edit ? cfg.editFields || cfg.fields || [] : cfg.fields || [];

  // Endpoint /admin/penempatan/:id memakai ID siswa (lihat AdminService.updatePenempatan),
  // sedangkan baris penempatan adalah data pengajuan yang memiliki `id` sendiri.
  const rowId = (item: Row) => {
    if (role === 'admin' && section === 'penempatan-data') {
      const siswaId = item.siswa?.id ?? item.siswaId ?? item.id;
      return siswaId === null || siswaId === undefined ? '' : String(siswaId);
    }
    return idOf(item);
  };
  const cols = useMemo(() => {
    const keys = Array.from(new Set(data.slice(0, 8).flatMap(item => Object.keys(item || {}))));
    const visible = keys.filter(key => !['id', 'password', 'updatedat', 'createdat', 'role', 'fotoUrl'].includes(key.toLowerCase()));
    const preferred = preferredColumns[`${role}:${section}`] || [];
    return [...preferred.filter(key => visible.includes(key)), ...visible.filter(key => !preferred.includes(key))].slice(0, 7);
  }, [data, role, section]);

  const load = useCallback(async () => {
    if (!cfg.path) return;
    setLoading(true);
    setErr('');
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });
      const suffix = params.toString();
      const result = await api(`${cfg.path}${suffix ? `?${suffix}` : ''}`);
      setData(rowsOf(result));
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Gagal memuat data.');
    } finally {
      setLoading(false);
    }
  }, [cfg.path, filters]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (role !== 'guru' || section !== 'kunjungan') return;
    guruService
      .getGuidedCompanies()
      .then(result => setDudiOptions(rowsOf(result)))
      .catch(error => setErr(error instanceof Error ? error.message : 'Gagal memuat DUDI bimbingan.'));
  }, [role, section]);

  function openForm(item: Row | null = null) {
    setEdit(item);
    const initial: Row = {};
    (item ? cfg.editFields || cfg.fields || [] : cfg.fields || []).forEach(field => {
      initial[field.name] =
        field.type === 'date' ? toInputDate(item?.[field.name]) : item?.[field.name] ?? (field.name === 'namalengkap' ? item?.nama : '');
    });
    setForm(initial);
    setErr('');
    setNotice('');
    setModal(true);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const path = edit ? `${cfg.path}/${rowId(edit)}` : cfg.createPath;
    if (!path || (edit && !rowId(edit))) {
      setErr('ID atau endpoint data tidak ditemukan.');
      return;
    }
    setErr('');
    try {
      const isMultipart = fields.some(field => field.type === 'file');
      if (isMultipart) {
        const body = new FormData();
        fields.forEach(field => {
          const value = form[field.name];
          if (field.type === 'file') {
            if (value) body.append(field.name, value);
          } else if (edit || (value !== '' && value !== null && value !== undefined)) {
            body.append(field.name, String(value ?? ''));
          }
        });
        await api(path, { method: edit ? 'PATCH' : 'POST', body });
      } else {
        const body: Row = {};
        fields.forEach(field => {
          const value = form[field.name];
          if (value === '' || value === null || value === undefined) return;
          if (['dudiId', 'guruPembimbingId'].includes(field.name)) {
            body[field.name] = Number(value);
          } else if (field.name === 'kuota_peserta') {
            body[field.name] = value === true || value === 'true';
          } else {
            body[field.name] = value;
          }
        });
        const response = await api(path, json(edit ? 'PATCH' : 'POST', body));
        const userEmail = response?.data?.email;
        const message = response?.message || 'Data berhasil disimpan.';
        setModal(false);
        setNotice(userEmail && !edit ? `${message}. Email akun: ${userEmail}` : message);
        await load();
        return;
      }
      setModal(false);
      setNotice('Data berhasil disimpan.');
      await load();
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Gagal menyimpan data.');
    }
  }

  async function action(item: Row, actionName: string) {
    const id = rowId(item);
    if (!id) {
      setErr('ID data tidak ditemukan.');
      return;
    }
    setErr('');
    setNotice('');
    try {
      if (actionName === 'delete') {
        if (!window.confirm('Yakin ingin menghapus data ini?')) return;
        await api(`${cfg.path}/${id}`, { method: 'DELETE' });
      } else if (actionName === 'approve' || actionName === 'reject') {
        const body: Row = { status: actionName === 'approve' ? 'DISETUJUI' : 'DITOLAK' };
        if (actionName === 'approve') {
          const teacherId = window.prompt('Masukkan ID guru pembimbing aktif (wajib):');
          if (teacherId === null) return;
          if (!/^\d+$/.test(teacherId.trim())) throw new Error('ID guru pembimbing aktif wajib berupa angka.');
          body.guruPembimbingId = Number(teacherId);
        }
        await adminService.decideApplication(id, body);
      } else if (actionName === 'verify') {
        await adminService.verifyCompany(id);
      } else if (actionName === 'status') {
        const choices = statusChoices[section] || [];
        const value = window.prompt(`Status baru (${choices.join(' / ')}):`, choices[0]);
        if (value === null) return;
        if (!choices.includes(value.trim())) {
          throw new Error(`Status harus salah satu dari: ${choices.join(', ')}.`);
        }
        if (role === 'admin' && section === 'guru') {
          await adminService.updateTeacherStatus(id, value.trim());
        } else if (role === 'admin' && section === 'siswa') {
          await adminService.updateStudentStatus(id, value.trim());
        } else {
          await adminService.updatePlacementStatus(id, value.trim());
        }
      } else if (actionName === 'grade') {
        const rawScore = window.prompt('Masukkan nilai PKL (0–100):');
        if (rawScore === null) return;
        if (!rawScore.trim()) throw new Error('Nilai PKL wajib diisi.');
        const nilai = Number(rawScore);
        if (!Number.isFinite(nilai) || nilai < 0 || nilai > 100) {
          throw new Error('Nilai PKL harus berupa angka dari 0 sampai 100.');
        }
        const catatan = window.prompt('Catatan penilaian (opsional):') || '';
        await guruService.gradeStudent(id, { nilai, catatan });
      } else if (actionName === 'journal') {
        const value = window.prompt('Keputusan jurnal (REVISI atau DISETUJUI_GURU):');
        if (value === null) return;
        if (!['REVISI', 'DISETUJUI_GURU'].includes(value.trim())) {
          throw new Error('Keputusan harus REVISI atau DISETUJUI_GURU.');
        }
        const catatanGuru = window.prompt('Catatan guru (opsional):') || '';
        await guruService.decideJournal(id, { status: value.trim(), catatanGuru });
      } else if (actionName === 'detail' && role === 'guru' && section === 'siswa') {
        setDetailLoading(true);
        try {
          setDetail(dataOf(await guruService.getStudentDetail(id)));
        } finally {
          setDetailLoading(false);
        }
        return;
      } else if (actionName === 'detail') {
        setDetail(item);
        return;
      }
      setNotice('Aksi berhasil diproses.');
      await load();
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Aksi gagal diproses.');
    }
  }

  const filtered = data.filter(item => JSON.stringify(item).toLowerCase().includes(query.toLowerCase()));
  const activeCount = data.filter(item =>
    ['AKTIF', 'SEDANG_MAGANG', 'TERVERIFIKASI', 'DISETUJUI'].includes(String(item.status || '').toUpperCase()),
  ).length;
  const pendingCount = data.filter(item => /MENUNGGU|DITINJAU|VALIDASI/i.test(String(item.status || ''))).length;

  return (
    <div className="space-y-5">
      <PageHeader
        description={<>Kelola dan pantau data {section.replaceAll('-', ' ')}.</>}
        hint="Data dimuat langsung dari API SIMMAS."
      >
        {cfg.createPath && (
          <Button onClick={() => openForm()}>
            <Plus size={16} /> Tambah Data
          </Button>
        )}
        {cfg.path && (
          <Button variant="light" onClick={load}>
            <RefreshCw size={15} /> Refresh
          </Button>
        )}
      </PageHeader>

      {cfg.path && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Total Data" value={data.length} detail="Data tersedia" />
          <StatCard title="Status Aktif" value={activeCount} detail="Data aktif / berjalan" tone="green" />
          <StatCard title="Perlu Perhatian" value={pendingCount} detail="Menunggu tindak lanjut" tone="amber" />
          <StatCard
            title="Hasil Ditampilkan"
            value={filtered.length}
            detail={query ? 'Sesuai pencarian' : 'Setelah filter'}
            tone="purple"
          />
        </div>
      )}

      {cfg.filters?.length ? (
        <div className="card flex flex-wrap items-end gap-3 p-4">
          <div className="flex items-center gap-2 pb-2 text-xs font-semibold text-slate-600">
            <Filter size={15} /> Filter
          </div>
          {cfg.filters.map(key => (
            <label key={key} className="min-w-10 flex-1 text-[11px] font-semibold text-slate-500">
              {titleCase(key)}
              {key === 'status' || key === 'jurusan' ? (
                <Select className="mt-1" value={filters[key] || ''} onChange={event => setFilters({ ...filters, [key]: event.target.value })}>
                  <option value="">Semua</option>
                  {(key === 'jurusan' ? ['RPL', 'TKJ', 'MM'] : statusChoices[section] || ['BELUM_MAGANG', 'SEDANG_MAGANG', 'LULUS']).map(value => (
                    <option key={value}>{value}</option>
                  ))}
                </Select>
              ) : (
                <Input
                  className="mt-1"
                  placeholder={`Cari ${titleCase(key)}`}
                  value={filters[key] || ''}
                  onChange={event => setFilters({ ...filters, [key]: event.target.value })}
                />
              )}
            </label>
          ))}
          <Button variant="light" onClick={() => setFilters({})}>
            Reset
          </Button>
        </div>
      ) : null}

      <div className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Daftar {titleCase(section)}</h2>
            <p className="mt-1 text-[11px] text-slate-400">{filtered.length} data ditemukan</p>
          </div>
          <SearchInput value={query} onChange={setQuery} />
        </div>
        <Feedback err={err} notice={notice} />
        {loading ? (
          <Loading />
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-slate-50 text-slate-400">
              <Search />
            </div>
            <p className="text-sm font-semibold text-slate-600">Belum ada data</p>
            <p className="mt-1 text-xs text-slate-400">Data belum tersedia atau endpoint mengembalikan hasil kosong.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-[700px]">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400">
                <tr>
                  {cols.map(key => (
                    <th key={key} className="px-5 py-4 font-semibold">
                      {titleCase(key)}
                    </th>
                  ))}
                  <th className="px-5 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item, index) => (
                  <tr key={rowId(item) || index} className="hover:bg-slate-50/70">
                    {cols.map(key => (
                      <td key={key} className="max-w-56 truncate px-5 py-4 text-slate-600">
                        {key.toLowerCase().includes('status') ? (
                          <Badge>{label(cellValue(item, key))}</Badge>
                        ) : (
                          label(cellValue(item, key))
                        )}
                      </td>
                    ))}
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        {cfg.actions?.includes('approve') && (
                          <>
                            <ActionButton title="Setujui" onClick={() => action(item, 'approve')} color="text-emerald-600">
                              <Check size={15} />
                            </ActionButton>
                            <ActionButton title="Tolak" onClick={() => action(item, 'reject')} color="text-rose-600">
                              <X size={15} />
                            </ActionButton>
                          </>
                        )}
                        {cfg.actions?.includes('edit') && (
                          <ActionButton title="Edit" onClick={() => openForm(item)} color="text-blue-600">
                            <Pencil size={15} />
                          </ActionButton>
                        )}
                        {cfg.actions?.includes('status') && (
                          <ActionButton title="Ubah status" onClick={() => action(item, 'status')} color="text-amber-600">
                            <RefreshCw size={15} />
                          </ActionButton>
                        )}
                        {cfg.actions?.includes('verify') && (
                          <ActionButton title="Verifikasi" onClick={() => action(item, 'verify')} color="text-emerald-600">
                            <Check size={15} />
                          </ActionButton>
                        )}
                        {cfg.actions?.includes('grade') && (
                          <ActionButton title="Beri nilai PKL" onClick={() => action(item, 'grade')} color="text-emerald-600">
                            <Check size={15} />
                          </ActionButton>
                        )}
                        {cfg.actions?.includes('journal') && (
                          <ActionButton title="Keputusan jurnal" onClick={() => action(item, 'journal')} color="text-blue-600">
                            <Check size={15} />
                          </ActionButton>
                        )}
                        {cfg.actions?.includes('delete') && (
                          <ActionButton title="Hapus" onClick={() => action(item, 'delete')} color="text-rose-600">
                            <Trash2 size={15} />
                          </ActionButton>
                        )}
                        <ActionButton title="Detail" onClick={() => action(item, 'detail')} color="text-slate-400">
                          <Eye size={15} />
                        </ActionButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </div>

      {modal && (
        <Modal title={`${edit ? 'Edit' : 'Tambah'} ${titleCase(section)}`} onClose={() => setModal(false)}>
          <form onSubmit={save} className="mt-5 space-y-4">
            {fields.map(field =>
              field.name === 'dudiId' && role === 'guru' && section === 'kunjungan' ? (
                <label key={field.name} className="block text-xs font-semibold text-slate-600">
                  Perusahaan Mitra
                  <Select className="mt-2" required value={form.dudiId || ''} onChange={event => setForm({ ...form, dudiId: event.target.value })}>
                    <option value="">Pilih DUDI bimbingan</option>
                    {dudiOptions.map(option => (
                      <option key={option.id} value={option.id}>
                        {option.nama_perusahaan}
                      </option>
                    ))}
                  </Select>
                  {!dudiOptions.length && (
                    <span className="mt-1 block font-normal text-slate-400">Tidak ada DUDI dari siswa bimbingan Anda.</span>
                  )}
                </label>
              ) : (
                <FormField
                  key={field.name}
                  field={field}
                  value={form[field.name]}
                  onChange={value => setForm({ ...form, [field.name]: value })}
                  isEdit={Boolean(edit)}
                />
              ),
            )}
            {!edit && role === 'admin' && ['guru', 'siswa'].includes(section) && (
              <p className="rounded-lg bg-blue-50 p-3 text-[11px] leading-5 text-blue-700">
                Email sekolah dibuat otomatis berdasarkan nama. Password awal mengikuti konfigurasi akun backend.
              </p>
            )}
            <Feedback err={err} notice="" />
            <div className="flex justify-end gap-2 pt-3">
              <Button type="button" variant="light" onClick={() => setModal(false)}>
                Batal
              </Button>
              <Button>
                <Save size={15} /> Simpan
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {detail && (
        <Modal title="Detail Data" onClose={() => setDetail(null)}>
          <div className="grid gap-3 sm:grid-cols-2">
            {Object.entries(detail)
              .filter(([key]) => !key.toLowerCase().includes('password'))
              .map(([key, value]) => (
                <div key={key} className="rounded-lg bg-slate-50 p-3">
                  <div className="text-[10px] uppercase text-slate-400">{titleCase(key)}</div>
                  <div className="mt-1 break-words text-xs font-medium text-slate-700">{label(value)}</div>
                </div>
              ))}
          </div>
        </Modal>
      )}
      {detailLoading && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/30 text-sm font-medium text-white">
          Memuat detail siswa...
        </div>
      )}
    </div>
  );
}

function ActionButton({ title, onClick, color, children }: { title: string; onClick: () => void; color: string; children: React.ReactNode }) {
  return (
    <button title={title} onClick={onClick} className={`rounded-lg p-2 ${color} hover:bg-slate-100`}>
      {children}
    </button>
  );
}
