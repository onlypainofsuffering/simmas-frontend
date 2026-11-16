import type { Row } from './api';

export interface Teacher extends Row {
  id?: number;
  namalengkap?: string;
  nip?: string;
  jurusan?: string;
  status?: string;
}
