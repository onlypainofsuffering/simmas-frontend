'use client';

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Camera, Mail, Pencil, Phone, Save, UserRound, X } from 'lucide-react';
import { dataOf, getUser } from '@/lib/api/client';
import { USER_KEY } from '@/lib/auth/auth.config';
import { ROLE_LABELS } from '@/constants/roles';
import { recordActivity } from '@/lib/utils/activity-log';
import { profileService } from '@/services/profile.service';
import { Feedback } from '@/components/shared/Feedback';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import type { Role, SessionUser } from '@/types/auth';
import type { Row } from '@/types/api';

async function compressToWebp(source: File): Promise<File> {
  const bitmap = await createImageBitmap(source);
  const maxSide = 1024;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Browser tidak mendukung pengolahan gambar.');
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      result => (result ? resolve(result) : reject(new Error('Gagal mengompres foto.'))),
      'image/webp',
      0.82,
    );
  });
  return new File([blob], 'profil.webp', { type: 'image/webp' });
}

export default function ProfilePage({ role }: { role: string }) {
  const [profile, setProfile] = useState<Row | null>(null);
  const [session, setSession] = useState<SessionUser | null>(null);
  const [nama, setNama] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [editing, setEditing] = useState(false);
  const [err, setErr] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    setSession(getUser());
    profileService
      .get()
      .then(response => {
        if (!active) return;
        const data = dataOf(response) as Row;
        setProfile(data);
        setNama(String(data?.nama ?? ''));
      })
      .catch(error => {
        if (active) setErr(error instanceof Error ? error.message : 'Gagal memuat profil.');
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!file) {
      setPreview('');
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    if (!selected) return;
    if (!selected.type.startsWith('image/')) {
      setErr('Foto profil harus berupa gambar.');
      return;
    }
    if (selected.size > 5 * 1024 * 1024) {
      setErr('Ukuran foto maksimal 5 MB.');
      return;
    }
    setErr('');
    setNotice('');
    setFile(selected);
    setEditing(true);
    event.target.value = '';
  }

  function startEdit() {
    setErr('');
    setNotice('');
    setEditing(true);
  }

  function cancelEdit() {
    setNama(displayNama === '-' ? '' : displayNama);
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setErr('');
    setNotice('');
    setEditing(false);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!nama.trim()) {
      setErr('Nama wajib diisi.');
      return;
    }

    setSaving(true);
    setErr('');
    setNotice('');
    try {
      const body = new FormData();
      body.append('nama', nama.trim());
      if (file) body.append('foto', await compressToWebp(file));

      const response = await profileService.update(body);
      const updated = dataOf(response) as Row;
      setProfile(updated);
      setNama(String(updated?.nama ?? nama));
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setEditing(false);

      const current = getUser();
      if (current) {
        localStorage.setItem(
          USER_KEY,
          JSON.stringify({
            ...current,
            nama: updated?.nama,
            namalengkap: updated?.nama,
            name: updated?.nama,
            fotoUrl: updated?.fotoUrl,
          }),
        );
        window.dispatchEvent(new Event('simmas-user-updated'));
      }

      recordActivity({ action: 'Ubah', menu: 'Profil', detail: `Profil ${role} diperbarui` });
      setNotice('Profil berhasil disimpan.');
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Gagal menyimpan profil.');
    } finally {
      setSaving(false);
    }
  }

  const fotoUrl = typeof profile?.fotoUrl === 'string' ? profile.fotoUrl : '';
  const avatarSrc = editing ? preview || fotoUrl : fotoUrl;
  const initial = String(nama || '?').charAt(0).toUpperCase();
  const displayNama =
    String(profile?.nama || session?.namalengkap || session?.nama || session?.name || '') || '-';
  const displayEmail = String(profile?.email || session?.email || '') || '-';
  const displayPhone =
    String(profile?.phone || session?.phone || session?.noTelepon || session?.telepon || '') || '-';
  const displayGender =
    String(profile?.jenisKelamin || profile?.jenis_kelamin || profile?.gender || session?.jenisKelamin || session?.gender || '') ||
    '-';
  const roleLabel = ROLE_LABELS[role as Role] || role.charAt(0).toUpperCase() + role.slice(1);

  const infoItems = [
    { label: 'Nama Lengkap', value: displayNama, icon: UserRound },
    { label: 'Nomor Telepon', value: displayPhone, icon: Phone },
    { label: 'Jenis Kelamin', value: displayGender, icon: UserRound },
    { label: 'Email', value: displayEmail, icon: Mail },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        description="Profil Saya"
        hint="Lihat dan kelola informasi profil akun Anda."
      />

      <Card className="overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-blue-700 to-blue-500" />

        <div className="px-5 pb-6 sm:px-7">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onFileChange}
          />

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <div className="relative -mt-12 h-24 w-24 shrink-0">
                <div className="h-full w-full overflow-hidden rounded-full bg-blue-100 ring-4 ring-white shadow-sm">
                  {avatarSrc ? (
                    <Image
                      src={avatarSrc}
                      alt="Foto profil"
                      fill
                      sizes="96px"
                      unoptimized={Boolean(preview)}
                      className="object-cover"
                    />
                  ) : (
                    <span className="grid h-full w-full place-items-center text-3xl font-bold text-blue-700">
                      {initial}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 z-10 grid h-9 w-9 place-items-center rounded-full bg-blue-600 text-white shadow-lg ring-2 ring-white transition hover:bg-blue-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
                  aria-label="Ganti foto profil"
                >
                  <Camera size={14} />
                </button>
              </div>
              <div className="pb-1">
                <h2 className="text-lg font-bold text-slate-800">{displayNama}</h2>
                <span className="mt-1 inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                  {roleLabel}
                </span>
              </div>
            </div>

            {!editing && (
              <Button variant="light" onClick={startEdit}>
                <Pencil size={15} /> Edit Profil
              </Button>
            )}
          </div>

          {!editing ? (
            <div className="mt-6">
              <div className="grid gap-3 sm:grid-cols-2">
                {infoItems.map(item => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5"
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-blue-100 text-blue-700">
                        <Icon size={16} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                          {item.label}
                        </p>
                        <p className="truncate text-sm font-semibold text-slate-700">{item.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <Feedback err={err} notice={notice} />
            </div>
          ) : (
            <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="block text-xs font-semibold text-slate-600">
                Nama Lengkap
                <Input
                  className="mt-2"
                  value={nama}
                  onChange={event => setNama(event.target.value)}
                  required
                  maxLength={120}
                />
              </label>
              <label className="block text-xs font-semibold text-slate-600">
                Email
                <Input className="mt-2 bg-slate-50 text-slate-500" value={displayEmail} readOnly />
              </label>
              <label className="block text-xs font-semibold text-slate-600">
                Nomor Telepon
                <Input
                  className="mt-2 bg-slate-50 text-slate-500"
                  value={displayPhone === '-' ? '' : displayPhone}
                  placeholder="Belum tersedia"
                  readOnly
                />
              </label>
              <label className="block text-xs font-semibold text-slate-600">
                Jenis Kelamin
                <Input
                  className="mt-2 bg-slate-50 text-slate-500"
                  value={displayGender === '-' ? '' : displayGender}
                  placeholder="Belum tersedia"
                  readOnly
                />
              </label>
              <p className="text-[11px] leading-5 text-slate-400 sm:col-span-2">
                Foto akan dikompres dan disimpan sebagai WebP (maks. 5 MB, sisi terpanjang 1024 px).
              </p>
              <div className="sm:col-span-2">
                <Feedback err={err} notice={notice} />
              </div>
              <div className="flex flex-col-reverse gap-2 sm:col-span-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="light" onClick={cancelEdit} disabled={saving}>
                  <X size={15} /> Batal
                </Button>
                <Button disabled={saving}>
                  <Save size={15} /> {saving ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </Card>
    </div>
  );
}
