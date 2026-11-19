import type { Row } from '@/types/api';
import { formatDate } from './format-date';

export function titleCase(value: string) {
  return String(value)
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

const keptAcronyms = new Set(['RPL', 'TKJ', 'MM', 'NIS', 'NIP', 'ID', 'DUDI', 'PKL']);

export function humanize(value: any): string {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'boolean') return value ? 'Ya' : 'Tidak';
  if (Array.isArray(value)) {
    const items = value.map(humanize).filter(item => item !== '-');
    return items.length ? items.join(', ') : '-';
  }
  if (typeof value === 'object') {
    const preferred = ['nama', 'namalengkap', 'nama_perusahaan', 'name', 'judul', 'label', 'email', 'keterangan', 'status'];
    for (const key of preferred) {
      const candidate = value[key];
      if (candidate !== null && candidate !== undefined && candidate !== '') return humanize(candidate);
    }
    const entries = Object.entries(value).filter(
      ([key]) => !/id$|password|format/i.test(key),
    );
    return entries.length ? entries.map(([key, item]) => `${titleCase(key)}: ${humanize(item)}`).join(', ') : '-';
  }

  const text = String(value).trim();
  if (!text) return '-';
  const isEnum = text.includes('_') || (text === text.toUpperCase() && /^[A-Z0-9]+$/.test(text));
  if (!isEnum) return text;
  const words = text.split(/[_\s]+/);
  return words
    .map(word => (keptAcronyms.has(word) || word.length <= 3 ? word : word.charAt(0) + word.slice(1).toLowerCase()))
    .join(' ');
}

export function idOf(item: Row) {
  const id = item.id ?? item.ID ?? item.siswa?.id;
  return id === null || id === undefined ? '' : String(id);
}

export function cellValue(item: Row, key: string) {
  if (key === 'status' && item.siswa?.status) return item.siswa.status;
  const value = item[key];
  if (key === 'kehadiran' && value && typeof value === 'object') return value.format || value;
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
