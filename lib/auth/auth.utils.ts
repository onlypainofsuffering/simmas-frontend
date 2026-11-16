import type { Role, SessionUser } from '@/types/auth';

export function normalizeRole(rawRole: string): Role | '' {
  const value = String(rawRole || '').toLowerCase();
  if (value.includes('admin')) return 'admin';
  if (value.includes('guru')) return 'guru';
  if (value.includes('siswa')) return 'siswa';
  return '';
}

export function extractToken(response: any) {
  return response?.access_token || response?.accessToken || response?.token || response?.data?.access_token || response?.data?.token;
}

export function extractUser(response: any): SessionUser {
  return response?.user || response?.data?.user || response?.data || {};
}

export function getDisplayName(user: SessionUser | null, fallback: string) {
  return user?.namalengkap || user?.nama || user?.name || user?.email || fallback;
}
