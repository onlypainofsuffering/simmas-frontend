'use client';

import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import Image from 'next/image';
import { Save } from 'lucide-react';
import { dataOf, getUser } from '@/lib/api/client';
import { USER_KEY } from '@/lib/auth/auth.config';
import { recordActivity } from '@/lib/utils/activity-log';
import { profileService } from '@/services/profile.service';
import { Feedback } from '@/components/shared/Feedback';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
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
  const [nama, setNama] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [err, setErr] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
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
  const avatarSrc = preview || fotoUrl;
  const initial = String(nama || '?').charAt(0).toUpperCase();

  return (
    <div className="space-y-5">
      <PageHeader description="Profil Saya" hint="Ubah nama dan foto profil akun Anda." />
      <Card className="max-w-xl p-6">
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 overflow-hidden rounded-full bg-blue-100">
            {avatarSrc ? (
              <Image
                src={avatarSrc}
                alt="Foto profil"
                fill
                sizes="64px"
                unoptimized={Boolean(preview)}
                className="object-cover"
              />
            ) : (
              <span className="grid h-full w-full place-items-center text-xl font-bold text-blue-700">
                {initial}
              </span>
            )}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">{profile?.nama || '-'}</p>
            <p className="text-[11px] text-slate-400">{profile?.email || '-'}</p>
          </div>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4">
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
            Foto Profil
            <Input className="mt-2" type="file" accept="image/*" onChange={onFileChange} />
          </label>
          <p className="text-[11px] leading-5 text-slate-400">
            Foto akan dikompres dan disimpan sebagai WebP (maks. 5 MB, sisi terpanjang 1024 px).
          </p>
          <Feedback err={err} notice={notice} />
          <div className="flex justify-end">
            <Button disabled={saving}>
              <Save size={15} /> {saving ? 'Menyimpan...' : 'Simpan Profil'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
