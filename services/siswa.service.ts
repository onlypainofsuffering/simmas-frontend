import { api, json } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { jurnalService } from './jurnal.service';
import { magangService } from './magang.service';

export const siswaService = {
  getDashboard: () => api(endpoints.siswa.dashboard),
  getJournals: () => jurnalService.getStudentJournals(),
  submitApplication: (body: Record<string, any>) => magangService.submitApplication(body),
  proposeCompany: (body: Record<string, any>) =>
    api(endpoints.siswa.adminPerusahaan, json('POST', body)),
};
