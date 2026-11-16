import { api, json } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';

export const magangService = {
  getApplications: () => api(endpoints.admin.pengajuanMagang),
  updateStatus: (id: string | number, body: Record<string, any>) =>
    api(endpoints.admin.applicationStatus(id), json('PATCH', body)),
  submitApplication: (body: Record<string, any>) =>
    api(endpoints.siswa.pengajuanMagang, json('POST', body)),
};
