import { api } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';

export const profileService = {
  get: () => api(endpoints.profile),
  update: (body: FormData) => api(endpoints.profile, { method: 'PATCH', body }),
};
