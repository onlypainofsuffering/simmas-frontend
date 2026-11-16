export type Role = 'admin' | 'guru' | 'siswa';

export interface SessionUser {
  [key: string]: any;
  role?: string;
  namalengkap?: string;
  nama?: string;
  name?: string;
  email?: string;
}

export interface LoginResult {
  token: string;
  user: SessionUser;
  role: Role;
}
