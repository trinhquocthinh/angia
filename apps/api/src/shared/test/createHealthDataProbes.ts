import type { ProfileTestApp } from './startProfileTestApp.js';
import type { SeededSession } from './seedAuthFixtures.js';
import type { Probe } from './CrossFamilyTarget.js';
import type { RouteOfKind } from './healthDataRoutes.js';
import { painJournalRouteProbes } from './painJournalRouteProbes.js';
import { asNeededDoseRouteProbes } from './asNeededDoseRouteProbes.js';
import { doseConfirmationRouteProbes } from './doseConfirmationRouteProbes.js';
import { prescriptionRouteProbes } from './prescriptionRouteProbes.js';
import { ATTESTATION, attestationPath, linkCall } from './profileConsentFixture.js';
import { manualCourse as course, manualReading as reading } from './healthDataFixtures.js';

const profiles = '/api/health-profiles';
const documents = '/api/source-documents';
const acceptBody = { decision: 'accepted' };
const adherence = { medicationName: 'Canxi', status: 'taking', fromDate: '2026-10-01' };
const seriesQuery = 'kind=blood_pressure&from=2026-10-01&to=2026-10-31';

const upload = (
  t: ProfileTestApp,
  user: SeededSession,
  profileId: string,
  path = 'upload-batches',
  field = 'files',
) => {
  const form = new FormData();
  form.append(field, new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 9])], 'a.jpg'));
  return t.app.request(`${profiles}/${profileId}/${path}`, {
    method: 'POST',
    headers: { cookie: user.cookie, 'x-csrf-token': user.csrf },
    body: form,
  });
};

const profileProbes = (t: ProfileTestApp) =>
  ({
    ...painJournalRouteProbes((...args) => t.call(...args)),
    'POST /api/health-profiles': (u, x) =>
      t.call(u, 'POST', profiles, { birthYear: 1950, displayName: 'Lén', linkedAccountId: x.accountId }),
    'DELETE /api/health-profiles/:id': (u, x) =>
      t.call(u, 'DELETE', `${profiles}/${x.profileId}`, { confirmName: 'Mẹ' }), // tên đúng của nạn nhân
    'PATCH /api/health-profiles/:id': (u, x) =>
      t.call(u, 'PATCH', `${profiles}/${x.profileId}`, { birthYear: 2020, vitalsEnabled: true }),
    'POST /api/health-profiles/:id/consent-attestation': (u, x) =>
      t.call(u, 'POST', attestationPath(x.profileId), ATTESTATION),
    'POST /api/health-profiles/:id/link-invitations': (u, x) =>
      t.call(u, 'POST', `${profiles}/${x.profileId}/link-invitations`, {}),
    'DELETE /api/health-profiles/:id/link-invitations': (u, x) =>
      t.call(u, 'DELETE', `${profiles}/${x.profileId}/link-invitations`),
    'GET /api/me/link-invitations/view': (u, x) => linkCall(t, u, x.token),
    'POST /api/me/link-invitations/accept': (u, x) => linkCall(t, u, x.token, acceptBody),
    'POST /api/health-profiles/:id/upload-batches': (u, x) => upload(t, u, x.profileId),
    'POST /api/health-profiles/:id/redaction-suggestions': (u, x) =>
      upload(t, u, x.profileId, 'redaction-suggestions', 'image'),
    'GET /api/source-documents/:id/review': (u, x) => t.call(u, 'GET', `${documents}/${x.documentId}/review`),
    'GET /api/source-documents/:id/image': (u, x) => t.call(u, 'GET', `${documents}/${x.documentId}/image`),
    'POST /api/source-documents/:id/approve': (u, x) =>
      t.call(u, 'POST', `${documents}/${x.documentId}/approve`, { type: 'device_reading', data: reading }),
    // TC-414 (SPEC-037)
    'GET /api/source-documents/:id/deletion-impact': (u, x) =>
      t.call(u, 'GET', `${documents}/${x.documentId}/deletion-impact`),
    'DELETE /api/source-documents/:id': (u, x) =>
      t.call(u, 'DELETE', `${documents}/${x.documentId}`, { confirm: 'XÓA' }),
    'GET /api/health-profiles/:id/measurements': (u, x) =>
      t.call(u, 'GET', `${profiles}/${x.profileId}/measurements`),
    'GET /api/health-profiles/:id/measurements/series': (u, x) =>
      t.call(u, 'GET', `${profiles}/${x.profileId}/measurements/series?${seriesQuery}`),
    'GET /api/health-profiles/:id/lab-result-series': (u, x) =>
      t.call(u, 'GET', `${profiles}/${x.profileId}/lab-result-series`),
    'GET /api/health-profiles/:id/document-entries': (u, x) =>
      t.call(u, 'GET', `${profiles}/${x.profileId}/document-entries`),
  }) satisfies Partial<Record<RouteOfKind<'scoped'>, Probe>>;

const recordProbes = (t: ProfileTestApp) =>
  ({
    'POST /api/health-profiles/:id/medication-courses': (u, x) =>
      t.call(u, 'POST', `${profiles}/${x.profileId}/medication-courses`, course),
    'GET /api/health-profiles/:id/medication-courses/stoppable': (u, x) =>
      t.call(u, 'GET', `${profiles}/${x.profileId}/medication-courses/stoppable`),
    'GET /api/health-profiles/:id/medication-courses/current': (u, x) =>
      t.call(u, 'GET', `${profiles}/${x.profileId}/medication-courses/current`),
    'POST /api/health-profiles/:id/medication-courses/:courseId/stop': (u, x) =>
      t.call(u, 'POST', `${profiles}/${x.profileId}/medication-courses/${x.courseId}/stop`, {
        stopDate: '2026-10-05',
      }),
    'POST /api/health-profiles/:id/prescriptions/:prescriptionId/reuse': (u, x) =>
      t.call(u, 'POST', `${profiles}/${x.profileId}/prescriptions/${x.prescriptionId}/reuse`, {
        startDate: '2026-10-02',
        items: [{ prescriptionItemId: x.courseId, durationDays: 7, longTerm: false }],
      }),
    'GET /api/health-profiles/:id/adherence-periods': (u, x) =>
      t.call(u, 'GET', `${profiles}/${x.profileId}/adherence-periods`),
    'POST /api/health-profiles/:id/adherence-periods': (u, x) =>
      t.call(u, 'POST', `${profiles}/${x.profileId}/adherence-periods`, { ...adherence, status: 'stopped' }),
    'GET /api/health-profiles/:id/dose-slots': (u, x) =>
      t.call(u, 'GET', `${profiles}/${x.profileId}/dose-slots`),
    'PUT /api/health-profiles/:id/dose-slots': (u, x) =>
      t.call(u, 'PUT', `${profiles}/${x.profileId}/dose-slots`, { slots: { noon: '12:00' } }),
    'POST /api/health-profiles/:id/guardians': (u, x) =>
      t.call(u, 'POST', `${profiles}/${x.profileId}/guardians`, { guardianAccountId: x.accountId }),
    'DELETE /api/health-profiles/:id/guardians/me': (u, x) =>
      t.call(u, 'DELETE', `${profiles}/${x.profileId}/guardians/me`),
    'GET /api/health-profiles/:id/reminder-recipients': (u, x) =>
      t.call(u, 'GET', `${profiles}/${x.profileId}/reminder-recipients`),
    'PUT /api/health-profiles/:id/reminder-recipients': (u, x) =>
      t.call(u, 'PUT', `${profiles}/${x.profileId}/reminder-recipients`, {
        recipientAccountIds: [x.accountId],
      }),
    'GET /api/health-profiles/:id/visit-summary': (u, x) =>
      t.call(u, 'GET', `${profiles}/${x.profileId}/visit-summary`),
    ...prescriptionRouteProbes((...args) => t.call(...args)),
    'GET /api/me/revisit-reminders/:reminderId': (u, x) =>
      t.call(u, 'GET', `/api/me/revisit-reminders/${x.revisitReminderId}`),
    'GET /api/me/reminders/:reminderId': (u, x) => t.call(u, 'GET', `/api/me/reminders/${x.reminderId}`),
    ...doseConfirmationRouteProbes((...args) => t.call(...args)),
    ...asNeededDoseRouteProbes((...args) => t.call(...args)),
    'POST /api/health-profiles/:id/manual-records': (u, x) =>
      t.call(u, 'POST', `${profiles}/${x.profileId}/manual-records`, {
        type: 'device_reading',
        data: reading,
      }),
  }) satisfies Partial<Record<RouteOfKind<'scoped'>, Probe>>;

export const createHealthDataProbes = (t: ProfileTestApp): Record<RouteOfKind<'scoped'>, Probe> => ({
  ...profileProbes(t),
  ...recordProbes(t),
});
