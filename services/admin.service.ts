import { api, json } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { dudiService } from './dudi.service';
import { magangService } from './magang.service';

export const adminService = {
  getMonitoringStudents: () => api(endpoints.admin.monitoringSiswa),
  getTeachers: () => api(endpoints.admin.guru),
  getActiveTeachers: () => api(endpoints.admin.guruActive),
  getCompanies: () => dudiService.getAll(),
  getApplications: () => magangService.getApplications(),
  getVisits: () => api(endpoints.admin.monitoringKunjungan),
  decideApplication: (id: string | number, body: Record<string, any>) => magangService.updateStatus(id, body),
  verifyCompany: (id: string | number) => dudiService.verify(id),
  updateTeacherStatus: (id: string | number, status: string) =>
    api(endpoints.admin.guruStatus(id), json('PATCH', { status })),
  updateStudentStatus: (id: string | number, status: string) =>
    api(endpoints.admin.siswaStatus(id), json('PATCH', { status })),
  updatePlacementStatus: (id: string | number, status: string) =>
    api(endpoints.admin.penempatanStatus(id), json('PATCH', { status })),
};
