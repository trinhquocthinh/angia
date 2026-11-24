import { useEffect, useRef, useState } from 'react';
import { resolveExportScope } from '@src/features/account/application/exportProfileOptions';
import type { CreateDataExport, FetchDataExportStatus } from '@src/features/account/application/ports';

export type DataExportPhase = 'idle' | 'pending' | 'ready' | 'rate_limited' | 'failed';

const DEFAULT_POLL_INTERVAL_MS = 2000;

type Options = {
  csrfToken: string;
  createExport: CreateDataExport;
  fetchStatus: FetchDataExportStatus;
  pollIntervalMs?: number;
};

type ExportState = { phase: DataExportPhase; exportId: string | null };
const IDLE_STATE: ExportState = { phase: 'idle', exportId: null };

function buildDownloadUrl(state: ExportState): string | null {
  if (state.phase !== 'ready' || !state.exportId) return null;
  return `/api/me/data-exports/${encodeURIComponent(state.exportId)}/file`;
}

function createFailurePhase(code: string, status?: number): DataExportPhase {
  return code === 'ERR_RATE_LIMITED' || status === 429 ? 'rate_limited' : 'failed';
}

type PollRefs = {
  timer: { current: ReturnType<typeof setTimeout> | null };
  runId: { current: number };
  busy: { current: boolean };
};

function scheduleExportPoll(
  exportId: string,
  runId: number,
  pollIntervalMs: number,
  fetchStatus: FetchDataExportStatus,
  refs: PollRefs,
  setState: (state: ExportState) => void,
) {
  refs.timer.current = setTimeout(async () => {
    const result = await fetchStatus(exportId);
    if (refs.runId.current !== runId) return;
    if (!result.ok || result.data.status === 'failed') {
      refs.busy.current = false;
      setState({ phase: 'failed', exportId: null });
    } else if (result.data.status === 'ready') {
      refs.busy.current = false;
      setState({ phase: 'ready', exportId });
    } else scheduleExportPoll(exportId, runId, pollIntervalMs, fetchStatus, refs, setState);
  }, pollIntervalMs);
}

export function useDataExport({
  csrfToken,
  createExport,
  fetchStatus,
  pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
}: Options) {
  const [selectedScope, setSelectedScope] = useState('self');
  const [state, setState] = useState<ExportState>(IDLE_STATE);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runIdRef = useRef(0);
  const busyRef = useRef(false);
  const stopPolling = () => {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = null;
  };

  useEffect(() => {
    const activeRun = runIdRef;
    return () => {
      activeRun.current += 1;
      busyRef.current = false;
      stopPolling();
    };
  }, []);

  const selectScope = (value: string) => {
    if (busyRef.current) return;
    stopPolling();
    runIdRef.current += 1;
    setSelectedScope(value);
    setState(IDLE_STATE);
  };

  const startExport = async () => {
    if (busyRef.current) return;
    stopPolling();
    const runId = ++runIdRef.current;
    busyRef.current = true;
    setState({ phase: 'pending', exportId: null });
    const created = await createExport(resolveExportScope(selectedScope), csrfToken);
    if (runIdRef.current !== runId) return;
    if (!created.ok) {
      busyRef.current = false;
      setState({ phase: createFailurePhase(created.code, created.status), exportId: null });
      return;
    }
    setState({ phase: 'pending', exportId: created.data.exportId });
    const refs: PollRefs = { timer: timerRef, runId: runIdRef, busy: busyRef };
    scheduleExportPoll(created.data.exportId, runId, pollIntervalMs, fetchStatus, refs, setState);
  };
  return {
    phase: state.phase,
    exportId: state.exportId,
    selectedScope,
    actionLabel: selectedScope === 'self' ? 'Tải dữ liệu của tôi' : 'Tải dữ liệu hồ sơ',
    downloadUrl: buildDownloadUrl(state),
    selectScope,
    startExport,
  };
}
