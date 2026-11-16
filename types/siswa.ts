import type { Row } from './api';

export interface Student extends Row {
  id?: number;
  nama?: string;
  namalengkap?: string;
  nis?: string;
  kelas?: string;
  status?: string;
}
