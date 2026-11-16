import { api } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';

export const dudiService = {
  getAll: () => api(endpoints.admin.mitra),
  verify: (id: string | number) => api(endpoints.admin.verifyMitra(id), { method: 'PATCH' }),
};
