import type { Row } from './api';

export interface Application extends Row {
  id?: number;
  status?: string;
  posisi?: string;
  siswa?: Row;
  dudi?: Row;
}

export interface Placement extends Row {
  id?: number;
  status?: string;
  posisi?: string;
  dudiId?: number;
  guruPembimbingId?: number;
}
