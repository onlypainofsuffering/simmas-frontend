import type { Row } from './api';

export interface Company extends Row {
  id?: number;
  nama_perusahaan?: string;
  alamat?: string;
  bidang_usaha?: string;
  kuota_peserta?: boolean;
  kontak?: string;
  status?: string;
}
