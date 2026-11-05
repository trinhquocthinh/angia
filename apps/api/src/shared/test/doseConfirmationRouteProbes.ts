import type { Probe } from './CrossFamilyTarget.js';
import type { ProfileTestApp } from './startProfileTestApp.js';

// Các route "Đã dùng" cùng được kiểm ở vòng phá chéo gia đình toàn app (SPEC-046).
export function doseConfirmationRouteProbes(call: ProfileTestApp['call']) {
  return {
    'POST /api/reminders/:reminderId/dose-confirmation': (u, x) =>
      call(u, 'POST', `/api/reminders/${x.reminderId}/dose-confirmation`, {}),
    'DELETE /api/reminders/:reminderId/dose-confirmation': (u, x) =>
      call(u, 'DELETE', `/api/reminders/${x.reminderId}/dose-confirmation`),
    'GET /api/health-profiles/:id/reminders': (u, x) =>
      call(u, 'GET', `/api/health-profiles/${x.profileId}/reminders`),
  } satisfies Record<string, Probe>;
}
