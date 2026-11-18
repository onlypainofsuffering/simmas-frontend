'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Eye, Filter, Pencil, Plus, Save, Search, Trash2, X } from 'lucide-react';
import { api, dataOf, json, label, rowsOf } from '@/lib/api/client';
import { resourceConfigs, preferredColumns, statusChoices } from '@/constants/resource-config';
import { cellValue, idOf, titleCase } from '@/lib/utils/resource';
import { formatDate, formatTime, toInputDate } from '@/lib/utils/format-date';
import { recordActivity } from '@/lib/utils/activity-log';
import { useDebounce } from '@/hooks/useDebounce';
import { usePagination } from '@/hooks/usePagination';
import { adminService } from '@/services/admin.service';
import { guruService } from '@/services/guru.service';
import { FormField } from '@/components/forms/FormField';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Feedback } from '@/components/shared/Feedback';
import { PageHeader } from '@/components/shared/PageHeader';
import { SearchInput } from '@/components/shared/SearchInput';
import { StatCard } from '@/components/dashboard/StatCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loading } from '@/components/ui/Loading';
import Modal from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { SelectField } from '@/components/ui/Select';
import { Table } from '@/components/ui/Table';
import type { Row } from '@/types/api';
import type { Field } from '@/types/resource';

const pageDescriptions: Record<string, string> = {
  'monitoring siswa': 'Monitoring Siswa',
  'Monitoring Kunjungan': 'Monitoring Kunjungan',
  mitra: 'Kelola Dudi',
  'Penempatan Data': 'Kelola Penempatan Data',
};

const addLabels: Record<string, string> = {
  'admin:guru': 'Tambah',
  'admin:siswa': 'Tambah',
  'admin:kelas': 'Tambah',
  'admin:mitra': 'Tambah',
};

function visitStatus(item: Row) {
  const raw = item.tanggal ?? item.tanggalKunjungan;
  const parts = typeof raw === 'string' ? raw.slice(0, 10).split('-').map(Number) : [];
  if (parts.length !== 3 || parts.some(Number.isNaN)) return '-';
  const visit = new Date(parts[0], parts[1] - 1, parts[2]);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return visit >= today ? 'Akan Datang' : 'Terlaksana';
}

type ConfirmState = {
  title: string;
  message: string;
  confirmLabel: string;
  tone?: 'primary' | 'danger';
  onConfirm: () => void | Promise<void>;
};

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function identityOf(row?: Row | null) {
  if (!row) return '-';
  return String(row.namalengkap || row.nama || row.nama_perusahaan || row.nis || '-');
}

function isIdKey(key: string) {
  const normalized = key.toLowerCase();
  return normalized === 'id' || normalized.endsWith('id');
}

function filterLabel(key: string) {
  return key === 'dudiId' ? 'Dudi' : titleCase(key);
}

export default function ResourcePage({ role, section }: { role: string; section: string }) {
  const cfg = resourceConfigs[`${role}:${section}`] || {};
  const filterKeys = useMemo(
    () => Array.from(new Set([...(cfg.filters || []), ...(cfg.clientFilters || [])])),
    [cfg.filters, cfg.clientFilters],
  );
  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [notice, setNotice] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [modal, setModal] = useState(false);
  const [edit, setEdit] = useState<Row | null>(null);
  const [form, setForm] = useState<Row>({});
  const [query, setQuery] = useState('');
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [detail, setDetail] = useState<Row | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [dudiOptions, setDudiOptions] = useState<Row[]>([]);
  const [teacherOptions, setTeacherOptions] = useState<Row[]>([]);
  const [kelasMaster, setKelasMaster] = useState<Row[]>([]);
  const debouncedFilters = useDebounce(filters, 300);
  const debouncedQuery = useDebounce(query, 200);

  const resolveFields = useCallback(
    (isEdit: boolean): Field[] => {
      const base = isEdit ? cfg.editFields || cfg.fields || [] : cfg.fields || [];
      if (!isEdit || !cfg.actions?.includes('status') || base.some(field => field.name === 'status')) return base;
      return [
        ...base,
        {
          name: 'status',
          label: section === 'siswa' || section === 'Penempatan Data' ? 'Status Magang' : 'Status',
          type: 'select',
          options: statusChoices[section] || [],
        },
      ];
    },
    [cfg.actions, cfg.editFields, cfg.fields, section],
  );
  const fields = useMemo(() => resolveFields(Boolean(edit)), [resolveFields, edit]);
  const useMasterKelas =
    role === 'admin' && ['siswa', 'Penempatan Data'].includes(section);
  const isKunjunganMonitoring = role === 'admin' && section === 'Monitoring Kunjungan';
  const kelasOptions = useMemo(
    () =>
      Array.from(
        new Set([
          ...kelasMaster.map(item => String(item.nama ?? '')),
          ...data.map(item => String(item.kelas ?? item.siswa?.kelas ?? '')),
        ]),
      )
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b)),
    [kelasMaster, data],
  );

  // Endpoint /admin/penempatan/:id memakai ID siswa (lihat AdminService.updatePenempatan),
  // sedangkan baris penempatan adalah data pengajuan yang memiliki `id` sendiri.
  const rowId = (item: Row) => {
    if (role === 'admin' && section === 'Penempatan Data') {
      const siswaId = item.siswa?.id ?? item.siswaId ?? item.id;
      return siswaId === null || siswaId === undefined ? '' : String(siswaId);
    }
    return idOf(item);
  };
  const cols = useMemo(() => {
    const keys = Array.from(new Set(data.slice(0, 8).flatMap(item => Object.keys(item || {}))));
    const hidden = role === 'admin' && section === 'guru' ? ['status'] : [];
    const visible = keys.filter(
      key =>
        !['password', 'updatedat', 'createdat', 'role', 'fotoUrl'].includes(key.toLowerCase()) &&
        !isIdKey(key) &&
        !hidden.includes(key.toLowerCase()),
    );
    const preferred = preferredColumns[`${role}:${section}`] || [];
    return [...preferred.filter(key => visible.includes(key)), ...visible.filter(key => !preferred.includes(key))].slice(0, 7);
  }, [data, role, section]);

  function activityMenu() {
    if (section === 'mitra') return 'Data Dudi';
    if (section === 'Penempatan Data') return 'Penempatan Magang';
    return `Data ${titleCase(section)}`;
  }

  function logChange(action: string, detail: string) {
    recordActivity({ action, menu: activityMenu(), detail });
  }

  const serverFilterKey = useMemo(
    () =>
      Object.entries(debouncedFilters)
        .filter(([key, value]) => Boolean(value) && !cfg.clientFilters?.includes(key))
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('&'),
    [cfg.clientFilters, debouncedFilters],
  );

  const load = useCallback(async (background = false) => {
    if (!cfg.path) return;
    if (!background) setLoading(true);
    setErr('');
    try {
      const params = new URLSearchParams();
      Object.entries(debouncedFilters).forEach(([key, value]) => {
        if (value && !cfg.clientFilters?.includes(key)) params.set(key, value);
      });
      const suffix = params.toString();
      const result = await api(`${cfg.path}${suffix ? `?${suffix}` : ''}`);
      const rows = rowsOf(result);
      setData(
        isKunjunganMonitoring
          ? rows.map(item => ({ ...item, status: visitStatus(item) }))
          : rows,
      );
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Gagal memuat data.');
    } finally {
      if (!background) setLoading(false);
    }
  }, [cfg.path, cfg.clientFilters, isKunjunganMonitoring, serverFilterKey]);

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

  useEffect(() => {
    if (role !== 'admin' || !['siswa', 'Penempatan Data'].includes(section)) return;
    adminService
      .getCompanies()
      .then(result => setDudiOptions(rowsOf(result)))
      .catch(error => setErr(error instanceof Error ? error.message : 'Gagal memuat master dudi.'));
  }, [role, section]);

  useEffect(() => {
    if (role !== 'admin' || section !== 'Penempatan Data') return;
    adminService
      .getActiveTeachers()
      .then(result => setTeacherOptions(rowsOf(result)))
      .catch(error => setErr(error instanceof Error ? error.message : 'Gagal memuat guru aktif.'));
  }, [role, section]);

  useEffect(() => {
    if (!useMasterKelas && !cfg.filters?.includes('kelas')) return;
    adminService
      .getKelas()
      .then(result => setKelasMaster(rowsOf(result)))
      .catch(error =>
        setErr(error instanceof Error ? error.message : 'Gagal memuat master kelas.'),
      );
  }, [useMasterKelas, cfg.filters]);

  function openForm(item: Row | null = null) {
    setEdit(item);
    const initial: Row = {};
    resolveFields(Boolean(item)).forEach(field => {
      initial[field.name] =
        field.type === 'toggle'
          ? item
            ? item[field.name] !== false
            : true
          : field.type === 'date'
            ? toInputDate(item?.[field.name])
            : item?.[field.name] ?? (field.name === 'namalengkap' ? item?.nama : '');
    });
    if (useMasterKelas) {
      const matched = kelasMaster.find(
        option =>
          String(option.id) === String(item?.kelasId) || option.nama === item?.kelas,
      );
      initial.kelas = item?.kelasId ?? matched?.id ?? '';
    }
    setForm(initial);
    setErr('');
    setNotice('');
    setModal(true);
  }

  function askConfirm(state: ConfirmState) {
    setErr('');
    setNotice('');
    setConfirm(state);
  }

  async function confirmAndRun() {
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

  async function updateStatusIfNeeded() {
    if (!edit || !cfg.actions?.includes('status')) return;
    const id = rowId(edit);
    const next = String(form.status ?? '');
    if (!id || !next || next === String(edit.status ?? '')) return;
    if (role === 'admin' && section === 'guru') {
      await adminService.updateTeacherStatus(id, next);
    } else if (role === 'admin' && section === 'siswa') {
      await adminService.updateStudentStatus(id, next);
    } else {
      await adminService.updatePlacementStatus(id, next);
    }
  }

  async function performSave() {
    const path = edit ? `${cfg.path}/${rowId(edit)}` : cfg.createPath;
    if (!path || (edit && !rowId(edit))) {
      setErr('ID atau endpoint data tidak ditemukan.');
      return;
    }
    setErr('');
    try {
      const detail = identityOf(edit) !== '-' ? identityOf(edit) : String(form.nama || form.namalengkap || form.nama_perusahaan || form.nis || '-');
      const handlesStatusSeparately = Boolean(edit && cfg.actions?.includes('status'));
      const isMultipart = fields.some(field => field.type === 'file');
      if (isMultipart) {
        const body = new FormData();
        fields.forEach(field => {
          if (handlesStatusSeparately && field.name === 'status') return;
          const value = form[field.name];
          if (field.type === 'file') {
            if (value) body.append(field.name, value);
          } else if (edit || (value !== '' && value !== null && value !== undefined)) {
            body.append(field.name, String(value ?? ''));
          }
        });
        const [savedResponse] = await Promise.all([
          api(path, { method: edit ? 'PATCH' : 'POST', body }),
          updateStatusIfNeeded(),
        ]);
        logChange(edit ? 'Ubah' : 'Tambah', detail);
        const saved = dataOf(savedResponse);
        if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
          const savedId = rowId(saved);
          setData(prev =>
            edit
              ? prev.map(row => (rowId(row) === rowId(edit) ? { ...row, ...saved } : row))
              : savedId && prev.some(row => rowId(row) === savedId)
                ? prev.map(row => (rowId(row) === savedId ? { ...row, ...saved } : row))
                : [saved, ...prev],
          );
        }
        setModal(false);
        setNotice('Data berhasil disimpan.');
        void load(true);
        return;
      } else {
        const body: Row = {};
        fields.forEach(field => {
          if (handlesStatusSeparately && field.name === 'status') return;
          const value = form[field.name];
          if (value === '' || value === null || value === undefined) return;
          if (useMasterKelas && field.name === 'kelas') {
            body.kelasId = Number(value);
          } else if (['dudiId', 'guruPembimbingId'].includes(field.name)) {
            body[field.name] = Number(value);
          } else if (field.name === 'kuota_peserta' || field.name === 'isActive') {
            body[field.name] = value === true || value === 'true';
          } else {
            body[field.name] = value;
          }
        });
        const [response] = await Promise.all([
          api(path, json(edit ? 'PATCH' : 'POST', body)),
          updateStatusIfNeeded(),
        ]);
        logChange(edit ? 'Ubah' : 'Tambah', detail);
        const saved = dataOf(response);
        if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
          const savedId = rowId(saved);
          setData(prev =>
            edit
              ? prev.map(row => (rowId(row) === rowId(edit) ? { ...row, ...saved } : row))
              : savedId && prev.some(row => rowId(row) === savedId)
                ? prev.map(row => (rowId(row) === savedId ? { ...row, ...saved } : row))
                : [saved, ...prev],
          );
        }
        const userEmail = response?.data?.email;
        const message = response?.message || 'Data berhasil disimpan.';
        setModal(false);
        setNotice(userEmail && !edit ? `${message}. Email akun: ${userEmail}` : message);
        void load(true);
        return;
      }
      setModal(false);
      setNotice('Data berhasil disimpan.');
      void load(true);
    } catch (error) {
      setErr(errorMessage(error, 'Gagal menyimpan data.'));
    }
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const path = edit ? `${cfg.path}/${rowId(edit)}` : cfg.createPath;
    if (!path || (edit && !rowId(edit))) {
      setErr('ID atau endpoint data tidak ditemukan.');
      return;
    }
    askConfirm({
      title: edit ? 'Konfirmasi Perubahan Data' : 'Konfirmasi Simpan Data',
      message: edit
        ? `Perubahan data ${titleCase(section)} akan disimpan. Lanjutkan?`
        : `Data ${titleCase(section)} baru akan disimpan. Lanjutkan?`,
      confirmLabel: 'Simpan',
      onConfirm: performSave,
    });
  }

  async function runAction(task: () => Promise<unknown>) {
    try {
      await task();
      setNotice('Aksi berhasil diproses.');
      void load(true);
    } catch (error) {
      setErr(errorMessage(error, 'Aksi gagal diproses.'));
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

    if (actionName === 'detail' && role === 'guru' && section === 'siswa') {
      setDetailLoading(true);
      try {
        setDetail(dataOf(await guruService.getStudentDetail(id)));
      } finally {
        setDetailLoading(false);
      }
      return;
    }
    if (actionName === 'detail') {
      setDetail(item);
      return;
    }

    try {
      if (actionName === 'delete') {
        askConfirm({
          title: 'Konfirmasi Hapus Data',
          message: `Data ${titleCase(section)} akan dihapus secara permanen. Lanjutkan?`,
          confirmLabel: 'Hapus',
          tone: 'danger',
          onConfirm: () => runAction(async () => {
            await api(`${cfg.path}/${id}`, { method: 'DELETE' });
            setData(prev => prev.filter(row => rowId(row) !== id));
            logChange('Hapus', identityOf(item));
          }),
        });
        return;
      }

      if (actionName === 'approve' || actionName === 'reject') {
        const approve = actionName === 'approve';
        const body: Row = { status: approve ? 'DISETUJUI' : 'DITOLAK' };
        if (approve) {
          const teacherId = window.prompt('Masukkan ID guru pembimbing aktif (wajib):');
          if (teacherId === null) return;
          if (!/^\d+$/.test(teacherId.trim())) throw new Error('ID guru pembimbing aktif wajib berupa angka.');
          body.guruPembimbingId = Number(teacherId);
        }
        askConfirm({
          title: approve ? 'Konfirmasi Persetujuan' : 'Konfirmasi Penolakan',
          message: approve
            ? `Pengajuan ${titleCase(section)} akan disetujui. Lanjutkan?`
            : `Pengajuan ${titleCase(section)} akan ditolak. Lanjutkan?`,
          confirmLabel: approve ? 'Setujui' : 'Tolak',
          tone: approve ? 'primary' : 'danger',
          onConfirm: () => runAction(async () => {
            await adminService.decideApplication(id, body);
            logChange(approve ? 'Setujui' : 'Tolak', identityOf(item));
          }),
        });
        return;
      }

      if (actionName === 'verify') {
        askConfirm({
          title: 'Konfirmasi Verifikasi',
          message: 'Mitra DUDI akan diverifikasi. Lanjutkan?',
          confirmLabel: 'Verifikasi',
          onConfirm: () => runAction(async () => {
            await adminService.verifyCompany(id);
            logChange('Verifikasi', identityOf(item));
          }),
        });
        return;
      }

      if (actionName === 'grade') {
        const rawScore = window.prompt('Masukkan nilai PKL (0–100):');
        if (rawScore === null) return;
        if (!rawScore.trim()) throw new Error('Nilai PKL wajib diisi.');
        const nilai = Number(rawScore);
        if (!Number.isFinite(nilai) || nilai < 0 || nilai > 100) {
          throw new Error('Nilai PKL harus berupa angka dari 0 sampai 100.');
        }
        const catatan = window.prompt('Catatan penilaian (opsional):') || '';
        askConfirm({
          title: 'Konfirmasi Penilaian',
          message: `Nilai PKL ${nilai} akan disimpan. Lanjutkan?`,
          confirmLabel: 'Simpan',
          onConfirm: () => runAction(async () => {
            await guruService.gradeStudent(id, { nilai, catatan });
            logChange('Nilai', `${identityOf(item)} - ${nilai}`);
          }),
        });
        return;
      }

      if (actionName === 'journal') {
        const value = window.prompt('Keputusan jurnal (REVISI atau DISETUJUI_GURU):');
        if (value === null) return;
        const status = value.trim();
        if (!['REVISI', 'DISETUJUI_GURU'].includes(status)) {
          throw new Error('Keputusan harus REVISI atau DISETUJUI_GURU.');
        }
        const catatanGuru = window.prompt('Catatan guru (opsional):') || '';
        askConfirm({
          title: 'Konfirmasi Keputusan Jurnal',
          message: `Keputusan ${status} akan disimpan. Lanjutkan?`,
          confirmLabel: 'Simpan',
          onConfirm: () => runAction(async () => {
            await guruService.decideJournal(id, { status, catatanGuru });
            logChange('Ubah', `${identityOf(item)} - ${status}`);
          }),
        });
      }
    } catch (error) {
      setErr(errorMessage(error, 'Aksi gagal diproses.'));
    }
  }

  const searchIndex = useMemo(
    () => new Map(data.map(item => [item, JSON.stringify(item).toLowerCase()] as const)),
    [data],
  );
  const clientFiltered = useMemo(
    () =>
      data.filter(item =>
        (cfg.clientFilters || []).every(key => {
          const value = filters[key];
          return !value || String(cellValue(item, key) ?? '') === value;
        }),
      ),
    [cfg.clientFilters, data, filters],
  );
  const filtered = useMemo(
    () => clientFiltered.filter(item => (searchIndex.get(item) || '').includes(debouncedQuery.toLowerCase())),
    [clientFiltered, debouncedQuery, searchIndex],
  );
  const { page, setPage, totalPages, pageItems: paginated } = usePagination(filtered, 5);

  useEffect(() => {
    setPage(1);
  }, [filters, query, setPage]);

  const activeCount = useMemo(
    () =>
      clientFiltered.filter(item => {
        if (item.isActive !== undefined) return item.isActive === true;
        return ['AKTIF', 'SEDANG_MAGANG', 'TERVERIFIKASI', 'DISETUJUI'].includes(
          String(item.status || '').toUpperCase(),
        );
      }).length,
    [clientFiltered],
  );

  const resourceLabel = section === 'mitra' ? 'Dudi' : titleCase(section);
  const columnLabel = (key: string) => (key === 'isActive' ? 'Status' : titleCase(key));
  const displayValue = (key: string, value: any) => {
    if (key === 'kuota_peserta') return value === true || value === 'true' ? 'Tersedia' : 'Penuh';
    if (key === 'isActive') return value === true || value === 'true' ? 'AKTIF' : 'NONAKTIF';
    return label(value);
  };
  const isTimestampKey = (key: string) =>
    ['createdat', 'created_at', 'updatedat', 'updated_at'].includes(key.toLowerCase());
  const detailLabel = (key: string) => {
    const normalized = key.toLowerCase();
    if (normalized === 'createdat' || normalized === 'created_at') return 'Dibuat Pada';
    if (normalized === 'updatedat' || normalized === 'updated_at') return 'Diubah Pada';
    if (normalized === 'isactive') return 'Status';
    return titleCase(key);
  };
  const detailValue = (key: string, value: any) => {
    if (isTimestampKey(key)) {
      const formattedDate = formatDate(value, { day: '2-digit', month: 'long', year: 'numeric' });
      if (formattedDate === value) return value;
      return `${formattedDate}, ${formatTime(value)}`;
    }
    if (key === 'kuota_peserta' || key === 'isActive') return displayValue(key, value);
    return value;
  };

  return (
    <div className="space-y-5">
      <PageHeader
        description={pageDescriptions[section] || `Kelola ${titleCase(section)}`}
      
      >
        {cfg.createPath && (
          <Button onClick={() => openForm()}>
            <Plus size={16} /> {addLabels[`${role}:${section}`] || 'Tambah'}
          </Button>
        )}
      </PageHeader>

      {cfg.path && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard title={resourceLabel} value={data.length} detail={`${resourceLabel} tersedia`} />
          <StatCard title="Aktif" value={activeCount} detail={`${resourceLabel} aktif`} tone="green" />
          <StatCard
            title="Hasil Ditampilkan"
            value={filtered.length}
            detail={query ? 'Sesuai pencarian' : 'Setelah filter'}
            tone="purple"
          />
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Daftar {titleCase(section)}</h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            {filterKeys.length ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="hidden h-[42px] items-center gap-2 px-1 text-xs font-semibold text-slate-500 sm:inline-flex">
                  <Filter size={15} /> Filter
                </span>
                {filterKeys.map(key => (
                  <div key={key} className="w-full sm:w-40 sm:flex-none">
                    {key === 'kelas' && kelasOptions.length ? (
                      <SelectField
                        className="h-[42px]"
                        value={filters[key] || ''}
                        onValueChange={value => setFilters({ ...filters, [key]: value })}
                        placeholder={filterLabel(key)}
                        emptyLabel={`Semua ${filterLabel(key)}`}
                        options={kelasOptions.map(value => ({ value, label: value }))}
                      />
                    ) : key === 'dudiId' && dudiOptions.length ? (
                      <SelectField
                        className="h-[42px]"
                        value={filters[key] || ''}
                        onValueChange={value => setFilters({ ...filters, [key]: value })}
                        placeholder={filterLabel(key)}
                        emptyLabel={`Semua ${filterLabel(key)}`}
                        options={dudiOptions.map(option => ({
                          value: option.id,
                          label: label(option.nama_perusahaan),
                        }))}
                      />
                    ) : key === 'status' || key === 'jurusan' ? (
                      <SelectField
                        className="h-[42px]"
                        value={filters[key] || ''}
                        onValueChange={value => setFilters({ ...filters, [key]: value })}
                        placeholder={filterLabel(key)}
                        emptyLabel={`Semua ${filterLabel(key)}`}
                        options={(key === 'jurusan' ? ['RPL', 'TKJ', 'MM'] : statusChoices[section] || ['BELUM_MAGANG', 'SEDANG_MAGANG', 'LULUS']).map(value => ({ value, label: value }))}
                      />
                    ) : (
                      <Input
                        className="h-[42px]"
                        placeholder={filterLabel(key)}
                        value={filters[key] || ''}
                        onChange={event => setFilters({ ...filters, [key]: event.target.value })}
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : null}
            <SearchInput value={query} onChange={setQuery} />
          </div>
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
                      {columnLabel(key)}
                    </th>
                  ))}
                  <th className="px-5 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginated.map((item, index) => (
                  <tr key={rowId(item) || index} className="hover:bg-slate-50/70">
                    {cols.map(key => (
                      <td key={key} className={`px-5 py-4 text-slate-600 ${key === 'kehadiran' ? '' : 'max-w-56 truncate'}`}>
                        {key === 'kehadiran' ? (
                          <AttendanceBadges value={cellValue(item, key)} />
                        ) : key === 'isActive' || key.toLowerCase().includes('status') ? (
                          <Badge
                            className={
                              key === 'isActive'
                                ? item.isActive
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-slate-100 text-slate-500'
                                : undefined
                            }
                          >
                            {key === 'isActive'
                              ? item.isActive
                                ? 'AKTIF'
                                : 'NONAKTIF'
                              : displayValue(key, cellValue(item, key))}
                          </Badge>
                        ) : (
                          displayValue(key, cellValue(item, key))
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
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      {modal && !confirm && (
        <Modal title={`${edit ? 'Edit' : 'Tambah'} ${titleCase(section)}`} onClose={() => setModal(false)}>
          <form onSubmit={save} className="mt-5 space-y-4">
            {fields.map(field =>
              field.name === 'kelas' && useMasterKelas ? (
                <label key={field.name} className="block text-xs font-semibold text-slate-600">
                  {field.label}
                  <SelectField
                    className="mt-2"
                    required={field.required}
                    name={field.name}
                    value={form[field.name] || ''}
                    onValueChange={value => setForm({ ...form, [field.name]: value })}
                    placeholder="Pilih Kelas"
                    options={kelasMaster.map(option => ({
                      value: option.id,
                      label: `${label(option.nama)}${option.jurusan ? ` (${label(option.jurusan)})` : ''}`,
                    }))}
                  />
                  {!kelasMaster.length && (
                    <span className="mt-1 block font-normal text-slate-400">
                      Belum ada master kelas. Tambahkan terlebih dahulu di Data Kelas.
                    </span>
                  )}
                </label>
              ) : field.name === 'dudiId' && role === 'admin' && section === 'Penempatan Data' ? (
                <label key={field.name} className="block text-xs font-semibold text-slate-600">
                  Perusahaan
                  <SelectField
                    className="mt-2"
                    required={field.required}
                    name="dudiId"
                    value={form.dudiId || ''}
                    onValueChange={value => setForm({ ...form, dudiId: value })}
                    placeholder="Pilih Perusahaan"
                    options={dudiOptions.map(option => ({
                      value: option.id,
                      label: label(option.nama_perusahaan),
                    }))}
                  />
                  {!dudiOptions.length && (
                    <span className="mt-1 block font-normal text-slate-400">Belum ada data DUDI.</span>
                  )}
                </label>
              ) : field.name === 'guruPembimbingId' && role === 'admin' && section === 'Penempatan Data' ? (
                <label key={field.name} className="block text-xs font-semibold text-slate-600">
                  Guru Pembimbing
                  <SelectField
                    className="mt-2"
                    required={field.required}
                    name="guruPembimbingId"
                    value={form.guruPembimbingId || ''}
                    onValueChange={value => setForm({ ...form, guruPembimbingId: value })}
                    placeholder="Pilih Guru Pembimbing"
                    options={teacherOptions.map(option => ({
                      value: option.id,
                      label: label(option.namalengkap),
                    }))}
                  />
                  {!teacherOptions.length && (
                    <span className="mt-1 block font-normal text-slate-400">Belum ada guru aktif.</span>
                  )}
                </label>
              ) : field.name === 'dudiId' && role === 'guru' && section === 'kunjungan' ? (
                <label key={field.name} className="block text-xs font-semibold text-slate-600">
                  Perusahaan Mitra
                  <SelectField
                    className="mt-2"
                    required
                    name="dudiId"
                    value={form.dudiId || ''}
                    onValueChange={value => setForm({ ...form, dudiId: value })}
                    placeholder="Pilih DUDI Bimbingan"
                    options={dudiOptions.map(option => ({
                      value: option.id,
                      label: label(option.nama_perusahaan),
                    }))}
                  />
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
              .filter(([key]) => !isIdKey(key))
              .map(([key, value]) => (
                <div key={key} className="rounded-lg bg-slate-50 p-3">
                  <div className="text-[10px] uppercase text-slate-400">{detailLabel(key)}</div>
                  <div className="mt-1 break-words text-xs font-medium text-slate-700">
                    {key === 'kehadiran' ? (
                      <AttendanceBadges value={value} />
                    ) : (
                      <DetailValue value={detailValue(key, value)} />
                    )}
                  </div>
                </div>
              ))}
          </div>
        </Modal>
      )}
      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.title || ''}
        description={confirm?.message || ''}
        confirmLabel={confirm?.confirmLabel}
        tone={confirm?.tone}
        loading={confirming}
        onCancel={() => setConfirm(null)}
        onConfirm={confirmAndRun}
      />
      {detailLoading && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/30 text-sm font-medium text-white">
          Memuat detail siswa...
        </div>
      )}
    </div>
  );
}

function AttendanceBadges({ value }: { value: any }) {
  const source = value && typeof value === 'object' ? value : {};
  const format = typeof value === 'string' ? value : String(source.format || '');
  const count = (letter: string, field: string) => {
    if (source[field] !== undefined) return source[field];
    const match = format.match(new RegExp(`${letter}:\\s*(\\d+)`));
    return match ? match[1] : 0;
  };
  const items = [
    { letter: 'H', count: count('H', 'hadir'), tone: 'bg-emerald-50 text-emerald-700' },
    { letter: 'S', count: count('S', 'sakit'), tone: 'bg-amber-50 text-amber-700' },
    { letter: 'I', count: count('I', 'izin'), tone: 'bg-blue-50 text-blue-700' },
    { letter: 'A', count: count('A', 'alpha'), tone: 'bg-rose-50 text-rose-700' },
  ];

  return (
    <div className="flex flex-wrap gap-1">
      {items.map(item => (
        <Badge key={item.letter} className={`px-2 py-0.5 text-[10px] ${item.tone}`}>
          {item.letter}: {item.count}
        </Badge>
      ))}
    </div>
  );
}

function DetailValue({ value }: { value: any }) {
  if (value === null || value === undefined || value === '') return <>-</>;
  if (Array.isArray(value)) {
    if (!value.length) return <>-</>;
    return <>{value.map(item => (typeof item === 'object' ? label(item) : String(item))).join(', ')}</>;
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value).filter(
      ([key]) => key !== 'format' && !key.toLowerCase().includes('id') && !key.toLowerCase().includes('password'),
    );
    if (!entries.length) return <>-</>;
    return (
      <div className="space-y-1">
        {entries.map(([key, item]) => (
          <div key={key} className="flex items-start justify-between gap-2">
            <span className="text-[10px] uppercase text-slate-400">{titleCase(key)}</span>
            <span className="text-right">{label(item)}</span>
          </div>
        ))}
      </div>
    );
  }
  return <>{label(value)}</>;
}

function ActionButton({ title, onClick, color, children }: { title: string; onClick: () => void; color: string; children: React.ReactNode }) {
  return (
    <button title={title} onClick={onClick} className={`rounded-lg p-2 ${color} hover:bg-slate-100`}>
      {children}
    </button>
  );
}
