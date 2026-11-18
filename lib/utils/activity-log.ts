import { USER_KEY } from '@/lib/auth/auth.config';
import { getDisplayName } from '@/lib/auth/auth.utils';
import type { SessionUser } from '@/types/auth';

const STORAGE_KEY = 'simmas_activity_logs';
const MAX_ENTRIES = 200;

export interface ActivityLogEntry {
  id: string;
  occurredAt: string;
  action: string;
  menu: string;
  detail: string;
  actor: string;
}

function readLogs(): ActivityLogEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as ActivityLogEntry[]) : [];
  } catch {
    return [];
  }
}

export function getActivities(): ActivityLogEntry[] {
  return readLogs();
}

export function formatTimeAgo(iso: string) {
  const timestamp = new Date(iso).getTime();
  if (Number.isNaN(timestamp)) return '-';

  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60_000));
  if (minutes < 1) return 'Baru saja';
  if (minutes < 60) return `${minutes} menit lalu`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} hari lalu`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} bulan lalu`;

  return `${Math.floor(months / 12)} tahun lalu`;
}

export function formatActivityTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}

export function recordActivity(input: { action: string; menu: string; detail: string }) {
  if (typeof window === 'undefined') return;
  let user: SessionUser | null = null;
  try {
    const raw = window.localStorage.getItem(USER_KEY);
    user = raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    user = null;
  }

  const entry: ActivityLogEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    occurredAt: new Date().toISOString(),
    action: input.action,
    menu: input.menu,
    detail: input.detail,
    actor: getDisplayName(user, '-'),
  };

  const next = [entry, ...readLogs()].slice(0, MAX_ENTRIES);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent('simmas-activity-updated'));
}
