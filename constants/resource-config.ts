import type { Field, PageConfig } from '@/types/resource';

export const companyFields: Field[] = [
  { name: 'nama_perusahaan', label: 'Nama Perusahaan', required: true },
  { name: 'alamat', label: 'Alamat', required: true },
  { name: 'bidang_usaha', label: 'Bidang Usaha', required: true },
  { name: 'kuota_peserta', label: 'Kuota Peserta Tersedia', type: 'select', options: ['true', 'false'], required: true },
  { name: 'direktur', label: 'Direktur', required: true },
  { name: 'kontak', label: 'Kontak', required: true },
];

export const resourceConfigs: Record<string, PageConfig> = {
  'admin:dashboard': { kind: 'dashboard' },
  'admin:monitoring-global': { kind: 'monitoring' },
  'admin:monitoring-siswa': { path: '/admin/monitoring/siswa', filters: ['kelas'] },
  'admin:monitoring-kunjungan': { path: '/admin/monitoring/kunjungan' },
  'admin:pengajuan-magang': { path: '/admin/pengajuan-magang', actions: ['approve', 'reject'] },
  'admin:siswa': {
    path: '/admin/siswa',
    createPath: '/admin/siswa',
    filters: ['kelas', 'dudiId', 'status'],
    fields: [
      { name: 'nama', label: 'Nama Lengkap', required: true },
      { name: 'nis', label: 'NIS', required: true },
      { name: 'kelas', label: 'Kelas', required: true },
    ],
    editFields: [
      { name: 'namalengkap', label: 'Nama Lengkap' },
      { name: 'nis', label: 'NIS' },
      { name: 'kelas', label: 'Kelas' },
    ],
    actions: ['edit', 'delete', 'status'],
  },
  'admin:guru': {
    path: '/admin/guru',
    createPath: '/admin/guru',
    filters: ['jurusan', 'status'],
    fields: [
      { name: 'namalengkap', label: 'Nama Lengkap', required: true },
      { name: 'nip', label: 'NIP', required: true },
      { name: 'alamat', label: 'Alamat', required: true},
      { name: 'jurusan', label: 'Jurusan', type: 'select', options: ['RPL', 'TKJ', 'MM'], required: true },
    ],
    editFields: [
      { name: 'namalengkap', label: 'Nama Lengkap' },
      { name: 'nip', label: 'NIP' },
      { name: 'alamat', label: 'Alamat'},
      { name: 'jurusan', label: 'Jurusan', type: 'select', options: ['RPL', 'TKJ', 'MM'] },
    ],
    actions: ['edit', 'delete', 'status'],
  },
  'admin:mitra': {
    path: '/admin/mitra',
    createPath: '/admin/perusahaan',
    filters: ['status'],
    fields: companyFields,
    actions: ['edit', 'delete', 'verify'],
  },
  'admin:penempatan': { kind: 'placement' },
  'admin:penempatan-data': {
    path: '/admin/penempatan',
    filters: ['kelas', 'dudiId', 'status'],
    fields: [
      { name: 'dudiId', label: 'ID Perusahaan', type: 'number', required: true },
      { name: 'guruPembimbingId', label: 'ID Guru Pembimbing', type: 'number', required: true },
      { name: 'posisi', label: 'Posisi', required: true },
    ],
    actions: ['edit', 'delete', 'status'],
  },
  'guru:dashboard': { kind: 'dashboard' },
  'guru:siswa': { path: '/guru/siswa', actions: ['grade', 'detail'] },
  'guru:dudi-bimbingan': { path: '/guru/dudi-bimbingan' },
  'guru:jurnal': { path: '/guru/jurnal', actions: ['journal'] },
  'guru:jurnal-absensi': { kind: 'journal-attendance' },
  'guru:kunjungan': {
    path: '/guru/kunjungan',
    createPath: '/guru/kunjungan',
    fields: [
      { name: 'dudiId', label: 'ID Perusahaan', type: 'number', required: true },
      { name: 'tanggalKunjungan', label: 'Tanggal Kunjungan', type: 'date', required: true },
      { name: 'catatanEvaluasi', label: 'Catatan Evaluasi', type: 'textarea', required: true },
      { name: 'foto', label: 'Foto Dokumentasi', type: 'file' },
    ],
  },
  'siswa:dashboard': { kind: 'dashboard' },
  'siswa:pengajuan-magang': { kind: 'application' },
  'siswa:absensi': { kind: 'attendance' },
  'siswa:jurnal': {
    path: '/siswa/jurnal',
    createPath: '/siswa/jurnal',
    fields: [
      { name: 'tanggalPelaksana', label: 'Tanggal Pelaksanaan', type: 'date', required: true },
      { name: 'rincianKegiatan', label: 'Rincian Kegiatan', type: 'textarea', required: true },
      { name: 'kendalaMasalah', label: 'Kendala / Masalah', type: 'textarea' },
      { name: 'tindakLanjut', label: 'Tindak Lanjut', type: 'textarea' },
      { name: 'foto', label: 'Foto Kegiatan', type: 'file' },
    ],
    actions: ['edit', 'delete'],
  },
  'siswa:perusahaan': {
    createPath: '/siswa/admin/perusahaan',
    fields: companyFields,
  },
  'admin:password': { kind: 'password' },
  'admin:audit': { kind: 'audit' },
  'siswa:password': { kind: 'password' },
  'guru:password': { kind: 'password' },
};

export const statusChoices: Record<string, string[]> = {
  guru: ['AKTIF', 'NONAKTIF'],
  siswa: ['BELUM_MAGANG', 'SEDANG_MAGANG', 'LULUS'],
  mitra: ['TERVERIFIKASI', 'MENUNGGU_VALIDASI'],
  penempatan: ['SEDANG_MAGANG', 'LULUS'],
  'penempatan-data': ['SEDANG_MAGANG', 'LULUS'],
};

export const preferredColumns: Record<string, string[]> = {
  'admin:monitoring-siswa': ['nama', 'kelas', 'dudi', 'pembimbing', 'kehadiran', 'jumlah_jurnal', 'status'],
  'admin:monitoring-kunjungan': ['tanggal', 'guru_pembimbing', 'tempat_magang', 'catatan_kunjungan'],
  'admin:siswa': ['nama', 'nis', 'kelas', 'status'],
  'admin:guru': ['namalengkap', 'nip', 'alamat' , 'jurusan', 'status'],
  'admin:mitra': ['nama_perusahaan', 'bidang_usaha', 'direktur' , 'alamat', 'kontak', 'status'],
  'admin:penempatan-data': ['siswa', 'dudi', 'guruPembimbing', 'posisi', 'status'],
  'guru:siswa': ['siswa', 'penempatan'],
  'guru:dudi-bimbingan': ['nama_perusahaan', 'bidang_usaha', 'alamat', 'kontak'],
  'guru:jurnal': ['tanggalPelaksana', 'siswa', 'rincianKegiatan', 'status'],
  'guru:kunjungan': ['tanggalKunjungan', 'dudi', 'catatanEvaluasi'],
  'siswa:jurnal': ['tanggalPelaksana', 'rincianKegiatan', 'status'],
};
