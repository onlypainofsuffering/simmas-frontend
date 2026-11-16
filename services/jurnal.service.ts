import { api, json } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';

export const jurnalService = {
  getGuruJournals: () => api(endpoints.guru.jurnal),
  getStudentJournals: () => api(endpoints.siswa.jurnal),
  decide: (id: string | number, body: Record<string, any>) =>
    api(endpoints.guru.journalDecision(id), json('PATCH', body)),
};
