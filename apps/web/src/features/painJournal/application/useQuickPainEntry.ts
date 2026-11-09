import type { PainProfileContext } from './painProfileContext';
import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { CreatePainEntryRequest } from '@angia/contracts';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import type { PainEntryWriter } from './ports';
import { canWritePainIssue } from './canWritePainIssue';
import { painIssueWriteKey } from './painIssueWriteKey';
import { refreshPainIssueViews } from './refreshPainIssueViews';
import { usePainEntryFailure } from './usePainEntryFailure';

export function useQuickPainEntry(
  api: PainEntryWriter,
  session: ProfileSession,
  profile: PainProfileContext,
  scope: 'main' | 'self',
  issueId: string,
) {
  const client = useQueryClient();
  const request = useRef<AbortController | null>(null);
  const active = useRef(true);
  const [pending, setPending] = useState(false);
  const failure = usePainEntryFailure(session);
  const enabled = canWritePainIssue(session, profile, scope);
  const identity = painIssueWriteKey(session, profile, scope);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      request.current?.abort();
    };
  }, [identity, issueId, session.csrfToken]);

  const save = async (body: CreatePainEntryRequest, reopen = false) => {
    if (!enabled || request.current || !active.current) return null;
    const controller = new AbortController();
    request.current = controller;
    setPending(true);
    failure.clearError();
    const target = scope === 'self' ? null : profile.id;
    try {
      if (reopen) {
        await api.reopen(target, issueId, session.csrfToken, controller.signal);
        if (!active.current || controller.signal.aborted) return null;
        failure.reopened();
        await refreshPainIssueViews(client, session, profile.id);
      }
      if (!active.current || controller.signal.aborted) return null;
      const result = await api.record(target, issueId, body, session.csrfToken, controller.signal);
      if (!active.current || controller.signal.aborted) return null;
      await refreshPainIssueViews(client, session, profile.id);
      return active.current && !controller.signal.aborted ? result : null;
    } catch (cause) {
      if (active.current && !controller.signal.aborted) await failure.handleError(cause);
      return null;
    } finally {
      if (request.current === controller) request.current = null;
      if (active.current && !controller.signal.aborted) setPending(false);
    }
  };
  return {
    pending,
    enabled,
    error: failure.error,
    needsReopen: failure.needsReopen,
    existingIssueId: failure.existingIssueId,
    save,
  };
}
