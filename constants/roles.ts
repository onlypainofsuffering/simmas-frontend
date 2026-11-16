import type { Role } from '@/types/auth';

export const ROLES: Role[] = ['admin', 'guru', 'siswa'];

export const ROLE_HOME: Record<Role, string> = {
  admin: '/admin/dashboard',
  guru: '/guru/dashboard',
  siswa: '/siswa/dashboard',
};

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrator',
  guru: 'Guru Pembimbing',
  siswa: 'Siswa',
};

export function isRole(value: string): value is Role {
  return ROLES.includes(value as Role);
}
