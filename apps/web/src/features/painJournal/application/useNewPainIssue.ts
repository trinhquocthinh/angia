import type { PainProfileContext } from './painProfileContext';
import { painIssueWriteKey } from './painIssueWriteKey';
import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { CreatePainIssueRequest } from '@angia/contracts';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import { MedicationRequestError } from '@src/features/medications/application/MedicationRequestError';
import type { PainIssueWriter } from './ports';
import type { PainIssueHandoff } from './painIssueHandoff';
import { canWritePainIssue } from './canWritePainIssue';
import { submitNewPainIssue } from './submitNewPainIssue';
import { refreshPainIssueViews } from './refreshPainIssueViews';
import { refreshPainIssueAccess } from './refreshPainIssueAccess';
export function useNewPainIssue(
  api: PainIssueWriter,
  session: ProfileSession,
  profile: PainProfileContext,
  scope: 'main' | 'self',
) {
  const client = useQueryClient();
  const active = useRef(true);
  const request = useRef<AbortController | null>(null);
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
  }, [identity, session.csrfToken]);
  const save = async (body: CreatePainIssueRequest): Promise<PainIssueHandoff | null> => {
    if (!enabled || request.current || !active.current) return null;
    const controller = new AbortController();
    request.current = controller;
    setPending(true);
    setError(null);
    try {
      const result = await submitNewPainIssue(
        api,
        scope === 'self' ? null : profile.id,
        body,
        session.csrfToken,
        controller.signal,
      );
      if (!active.current || controller.signal.aborted) return null;
      await refreshPainIssueViews(client, session, profile.id);
      return active.current && !controller.signal.aborted ? result : null;
    } catch (cause) {
      if (!active.current || controller.signal.aborted) return null;
      setError(
        cause instanceof MedicationRequestError
          ? cause.message
          : 'Không thể lưu vấn đề đau. Vui lòng thử lại.',
      );
      if (cause instanceof MedicationRequestError && [401, 403, 404, 409].includes(cause.status))
        await refreshPainIssueAccess(client, session);
      return null;
    } finally {
      request.current = null;
      if (active.current) setPending(false);
    }
  };
  return { pending, error, enabled, save };
}
