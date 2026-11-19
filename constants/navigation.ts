import type { Role } from '@/types/auth';

export type MenuItem = [label: string, url: string, icon: string, group: string];

export const menus: Record<Role, MenuItem[]> = {
  admin: [
    ['Dashboard', '/admin/dashboard', 'LayoutDashboard', 'Overview'],
    ['Monitoring Global', '/admin/monitoring', 'Activity', 'Overview'],
    ['Guru', '/admin/guru', 'UsersRound', 'Master Data'],
    ['Siswa', '/admin/siswa', 'GraduationCap', 'Master Data'],
    ['Kelas', '/admin/kelas', 'GraduationCap', 'Master Data'],
    ['Dudi', '/admin/dudi', 'Building2', 'Master Data'],
    ['Penempatan Magang', '/admin/penempatan', 'BriefcaseBusiness', 'Manajemen'],
    ['Pengaturan Sistem', '/admin/pengaturan', 'Lock', 'Sistem'],
    ['Log Aktivitas & Audit', '/admin/audit', 'ClipboardCheck', 'Sistem'],
    ['Profil Saya', '/admin/profil', 'UserRound', 'Sistem'],
  ],
  guru: [
    ['Dashboard', '/guru/dashboard', 'LayoutDashboard', 'Overview'],
    ['Siswa Bimbingan', '/guru/bimbingan', 'Users', 'Bimbingan'],
    ['Jurnal & Absensi', '/guru/jurnal-absensi', 'BookOpen', 'Bimbingan'],
    ['Kunjungan Lapangan', '/guru/kunjungan', 'MapPinned', 'Bimbingan'],
    ['Profil Saya', '/guru/profil', 'UserRound', 'Bimbingan'],
  ],
  siswa: [
    ['Dashboard', '/siswa/dashboard', 'LayoutDashboard', 'Utama'],
    ['Pengajuan Magang', '/siswa/pengajuan', 'Send', 'Kegiatan Magang'],
    ['Absensi Harian', '/siswa/absensi', 'CalendarCheck', 'Kegiatan Magang'],
    ['Jurnal Kegiatan', '/siswa/jurnal', 'BookOpen', 'Kegiatan Magang'],
    ['Profil Saya', '/siswa/profil', 'UserRound', 'Utama'],
  ],
};

export const routeTitles: Record<string, string> = {
  '/admin/dashboard': 'Dashboard',
  '/admin/monitoring': 'Monitoring Global',
  '/admin/guru': 'Guru',
  '/admin/siswa': 'Siswa',
  '/admin/kelas': 'Kelas',
  '/admin/dudi': 'Dudi',
  '/admin/penempatan': 'Penempatan Magang',
  '/admin/pengaturan': 'Pengaturan Sistem',
  '/admin/audit': 'Log Aktivitas & Audit',
  '/admin/profil': 'Profil Saya',
  '/guru/dashboard': 'Dashboard',
  '/guru/bimbingan': 'Data Siswa',
  '/guru/jurnal-absensi': 'Jurnal & Absensi',
  '/guru/kunjungan': 'Kunjungan Lapangan',
  '/guru/profil': 'Profil Saya',
  '/siswa/dashboard': 'Dashboard',
  '/siswa/pengajuan': 'Pengajuan Magang',
  '/siswa/absensi': 'Absensi Harian',
  '/siswa/jurnal': 'Jurnal Kegiatan',
  '/siswa/password': 'Pengaturan Sistem',
  '/siswa/profil': 'Profil Saya',
};
