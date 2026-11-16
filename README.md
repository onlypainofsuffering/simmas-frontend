# SIMMAS Frontend
Frontend Next.js 14 + TypeScript + Tailwind CSS untuk sistem manajemen magang.

## Menjalankan project
1. Install Node.js 18.17+ (disarankan Node 20).
2. Jalankan `npm install`.
3. Salin `.env.example` menjadi `.env.local`.
4. Ubah `NEXT_PUBLIC_API_URL` sesuai alamat backend, contoh `http://localhost:3003/api` atau `https://domain-backend/api`.
5. Jalankan `npm run dev` lalu buka http://localhost:3000.

## Struktur halaman
- `/login`
- Admin: `/admin/dashboard`, `/admin/monitoring`, `/admin/guru`, `/admin/siswa`, `/admin/dudi`, `/admin/penempatan`, `/admin/pengaturan`, `/admin/audit`
- Guru: `/guru/dashboard`, `/guru/bimbingan`, `/guru/jurnal-absensi`, `/guru/kunjungan`
- Siswa: `/siswa/dashboard`, `/siswa/pengajuan`, `/siswa/absensi`, `/siswa/jurnal`

## Catatan integrasi
- Semua request memakai `Authorization: Bearer <token>` setelah login.
- Bentuk response login dideteksi dari `access_token`, `accessToken`, atau `token`, serta role dari object user. Jika backend memakai nama field berbeda, sesuaikan `lib/auth/auth.service.ts`.
- Form pendaftaran mengikuti DTO backend: guru memakai `namalengkap`, `nip`, `jurusan`; siswa memakai `nama`, `nis`, `kelas`; backend menghasilkan email dan password awal akun.
- Halaman siswa membaca `data.list_dudi_disetujui`, `data.pengajuan_magang`, `data.absen_hari_ini`, dan `data.riwayat_absen` dari response dashboard backend.
- Guru dapat memeriksa riwayat absensi melalui tab Jurnal & Absensi; daftar DUDI untuk kunjungan diambil dari `/guru/dudi-bimbingan`.
- Ganti password Guru dan Log Aktivitas & Audit belum memiliki endpoint pada backend yang dilampirkan; keduanya tidak mengirim request palsu.
- Dashboard admin, guru, dan siswa menampilkan ringkasan berdasarkan endpoint masing-masing.
- Absensi masuk/pulang dan jurnal menggunakan `multipart/form-data`. Input foto memakai `capture` untuk meminta kamera pada perangkat yang mendukungnya. Checkout membutuhkan check-in HADIR sesuai aturan backend.
- Tabel dibuat dinamis dari key response API, sehingga tetap dapat menampilkan struktur data backend yang berbeda.

## Endpoint
Konfigurasi endpoint ada di `lib/api/endpoints.ts`; base URL dan helper request ada di `lib/api/client.ts`; konfigurasi resource ada di `constants/resource-config.ts`.
