'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Plus, Save } from 'lucide-react';
import { dataOf, label } from '@/lib/api/client';
import { findRows } from '@/lib/utils/resource';
import { recordActivity } from '@/lib/utils/activity-log';
import { companyFields } from '@/constants/resource-config';
import { siswaService } from '@/services/siswa.service';
import { ConfirmDialog, type ConfirmRequest } from '@/components/shared/ConfirmDialog';
import { Feedback } from '@/components/shared/Feedback';
import { FormField } from '@/components/forms/FormField';
import Modal from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { SelectField } from '@/components/ui/Select';
import type { Row } from '@/types/api';

export default function StudentApplication() {
  const [info, setInfo] = useState<any>(null);
  const [form, setForm] = useState({ dudiId: '', posisi: '' });
  const [companyForm, setCompanyForm] = useState<Row>({});
  const [companyModal, setCompanyModal] = useState(false);
  const [err, setErr] = useState('');
  const [notice, setNotice] = useState('');
  const [companyError, setCompanyError] = useState('');
  const [companyNotice, setCompanyNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);
  const [confirming, setConfirming] = useState(false);
  const dashboard = dataOf(info);
  const companies = findRows(dashboard, ['list_dudi_disetujui']);
  const applications = findRows(dashboard, ['pengajuan_magang']);
  const latestApplication = applications[0];

  useEffect(() => {
    siswaService
      .getDashboard()
      .then(setInfo)
      .catch(error => setErr(error instanceof Error ? error.message : 'Gagal memuat dashboard.'))
      .finally(() => setLoading(false));
  }, []);

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

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErr('');
    setNotice('');
    const id = Number(form.dudiId);
    if (!Number.isInteger(id) || id < 1) {
      setErr('Pilih perusahaan mitra yang valid.');
      return;
    }
    const posisi = form.posisi;
    setConfirm({
      title: 'Konfirmasi Pengajuan Magang',
      description: `Pengajuan magang pada posisi ${posisi} akan dikirim. Lanjutkan?`,
      confirmLabel: 'Kirim Pengajuan',
      onConfirm: async () => {
        try {
          const response = await siswaService.submitApplication({ dudiId: id, posisi });
          recordActivity({ action: 'Tambah', menu: 'Pengajuan Magang', detail: `Pengajuan ${posisi}` });
          setNotice(response?.message || 'Pengajuan magang berhasil dikirim.');
          setForm({ dudiId: '', posisi: '' });
          void siswaService.getDashboard().then(setInfo).catch(() => undefined);
        } catch (error) {
          setErr(error instanceof Error ? error.message : 'Gagal mengirim pengajuan magang.');
        }
      },
    });
  }

  function submitCompany(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCompanyError('');
    setCompanyNotice('');
    const body = { ...companyForm, kuota_peserta: companyForm.kuota_peserta === true || companyForm.kuota_peserta === 'true' };
    setConfirm({
      title: 'Konfirmasi Usulan Perusahaan',
      description: 'Usulan perusahaan akan dikirim untuk validasi admin. Lanjutkan?',
      confirmLabel: 'Kirim Usulan',
      onConfirm: async () => {
        try {
          const response = await siswaService.proposeCompany(body);
          recordActivity({ action: 'Tambah', menu: 'Perusahaan', detail: String(companyForm.nama_perusahaan || '-') });
          setCompanyNotice(response?.message || 'Usulan perusahaan berhasil dikirim untuk validasi admin.');
          setCompanyForm({});
          setCompanyModal(false);
        } catch (error) {
          setCompanyError(error instanceof Error ? error.message : 'Gagal mengirim usulan perusahaan.');
        }
      },
    });
  }

  return (
    <div className="space-y-5">
      <Card className="p-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <h2 className="font-bold">Pengajuan Magang</h2>
            <p className="mt-1 text-xs text-slate-500">
              Pilih mitra yang sudah diverifikasi admin dan tentukan posisi yang diajukan.
            </p>
          </div>
          <Button type="button" variant="light" onClick={() => setCompanyModal(true)}>
            <Plus size={14} /> Usulkan Perusahaan
          </Button>
        </div>
        <form onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-semibold text-slate-600">
            Perusahaan Mitra
            {companies.length ? (
              <SelectField
                className="mt-2"
                required
                name="dudiId"
                value={form.dudiId}
                onValueChange={value => setForm({ ...form, dudiId: value })}
                placeholder="Pilih Perusahaan"
                options={companies.map((company, index) => {
                  const companyId = company.id ?? company.dudiId;
                  return {
                    value: companyId,
                    label: `${label(company.nama_perusahaan ?? company.nama ?? company.name)}${company.bidang_usaha ? ` · ${label(company.bidang_usaha)}` : ''}`,
                  };
                })}
              />
            ) : (
              <div className="input mt-2 text-slate-400">
                {loading ? 'Memuat perusahaan...' : 'Belum ada perusahaan terverifikasi.'}
              </div>
            )}
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Posisi yang Diajukan
            <Input className="mt-2" required value={form.posisi} onChange={event => setForm({ ...form, posisi: event.target.value })} />
          </label>
          <div className="sm:col-span-2">
            <Button disabled={!companies.length || loading} className="disabled:opacity-50">
              <Plus size={15} /> Kirim Pengajuan
            </Button>
          </div>
        </form>
        <Feedback err={err} notice={notice} />
      </Card>
      <Card className="p-6">
        <h2 className="font-bold">Status Pengajuan</h2>
        <p className="mt-3 text-sm text-slate-600">{label(latestApplication?.status ?? 'Belum mengajukan magang.')}</p>
        {latestApplication && (
          <p className="mt-2 text-xs text-slate-500">
            {label(latestApplication.dudi?.nama_perusahaan)} · {label(latestApplication.posisi)}
          </p>
        )}
        {companies.length > 0 && (
          <p className="mt-2 text-xs text-slate-500">{companies.length} perusahaan mitra disetujui tersedia.</p>
        )}
      </Card>
      {companyError && <Feedback err={companyError} notice="" />}
      {companyNotice && <Feedback err="" notice={companyNotice} />}
      {companyModal && !confirm && (
        <Modal title="Usulkan Perusahaan Mitra" onClose={() => setCompanyModal(false)}>
          <form onSubmit={submitCompany} className="space-y-4">
            {companyFields.map(field => (
              <FormField
                key={field.name}
                field={field}
                value={companyForm[field.name]}
                onChange={value => setCompanyForm({ ...companyForm, [field.name]: value })}
              />
            ))}
            <Feedback err={companyError} notice="" />
            <Button>
              <Save size={14} /> Kirim Usulan
            </Button>
          </form>
        </Modal>
      )}
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
    </div>
  );
}
