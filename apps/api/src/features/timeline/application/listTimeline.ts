import { showsVitals, type TimelineEvent, type TimelineQuery } from '@angia/contracts';
import { consentGate } from '@src/features/profiles/domain/consentGate.js';
import { diffPrescriptions } from '@src/features/prescriptions/domain/diffPrescriptions.js';
import type { TimelineOutcome, TimelineRepository, TimelinePrescriptionPair } from './ports.js';
import { compareTimelineEvents } from './compareTimelineEvents.js';
import { decodeTimelineCursor, encodeTimelineCursor } from './timelineCursor.js';

function summarize(event: TimelineEvent, pairs: TimelinePrescriptionPair[]): TimelineEvent {
  if (event.kind !== 'prescription') return event;
  const pair = pairs.find((p) => p.current.id === event.data.prescriptionId);
  if (!pair?.previous) return event;
  const diff = diffPrescriptions(pair.previous, pair.current);
  return {
    ...event,
    data: {
      ...event.data,
      diffSummary: {
        added: diff.added.length,
        removed: diff.removed.length,
        changed: diff.changed.length,
      },
    },
  };
}

export function listTimeline(
  repository: TimelineRepository,
  familyId: string,
  profileId: string,
  query: TimelineQuery,
  now: () => Date,
): Promise<TimelineOutcome> {
  const after = query.cursor === undefined ? null : decodeTimelineCursor(query.cursor);
  if (query.cursor !== undefined && !after) return Promise.resolve({ ok: false, code: 'ERR_VALIDATION' });
  return repository.withFamily(familyId, async (store) => {
    const profile = await store.profile(profileId);
    const blocked = consentGate(profile?.consentStatus ?? null);
    if (blocked) return { ok: false, code: blocked };
    const year = Number(
      new Intl.DateTimeFormat('en', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric' }).format(now()),
    );
    const sources = await store.sources(
      profileId,
      { take: query.limit + 1, after },
      showsVitals(profile!, year),
    );
    const merged = sources.flat().sort(compareTimelineEvents);
    const page = merged.slice(0, query.limit);
    const ids = page
      .filter((event) => event.kind === 'prescription')
      .map((event) => event.data.prescriptionId);
    const pairs = ids.length ? await store.prescriptionPairs(profileId, ids) : [];
    return {
      ok: true,
      value: {
        items: page.map((event) => summarize(event, pairs)),
        nextCursor: merged.length > query.limit ? encodeTimelineCursor(page[page.length - 1]!) : null,
      },
    };
  });
}
