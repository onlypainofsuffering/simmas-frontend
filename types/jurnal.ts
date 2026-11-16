import type { Row } from './api';

export interface JournalEntry extends Row {
  id?: number;
  tanggalPelaksana?: string;
  rincianKegiatan?: string;
  kendalaMasalah?: string;
  tindakLanjut?: string;
  status?: string;
  siswa?: Row;
}
