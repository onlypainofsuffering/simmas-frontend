import { TOKEN_KEY } from './auth.config';

export function isAuthenticated() {
  if (typeof window === 'undefined') return false;
  return Boolean(localStorage.getItem(TOKEN_KEY));
}

export function requireAuth() {
  if (typeof window === 'undefined') return;
  if (!localStorage.getItem(TOKEN_KEY)) location.href = '/login';
}
