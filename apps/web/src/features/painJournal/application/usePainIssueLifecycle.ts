import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { HealthProfile, ProfileSession } from '@src/features/profiles/application/ports';
import type { PainEntryWriter, PainIssueLifecycleApi } from './ports';
import { canWritePainIssue } from './canWritePainIssue';
import { painIssueWriteKey } from './painIssueWriteKey';
import { refreshPainIssueViews } from './refreshPainIssueViews';
import { handlePainIssueLifecycleFailure } from './handlePainIssueLifecycleFailure';
import { removePainIssueCache } from './removePainIssueCache';
export type PainIssueLifecycleAction =
  { kind: 'resolve'; resolvedOn: string } | { kind: 'reopen' | 'delete' };
export function usePainIssueLifecycle(
  api: PainIssueLifecycleApi & Pick<PainEntryWriter, 'reopen'>,
  session: ProfileSession,
  profile: HealthProfile,
  scope: 'main' | 'self',
  issueId: string,
) {
  const client = useQueryClient();
  const request = useRef<AbortController | null>(null);
  const active = useRef(true);
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState({
    error: null as string | null,
    existingIssueId: null as string | null,
  });
  const enabled = canWritePainIssue(session, profile, scope);
  const identity = painIssueWriteKey(session, profile, scope);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      request.current?.abort();
    };
  }, [identity, issueId, session.csrfToken]);
  const run = async (action: PainIssueLifecycleAction) => {
    if (!enabled || request.current || !active.current) return false;
    const controller = new AbortController();
    request.current = controller;
    setPending(true);
    setFailure({ error: null, existingIssueId: null });
    const target = scope === 'self' ? null : profile.id;
    try {
      if (action.kind === 'resolve')
        await api.resolve(
          target,
          issueId,
          { resolvedOn: action.resolvedOn },
          session.csrfToken,
          controller.signal,
        );
      else if (action.kind === 'reopen')
        await api.reopen(target, issueId, session.csrfToken, controller.signal);
      else await api.deleteIssue(target, issueId, session.csrfToken, controller.signal);
      if (!active.current || controller.signal.aborted) return false;
      if (action.kind === 'delete') await removePainIssueCache(client, session, profile.id, issueId);
      if (!active.current || controller.signal.aborted) return false;
      await refreshPainIssueViews(client, session, profile.id);
      return active.current && !controller.signal.aborted;
    } catch (cause) {
      if (!active.current || controller.signal.aborted) return false;
      const next = await handlePainIssueLifecycleFailure(client, session, profile.id, cause);
      if (active.current && !controller.signal.aborted) setFailure(next);
      return false;
    } finally {
      if (request.current === controller) request.current = null;
      if (active.current && !controller.signal.aborted) setPending(false);
    }
  };
  return { run, pending, enabled, ...failure };
}
