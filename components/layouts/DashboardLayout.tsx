'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Header from './Header';
import MobileSidebar from './MobileSidebar';
import Sidebar from './Sidebar';
import { routeTitles } from '@/constants/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getDisplayName } from '@/lib/auth/auth.utils';
import type { Role } from '@/types/auth';

interface DashboardLayoutProps {
  role: Role;
  children: React.ReactNode;
}

export default function DashboardLayout({ role, children }: DashboardLayoutProps) {
  const path = usePathname();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const title = routeTitles[path] || path.split('/').filter(Boolean).pop()?.replaceAll('-', ' ') || 'Dashboard';
  const name = getDisplayName(user, role);
  const passwordUrl = role === 'admin' ? '/admin/pengaturan' : role === 'siswa' ? '/siswa/password' : null;

  return (
    <div className="min-h-screen">
      <MobileSidebar open={open} onClose={() => setOpen(false)} />
      <Sidebar role={role} open={open} onClose={() => setOpen(false)} />
      <div className="lg:pl-56">
        <Header
          role={role}
          title={title}
          name={name}
          passwordUrl={passwordUrl}
          onOpenMenu={() => setOpen(true)}
          onLogout={logout}
        />
        <main className="mx-auto max-w-[1320px] p-4 md:p-6">
          {children}
          <footer className="mt-10 border-t border-slate-200 py-5 text-center text-[11px] text-slate-400">
            © {new Date().getFullYear()} SIMMAS · Sistem Informasi Manajemen Magang
          </footer>
        </main>
      </div>
    </div>
  );
}
