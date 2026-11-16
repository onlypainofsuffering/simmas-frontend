'use client';

import { FormEvent, useState } from 'react';
import { Save } from 'lucide-react';
import { changePassword } from '@/lib/auth/auth.service';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Feedback } from './Feedback';

export default function PasswordPage({ role }: { role: string }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '' });
  const [err, setErr] = useState('');
  const [notice, setNotice] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErr('');
    setNotice('');
    try {
      await changePassword(role, form);
      setNotice('Password berhasil diperbarui.');
      setForm({ currentPassword: '', newPassword: '' });
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Gagal memperbarui password.');
    }
  }

  return (
    <Card className="max-w-xl p-6">
      <h2 className="font-bold">Ubah Password</h2>
      <p className="mt-1 text-xs text-slate-500">Password baru minimal 6 karakter.</p>
      <form onSubmit={submit} className="mt-5 space-y-4">
        <label className="block text-xs font-semibold">
          Password saat ini
          <Input
            className="mt-2"
            type="password"
            required
            value={form.currentPassword}
            onChange={event => setForm({ ...form, currentPassword: event.target.value })}
          />
        </label>
        <label className="block text-xs font-semibold">
          Password baru
          <Input
            className="mt-2"
            type="password"
            minLength={6}
            required
            value={form.newPassword}
            onChange={event => setForm({ ...form, newPassword: event.target.value })}
          />
        </label>
        <Feedback err={err} notice={notice} />
        <Button>
          <Save size={15} /> Simpan Password
        </Button>
      </form>
    </Card>
  );
}
