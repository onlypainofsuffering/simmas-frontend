import { api } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';

export const absensiService = {
  checkIn: (body: FormData) => api(endpoints.siswa.absenMasuk, { method: 'POST', body }),
  checkOut: (body: FormData) => api(endpoints.siswa.absenKeluar, { method: 'POST', body }),
};
