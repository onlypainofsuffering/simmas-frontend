import { api, json } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { jurnalService } from './jurnal.service';

export const guruService = {
  getStudents: () => api(endpoints.guru.siswa),
  getStudentDetail: (id: string | number) => api(endpoints.guru.siswaDetail(id)),
  gradeStudent: (id: string | number, body: { nilai: number; catatan: string }) =>
    api(endpoints.guru.studentGrade(id), json('POST', body)),
  decideJournal: (id: string | number, body: Record<string, any>) => jurnalService.decide(id, body),
  getJournals: () => jurnalService.getGuruJournals(),
  getVisits: () => api(endpoints.guru.kunjungan),
  getGuidedCompanies: () => api(endpoints.guru.dudiBimbingan),
};
