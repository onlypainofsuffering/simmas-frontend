import { api, json } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { TOKEN_KEY, USER_KEY } from './auth.config';
import { extractToken, extractUser, normalizeRole } from './auth.utils';

export async function login(email: string, password: string) {
  const response = await api(endpoints.auth.login, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  const token = extractToken(response);
  const user = extractUser(response);

  if (!token) throw new Error('Token tidak ditemukan pada response login. Periksa format response API.');

  const rawRole = String(user.role || response.role || response.data?.role || '').toLowerCase();
  const role = normalizeRole(rawRole);

  if (!role) throw new Error('Role akun tidak dikenali dari response API.');

  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));

  return { token, user, role };
}

export async function changePassword(role: string, body: { currentPassword: string; newPassword: string }) {
  return api(endpoints.password(role), json('PATCH', body));
}
