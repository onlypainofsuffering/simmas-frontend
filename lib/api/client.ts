import { TOKEN_KEY, USER_KEY } from '@/lib/auth/auth.config';

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003/api';

export function getToken() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(TOKEN_KEY) || '';
}

export function getUser() {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
  } catch {
    return null;
  }
}

export function logout() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    location.href = '/login';
  }
}

export async function api(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers || {});
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (!(options.body instanceof FormData) && options.body !== undefined) headers.set('Content-Type', 'application/json');
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers, cache: 'no-store' });
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    if (res.status === 401) {
      logout();
    }
    throw new Error(data?.message || data?.error || `Request gagal (${res.status})`);
  }
  return data;
}

export const json = (method: string, body?: any): RequestInit => ({
  method,
  ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
});

export function dataOf(data: any): any {
  return data && typeof data === 'object' && !Array.isArray(data) && 'data' in data ? data.data : data;
}

export function rowsOf(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== 'object') return [];
  for (const k of [
    'data',
    'items',
    'result',
    'results',
    'siswa',
    'guru',
    'mitra',
    'penempatan',
    'jurnal',
    'kunjungan',
    'pengajuan',
    'pengajuan_magang',
    'list_dudi_disetujui',
    'jurnal_siswa',
    'riwayat_absen',
  ]) {
    if (Array.isArray(data[k])) return data[k];
  }
  for (const k of ['data', 'result', 'results']) {
    if (data[k] && typeof data[k] === 'object') {
      const rows = rowsOf(data[k]);
      if (rows.length) return rows;
    }
  }
  return [data];
}

export function label(v: any) {
  if (v === null || v === undefined || v === '') return '-';
  if (typeof v === 'object') return v.nama || v.namalengkap || v.nama_perusahaan || v.name || v.email || JSON.stringify(v);
  return String(v);
}
