import type { components } from '../../src/shared/api/schema.gen.js';
import { issue } from '../painJournalFixture.js';
import { summaryRouteResponse } from './summaryRouteResponse.js';
import { selfPainData } from '../selfPainData.js';
import { todayState } from '../todayState.js';
import { reminderUiSeed } from '../reminderUiSeed.js';
import { prescriptionResponse } from './prescriptionResponse.js';
import { routeIds } from './routes.js';

export function healthRouteResponse(url: URL): unknown {
  const path = url.pathname;
  const leaf = path.split('/').at(-1);
  const pain = selfPainData('member');
  const today = todayState('member');
  const seed = reminderUiSeed();
  if (path.endsWith('/pain-issues')) return { issues: [{ ...issue, entryCount: pain.detail.entryCount }] };
  if (path.includes('/pain-issues/') && leaf === routeIds.issueId) return pain.detail;
  if (path.endsWith('/context'))
    return {
      from: url.searchParams.get('from'),
      to: url.searchParams.get('to'),
      asNeededDoses: [],
      courses: [],
    };
  if (path.endsWith('/reminders')) return today.rows;
  if (path.endsWith('/dose-slots')) return seed.slots;
  if (path.endsWith('/reminder-recipients')) return seed.recipients;
  if (path.endsWith('/guardians'))
    return { guardians: [{ accountId: today.session.account.id, displayName: 'Mẹ', isMe: true }] };
  if (path.endsWith('/measurements/series')) return { points: [], periods: [], weeks: [] };
  if (path.endsWith('/adherence-periods')) return { today: '2026-11-26', periods: [] };
  if (path.endsWith('/temperatures')) return { readings: [] };
  if (path.endsWith('/as-needed-doses')) return { doses: [] };
  if (/\/(medication-courses|medications)\/(current|stoppable)$/.test(path))
    return { today: '2026-11-26', courses: [] };
  if (['measurements', 'timeline', 'document-entries'].includes(leaf ?? ''))
    return { items: [], nextCursor: null };
  if (['lab-result-series', 'revisits'].includes(leaf ?? '')) return [];
  if (path.endsWith('/prescriptions'))
    return [
      {
        id: routeIds.prescriptionId,
        issuedDate: '2026-11-20',
        facility: 'Cơ sở khám mẫu',
        diagnosis: null,
        itemCount: 1,
        revisitDate: null,
        origin: 'manual',
      } satisfies components['schemas']['PrescriptionListItem'],
    ];
  if (path.endsWith(`/prescriptions/${routeIds.prescriptionId}`)) return prescriptionResponse;
  if (path.endsWith('/visit-summary')) return summaryRouteResponse(url);
  return undefined;
}
