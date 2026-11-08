import type { PainProfileContext } from './painProfileContext';
import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createExerciseNoteRequestSchema, type UpdateExerciseNoteRequest } from '@angia/contracts';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import type { ExerciseNoteWriter } from './ports';
import { canWritePainIssue } from './canWritePainIssue';
import { painIssueWriteKey } from './painIssueWriteKey';
import { refreshPainIssueViews } from './refreshPainIssueViews';
import { handleExerciseNoteFailure } from './handleExerciseNoteFailure';
export function useSaveExerciseNote(
  api: ExerciseNoteWriter,
  session: ProfileSession,
  profile: PainProfileContext,
  scope: 'main' | 'self',
  issueId: string,
) {
  const client = useQueryClient();
  const request = useRef<AbortController | null>(null);
  const active = useRef(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const enabled = canWritePainIssue(session, profile, scope);
  const identity = painIssueWriteKey(session, profile, scope);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      request.current?.abort();
    };
  }, [identity, issueId, session.csrfToken]);
  const save = async (body: UpdateExerciseNoteRequest, exerciseId?: string) => {
    if (!enabled || request.current || !active.current) return false;
    const controller = new AbortController();
    request.current = controller;
    setPending(true);
    setError(null);
    const target = scope === 'self' ? null : profile.id;
    try {
      if (exerciseId)
        await api.updateExercise(target, issueId, exerciseId, body, session.csrfToken, controller.signal);
      else
        await api.createExercise(
          target,
          issueId,
          createExerciseNoteRequestSchema.parse(body),
          session.csrfToken,
          controller.signal,
        );
      if (!active.current || controller.signal.aborted) return false;
      await refreshPainIssueViews(client, session, profile.id);
      return active.current && !controller.signal.aborted;
    } catch (cause) {
      if (!active.current || controller.signal.aborted) return false;
      const message = await handleExerciseNoteFailure(client, session, profile.id, cause);
      if (active.current && !controller.signal.aborted) setError(message);
      return false;
    } finally {
      if (request.current === controller) request.current = null;
      if (active.current && !controller.signal.aborted) setPending(false);
    }
  };
  return { save, pending, error, enabled };
}
