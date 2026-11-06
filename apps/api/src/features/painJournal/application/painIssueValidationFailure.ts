import type { ZodError } from 'zod';

export function painIssueValidationFailure(error: ZodError) {
  const fields = [
    ...new Set(error.issues.flatMap(({ path }) => (typeof path[0] === 'string' ? [path[0]] : []))),
  ];
  return { ok: false, code: 'ERR_VALIDATION', details: { fields } } as const;
}
