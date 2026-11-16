import type { Row } from '@/types/api';
import { formatDate } from './format-date';

export function titleCase(value: string) {
  return value.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/^./, c => c.toUpperCase());
}

export function idOf(item: Row) {
  const id = item.id ?? item.ID ?? item.siswa?.id;
  return id === null || id === undefined ? '' : String(id);
}

export function cellValue(item: Row, key: string) {
  if (key === 'status' && item.siswa?.status) return item.siswa.status;
  const value = item[key];
  if (key === 'kehadiran' && value && typeof value === 'object') return value.format || JSON.stringify(value);
  if (key === 'siswa' && value && typeof value === 'object') return value.nama || value.namalengkap || value.nis || '-';
  if (key === 'penempatan' && value && typeof value === 'object') return [value.dudi?.nama_perusahaan, value.posisi].filter(Boolean).join(' · ') || '-';
  if (['dudi', 'guruPembimbing', 'guru_pembimbing'].includes(key) && value && typeof value === 'object') {
    return value.nama_perusahaan || value.namalengkap || value.nama || value.name || '-';
  }
  if (['tanggal', 'tanggalPelaksana', 'tanggalKunjungan'].includes(key) && value) {
    return formatDate(value);
  }
  return value;
}

export function findRows(value: any, keys: string[]): Row[] {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'object') return [];
  for (const key of keys) {
    const candidate = value[key];
    if (Array.isArray(candidate)) return candidate;
  }
  for (const key of ['data', 'result', 'dashboard']) {
    if (value[key] && typeof value[key] === 'object') {
      const found = findRows(value[key], keys);
      if (found.length) return found;
    }
  }
  return [];
}
