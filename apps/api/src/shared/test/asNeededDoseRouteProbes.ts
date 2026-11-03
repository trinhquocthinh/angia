import type { Probe } from './CrossFamilyTarget.js';
import type { ProfileTestApp } from './startProfileTestApp.js';

// Các route nhật ký liều "Khi cần" và nhiệt độ cùng được kiểm ở vòng phá chéo gia đình toàn app (SPEC-047, SPEC-048).
export function asNeededDoseRouteProbes(call: ProfileTestApp['call']) {
  const doses = (profileId: string) => `/api/health-profiles/${profileId}/as-needed-doses`;
  const temperatures = (profileId: string) => `/api/health-profiles/${profileId}/temperatures`;
  return {
    'POST /api/health-profiles/:id/as-needed-doses': (u, x) =>
      call(u, 'POST', doses(x.profileId), { courseId: x.asNeededCourseId, givenAt: '2026-10-01T07:00:00Z' }),
    'GET /api/health-profiles/:id/as-needed-doses': (u, x) =>
      call(u, 'GET', `${doses(x.profileId)}?from=2026-01-01&to=2026-12-31`),
    'DELETE /api/health-profiles/:id/as-needed-doses/:doseId': (u, x) =>
      call(u, 'DELETE', `${doses(x.profileId)}/${x.doseId}`),
    'PUT /api/health-profiles/:id/medication-courses/:courseId/interval': (u, x) =>
      call(
        u,
        'PUT',
        `/api/health-profiles/${x.profileId}/medication-courses/${x.asNeededCourseId}/interval`,
        {
          text: 'cách 6 giờ',
        },
      ),
    'POST /api/health-profiles/:id/temperatures': (u, x) =>
      call(u, 'POST', temperatures(x.profileId), { celsius: 37, measuredAt: '2026-10-01T07:00:00Z' }),
    'GET /api/health-profiles/:id/temperatures': (u, x) =>
      call(u, 'GET', `${temperatures(x.profileId)}?from=2026-01-01&to=2026-12-31`),
    'DELETE /api/health-profiles/:id/temperatures/:readingId': (u, x) =>
      call(u, 'DELETE', `${temperatures(x.profileId)}/${x.readingId}`),
  } satisfies Record<string, Probe>;
}
