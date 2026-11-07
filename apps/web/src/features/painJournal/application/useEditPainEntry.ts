import type { PainProfileContext } from './painProfileContext';
import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { UpdatePainEntryRequest } from '@angia/contracts';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import type { PainEntryEditor } from './ports';
import { canWritePainIssue } from './canWritePainIssue';
import { painIssueWriteKey } from './painIssueWriteKey';
import { refreshPainIssueViews } from './refreshPainIssueViews';
import { handlePainEntryEditFailure } from './handlePainEntryEditFailure';

export function useEditPainEntry(
  api: PainEntryEditor,
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
  const [lastEntry, setLastEntry] = useState(false);
  const enabled = canWritePainIssue(session, profile, scope);
  const identity = painIssueWriteKey(session, profile, scope);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      request.current?.abort();
    };
  }, [identity, issueId, session.csrfToken]);
  const run = async (entryId: string, body?: UpdatePainEntryRequest) => {
    if (!enabled || request.current || !active.current) return false;
    const controller = new AbortController();
    request.current = controller;
    setPending(true);
    setError(null);
    const target = scope === 'self' ? null : profile.id;
    try {
      if (body) await api.updateEntry(target, issueId, entryId, body, session.csrfToken, controller.signal);
      else await api.deleteEntry(target, issueId, entryId, session.csrfToken, controller.signal);
      if (!active.current || controller.signal.aborted) return false;
      await refreshPainIssueViews(client, session, profile.id);
      return active.current && !controller.signal.aborted;
    } catch (cause) {
      if (!active.current || controller.signal.aborted) return false;
      const failure = await handlePainEntryEditFailure(client, session, profile.id, cause);
      if (!active.current || controller.signal.aborted) return false;
      if (failure.lastEntry) setLastEntry(true);
      setError(failure.error);
      return false;
    } finally {
      if (request.current === controller) request.current = null;
      if (active.current && !controller.signal.aborted) setPending(false);
    }
  };
  return {
    pending,
    enabled,
    error,
    lastEntry,
    save: (entryId: string, body: UpdatePainEntryRequest) => run(entryId, body),
    remove: (entryId: string) => run(entryId),
  };
}
