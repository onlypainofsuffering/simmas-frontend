'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Camera } from 'lucide-react';
import { dataOf, label } from '@/lib/api/client';
import { cellValue } from '@/lib/utils/resource';
import { absensiService } from '@/services/absensi.service';
import { siswaService } from '@/services/siswa.service';
import { Feedback } from '@/components/shared/Feedback';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Table } from '@/components/ui/Table';
import type { Row } from '@/types/api';

export default function AttendancePage() {
  const [statusAbsen, setStatusAbsen] = useState('HADIR');
  const [keterangan, setKeterangan] = useState('');
  const [foto, setFoto] = useState<File | null>(null);
  const [fotoKeluar, setFotoKeluar] = useState<File | null>(null);
  const [today, setToday] = useState<Row | null>(null);
  const [history, setHistory] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [notice, setNotice] = useState('');
  const canCheckout = today?.statusAbsen === 'HADIR' && !today?.jamKeluar;
  const checkedIn = Boolean(today);

  const load = useCallback(async () => {
    try {
      const dashboard = dataOf(await siswaService.getDashboard());
      setToday(dashboard?.absen_hari_ini || null);
      setHistory(Array.isArray(dashboard?.riwayat_absen) ? dashboard.riwayat_absen : []);
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Gagal memuat riwayat absensi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function checkIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErr('');
    setNotice('');
    try {
      const body = new FormData();
      body.append('statusAbsen', statusAbsen);
      if (keterangan) body.append('keterangan', keterangan);
      if (statusAbsen === 'HADIR' && foto) body.append('foto', foto);
      const response = await absensiService.checkIn(body);
      setToday(dataOf(response));
      await load();
      setNotice('Absensi masuk berhasil dikirim.');
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Gagal mengirim absensi masuk.');
    }
  }

  async function checkOut(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErr('');
    setNotice('');
    if (!canCheckout) {
      setErr('Lakukan absen masuk berstatus HADIR terlebih dahulu.');
      return;
    }
    try {
      const body = new FormData();
      if (fotoKeluar) body.append('foto', fotoKeluar);
      const response = await absensiService.checkOut(body);
      setToday(dataOf(response));
      await load();
      setNotice('Absensi pulang berhasil dikirim.');
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Gagal mengirim absensi pulang.');
    }
  }

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Status Kehadiran Hari Ini</h2>
            <p className="mt-1 text-[11px] text-slate-400">
              {today ? `Status: ${today.statusAbsen}` : 'Belum melakukan absen masuk hari ini.'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={() => document.getElementById('attendance-checkin')?.scrollIntoView({ behavior: 'smooth' })}
              disabled={checkedIn || loading}
              className="disabled:opacity-50"
            >
              <Camera size={14} /> Check-in
            </Button>
            <Button
              type="button"
              variant="light"
              onClick={() => document.getElementById('attendance-checkout')?.scrollIntoView({ behavior: 'smooth' })}
              disabled={!canCheckout}
              className="disabled:opacity-50"
            >
              <Camera size={14} /> Check-out
            </Button>
          </div>
        </div>
        <div className="grid gap-4 p-4 lg:grid-cols-2">
          <form id="attendance-checkin" onSubmit={checkIn} className="rounded-xl border border-slate-100 p-4">
            <h3 className="text-xs font-bold text-slate-700">Absen Masuk</h3>
            <label className="mt-3 block text-[11px] font-semibold">
              Status Kehadiran
              <Select className="mt-1" value={statusAbsen} disabled={checkedIn || loading} onChange={event => setStatusAbsen(event.target.value)}>
                <option>HADIR</option>
                <option>IZIN</option>
                <option>SAKIT</option>
              </Select>
            </label>
            {statusAbsen !== 'HADIR' && (
              <label className="mt-3 block text-[11px] font-semibold">
                Keterangan
                <textarea className="input mt-1" required value={keterangan} disabled={checkedIn} onChange={event => setKeterangan(event.target.value)} />
              </label>
            )}
            {statusAbsen === 'HADIR' && (
              <label className="mt-3 block text-[11px] font-semibold">
                Foto selfie masuk
                <Input
                  className="mt-1"
                  type="file"
                  accept="image/*"
                  capture="user"
                  required
                  disabled={checkedIn}
                  onChange={event => setFoto(event.target.files?.[0] || null)}
                />
              </label>
            )}
            <Button disabled={checkedIn || loading} className="mt-4 w-full disabled:cursor-not-allowed disabled:opacity-50">
              <Camera size={14} /> {checkedIn ? 'Absen masuk tercatat' : 'Kirim Absen Masuk'}
            </Button>
          </form>
          <form id="attendance-checkout" onSubmit={checkOut} className="rounded-xl border border-slate-100 p-4">
            <h3 className="text-xs font-bold text-slate-700">Absen Pulang</h3>
            <p className="mt-2 text-[11px] text-slate-400">
              Checkout hanya tersedia jika status check-in hari ini HADIR dan belum checkout.
            </p>
            <label className="mt-3 block text-[11px] font-semibold">
              Foto selfie pulang
              <Input
                className="mt-1"
                type="file"
                accept="image/*"
                capture="user"
                required
                disabled={!canCheckout}
                onChange={event => setFotoKeluar(event.target.files?.[0] || null)}
              />
            </label>
            <Button disabled={!canCheckout} className="mt-4 w-full disabled:cursor-not-allowed disabled:opacity-50">
              <Camera size={14} /> {today?.jamKeluar ? 'Checkout tercatat' : 'Kirim Absen Pulang'}
            </Button>
          </form>
        </div>
        <Feedback err={err} notice={notice} />
      </Card>
      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 p-4">
          <h2 className="text-sm font-bold text-slate-800">Riwayat Absensi</h2>
          <p className="mt-1 text-[11px] text-slate-400">Riwayat kehadiran dari dashboard akun Anda.</p>
        </div>
        {loading ? (
          <EmptyState text="Memuat riwayat absensi..." />
        ) : history.length ? (
          <div className="overflow-x-auto">
            <Table className="min-w-[560px]">
              <thead className="bg-slate-50 text-[10px] uppercase text-slate-400">
                <tr>
                  {['Tanggal', 'Status', 'Masuk', 'Pulang', 'Keterangan', 'Foto'].map(item => (
                    <th key={item} className="px-4 py-3">
                      {item}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((item, index) => (
                  <tr key={item.id ?? index}>
                    <td className="px-4 py-3">{cellValue(item, 'tanggal') || '-'}</td>
                    <td className="px-4 py-3">{label(item.statusAbsen)}</td>
                    <td className="px-4 py-3">
                      {item.jamMasuk ? new Date(item.jamMasuk).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                    <td className="px-4 py-3">
                      {item.jamKeluar ? new Date(item.jamKeluar).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                    <td className="px-4 py-3">{label(item.keterangan)}</td>
                    <td className="space-x-1 px-4 py-3">
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
      </Card>
    </div>
  );
}
