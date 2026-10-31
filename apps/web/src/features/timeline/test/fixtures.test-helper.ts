import type { TimelineEvent, TimelinePage } from '@angia/contracts';
import { profile as baseProfile } from '../../prescriptions/test/fixtures.test-helper';

export { session, profileId } from '../../prescriptions/test/fixtures.test-helper';
export const profile = { ...baseProfile, birthYear: null, vitalsEnabled: null };
const eventId = '00000000-0000-4000-8000-000000000010';
const key = { id: eventId, date: '2026-10-30', time: null };
export const events: TimelineEvent[] = [
  {
    ...key,
    kind: 'prescription',
    time: '09:30',
    data: {
      prescriptionId: eventId,
      facility: 'Phòng khám An',
      diagnosis: 'Nội dung trên đơn',
      itemCount: 2,
      diffSummary: { added: 1, removed: 0, changed: 1 },
    },
  },
  {
    ...key,
    kind: 'lab_result',
    data: {
      groupId: eventId,
      facility: null,
      results: [
        {
          id: eventId,
          healthProfileId: eventId,
          sourceDocumentId: null,
          resultDate: key.date,
          testName: 'Glucose',
          value: '5.2',
          unit: 'mmol/L',
          referenceRange: '3.9–6.4',
          facility: null,
          manualWithoutSource: true,
          createdAt: '2026-10-30T00:00:00Z',
        },
      ],
    },
  },
  {
    ...key,
    kind: 'measurement',
    data: {
      id: eventId,
      healthProfileId: eventId,
      sourceDocumentId: null,
      kind: 'glucose',
      measuredOn: key.date,
      measuredTime: null,
      systolic: null,
      diastolic: null,
      pulse: null,
      glucoseValue: 5.25,
      glucoseUnit: 'mmol/L',
      manualWithoutSource: true,
      createdAt: '2026-10-30T00:00:00Z',
    },
  },
  { ...key, kind: 'course_stopped', data: { courseId: eventId, name: 'Thuốc A' } },
  { ...key, kind: 'adherence_period', data: { medicationName: 'Thuốc B', status: 'taking' } },
  { ...key, id: key.date, kind: 'revisit', data: { prescriptionIds: [eventId] } },
];
export const page: TimelinePage = { items: events, nextCursor: 'opaque-cursor' };
