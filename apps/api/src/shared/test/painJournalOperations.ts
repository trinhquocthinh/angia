// Ma trận HTTP độc lập với định nghĩa route production (SPEC-052–057).
export const painJournalOperations = [
  ['GET', '', undefined, 200],
  ['POST', '', { region: 'knee', side: 'right', firstEntry: { level: 4 } }, 201],
  ['GET', '/:issueId', undefined, 200],
  ['GET', '/:issueId/context', undefined, 200],
  ['PATCH', '/:issueId', { title: 'Gối trái' }, 200],
  ['POST', '/:issueId/resolve', { resolvedOn: '2026-11-06' }, 200],
  ['POST', '/:issueId/reopen', {}, 200],
  ['GET', '/:issueId/deletion-impact', undefined, 200],
  ['DELETE', '/:issueId', { confirm: true }, 204],
  ['POST', '/:issueId/entries', { level: 3 }, 201],
  ['PATCH', '/:issueId/entries/:entryId', { level: 2 }, 200],
  ['DELETE', '/:issueId/entries/:entryId', undefined, 204],
  ['POST', '/:issueId/exercises', { name: 'Duỗi gối', source: 'self', startDate: '2026-11-05' }, 201],
  ['PATCH', '/:issueId/exercises/:exerciseId', { name: 'Co gối' }, 200],
  ['DELETE', '/:issueId/exercises/:exerciseId', undefined, 204],
] as const;
