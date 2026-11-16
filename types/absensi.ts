import type { Row } from './api';

export interface AttendanceRecord extends Row {
  id?: number;
  tanggal?: string;
  statusAbsen?: string;
  jamMasuk?: string;
  jamKeluar?: string;
  keterangan?: string;
  fotoMasukUrl?: string;
  fotoKeluarUrl?: string;
}
