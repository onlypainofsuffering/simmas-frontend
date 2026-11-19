'use client';

import { useEffect, useState } from 'react';
import { getUser, logout as logoutSession } from '@/lib/api/client';
import { requireAuth } from '@/lib/auth/role-guard';
import type { SessionUser } from '@/types/auth';

export function useAuth() {
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    const sync = () => setUser(getUser());
    sync();
    requireAuth();
    window.addEventListener('simmas-user-updated', sync);
    return () => window.removeEventListener('simmas-user-updated', sync);
  }, []);

  return { user, logout: logoutSession, isAuthenticated: Boolean(user) };
}
