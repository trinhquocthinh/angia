import { painContextQuerySchema, painJournalLimits, type PainContext } from '@angia/contracts';
import { medicationToday } from '@src/features/medications/application/medicationToday.js';
import type { IssueTarget, PainIssueClock, PainIssueOutcome, PainIssueRepository } from './ports.js';
import { loadPainIssue } from './loadPainIssue.js';
import { painIssueValidationFailure } from './painIssueValidationFailure.js';

export function getPainContext(
  repository: PainIssueRepository,
  target: IssueTarget,
  query: unknown,
  now: PainIssueClock,
): Promise<PainIssueOutcome<PainContext>> {
  const at = now();
  return repository.withFamily(target.familyId, async (store) => {
    const loaded = await loadPainIssue(store, target, false);
    if (!loaded.ok) return loaded;
    const parsed = painContextQuerySchema.safeParse(query);
    if (!parsed.success) return painIssueValidationFailure(parsed.error);
    let { from, to } = parsed.data;
    if ((from === undefined) !== (to === undefined)) {
      return { ok: false, code: 'ERR_VALIDATION', details: { fields: ['from', 'to'] } };
    }
    if (from === undefined || to === undefined) {
      const first = await store.firstRecordedAt(target.profileId, target.issueId);
      if (first === null) return { ok: false, code: 'ERR_NOT_FOUND' };
      to = medicationToday(() => at);
      const earliest = new Date(Date.parse(to) - (painJournalLimits.contextRangeDays - 1) * 86_400_000)
        .toISOString()
        .slice(0, 10);
      from = medicationToday(() => new Date(first));
      if (from < earliest) from = earliest;
    }
    const context = await store.readContext(target.profileId, from, to);
    return {
      ok: true,
      value: {
        from,
        to,
        asNeededDoses: context.asNeededDoses.map((dose) => ({
          courseId: dose.courseId,
          name: dose.name,
          givenAt: dose.givenAt,
          quantity: dose.quantity,
          unit: dose.unit,
        })),
        courses: context.courses.map((course) => ({
          courseId: course.courseId,
          name: course.name,
          startDate: course.startDate,
          endDate: course.endDate,
          status: course.status,
        })),
      },
    };
  });
}
