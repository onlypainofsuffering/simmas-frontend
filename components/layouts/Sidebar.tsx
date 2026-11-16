'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CalendarCheck,
  ClipboardCheck,
  GraduationCap,
  LayoutDashboard,
  Lock,
  MapPinned,
  Send,
  Users,
  UsersRound,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { menus } from '@/constants/navigation';
import type { Role } from '@/types/auth';

const icons: Record<string, LucideIcon> = {
  Activity,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CalendarCheck,
  ClipboardCheck,
  GraduationCap,
  LayoutDashboard,
  Lock,
  MapPinned,
  Send,
  Users,
  UsersRound,
};

interface SidebarProps {
  role: Role;
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ role, open, onClose }: SidebarProps) {
  const path = usePathname();
  let activeGroup = '';

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-56 flex-col border-r border-slate-100 bg-white transition-transform lg:translate-x-0 ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex h-14 items-center gap-3 border-b border-slate-100 px-5">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600 font-bold text-white">S</div>
        <div>
          <div className="font-bold tracking-tight text-slate-800">SIMMAS</div>
          <div className="text-[9px] tracking-[.14em] text-slate-400">SISTEM INFORMASI MAGANG</div>
        </div>
        <button className="ml-auto lg:hidden" onClick={onClose} aria-label="Tutup menu">
          <X size={18} />
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 pb-3 pt-5">
        {menus[role].map(([label, url, iconName, group]) => {
          const Icon = icons[iconName] || LayoutDashboard;
          const active = path === url || path.startsWith(`${url}/`);
          const showGroup = group !== activeGroup;
          activeGroup = group;
          return (
            <div key={url}>
              {showGroup && (
                <div className="px-2 pb-2 pt-4 text-[9px] font-bold uppercase tracking-[.16em] text-slate-400">{group}</div>
              )}
              <Link
                href={url}
                onClick={onClose}
                className={`mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition ${
                  active ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-500 hover:bg-blue-50 hover:text-blue-700'
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            </div>
          );
        })}
      </nav>
      <div className="m-4 rounded-xl bg-blue-50 p-4">
        <div className="text-xs font-semibold text-blue-900">SIMMAS Portal</div>
        <p className="mt-1 text-[11px] leading-5 text-blue-700">Sistem monitoring praktik kerja lapangan.</p>
      </div>
    </aside>
  );
}
