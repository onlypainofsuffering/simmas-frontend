'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ChevronDown, LogOut, Menu, Settings } from 'lucide-react';
import type { Role } from '@/types/auth';

interface HeaderProps {
  role: Role;
  title: string;
  name: string;
  passwordUrl: string | null;
  onOpenMenu: () => void;
  onLogout: () => void;
}

export default function Header({ role, title, name, passwordUrl, onOpenMenu, onLogout }: HeaderProps) {
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-slate-100 bg-white/95 px-5 backdrop-blur md:px-8">
      <div className="flex items-center gap-3">
        <button className="rounded-lg p-2 hover:bg-slate-100 lg:hidden" onClick={onOpenMenu} aria-label="Buka menu">
          <Menu size={20} />
        </button>
        <div>
          <div className="text-[10px] text-slate-400">SIMMAS / {role.toUpperCase()}</div>
          <h1 className="text-sm font-bold text-slate-800">{title}</h1>
        </div>
      </div>
      <div className="relative">
        <button
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50"
          onClick={() => setProfileOpen(!profileOpen)}
        >
          <div className="grid h-8 w-8 place-items-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
            {String(name).charAt(0).toUpperCase()}
          </div>
          <span className="hidden text-left sm:block">
            <span className="block text-[11px] font-semibold text-slate-700">{name}</span>
            <span className="block text-[9px] capitalize text-slate-400">{role}</span>
          </span>
          <ChevronDown size={14} className="text-slate-400" />
        </button>
        {profileOpen && (
          <div className="absolute right-0 top-full z-50 mt-2 w-52 rounded-xl border border-slate-100 bg-white p-2 shadow-lg">
            {passwordUrl && (
              <Link
                href={passwordUrl}
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-600 hover:bg-blue-50"
              >
                <Settings size={15} /> Ganti password
              </Link>
            )}
            <button
              onClick={onLogout}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-rose-600 hover:bg-rose-50"
            >
              <LogOut size={15} /> Keluar
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
