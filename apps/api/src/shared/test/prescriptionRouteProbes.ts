import type { ProfileTestApp } from './startProfileTestApp.js';
import type { Probe } from './CrossFamilyTarget.js';

// Các route đơn thuốc cùng được kiểm ở vòng phá chéo gia đình toàn app.
export function prescriptionRouteProbes(call: ProfileTestApp['call']) {
  return {
    'GET /api/health-profiles/:id/timeline': (u, x) =>
      call(u, 'GET', `/api/health-profiles/${x.profileId}/timeline`),
    'GET /api/health-profiles/:id/prescriptions': (u, x) =>
      call(u, 'GET', `/api/health-profiles/${x.profileId}/prescriptions`),
    'GET /api/health-profiles/:id/prescriptions/:prescriptionId': (u, x) =>
      call(u, 'GET', `/api/health-profiles/${x.profileId}/prescriptions/${x.prescriptionId}`),
    'GET /api/health-profiles/:id/revisits': (u, x) =>
      call(u, 'GET', `/api/health-profiles/${x.profileId}/revisits`),
    'PUT /api/health-profiles/:id/prescriptions/:prescriptionId/revisit-date': (u, x) =>
      call(u, 'PUT', `/api/health-profiles/${x.profileId}/prescriptions/${x.prescriptionId}/revisit-date`, {
        revisitDate: null,
      }),
  } satisfies Record<string, Probe>;
}
