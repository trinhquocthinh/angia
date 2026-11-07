import type { Route } from '@playwright/test';
import type { SelfPainData } from './selfPainData.js';
export function selfPainMutation(route: Route, state: SelfPainData) {
  const path = new URL(route.request().url()).pathname;
  const body = route.request().postDataJSON();
  const detail = state.detail;
  if (path.endsWith('/pain-issues')) {
    state.empty = false;
    const entry = { ...detail.entries[0]!, ...body.firstEntry };
    state.detail = {
      ...detail,
      region: body.region,
      side: body.side,
      entries: [entry],
      lastEntry: { level: entry.level, recordedAt: entry.recordedAt },
    };
    return route.fulfill({ status: 201, json: state.detail });
  }
  if (path.endsWith('/entries')) {
    const entry = {
      ...detail.entries[0]!,
      ...body,
      id: '00000000-0000-4000-8000-000000000005',
      createdBy: state.actor,
    };
    state.detail = {
      ...detail,
      entries: [entry, ...detail.entries],
      entryCount: detail.entryCount + 1,
      lastEntry: { level: entry.level, recordedAt: entry.recordedAt },
    };
    return route.fulfill({ status: 201, json: entry });
  }
  const resolved = path.endsWith('/resolve');
  const on = resolved ? body.resolvedOn : '2026-11-07';
  state.detail = {
    ...detail,
    status: resolved ? 'resolved' : 'tracking',
    resolvedOn: resolved ? on : null,
    statusEvents: [
      ...detail.statusEvents,
      { kind: resolved ? 'resolved' : 'reopened', on, by: state.actor, at: detail.updatedAt },
    ],
  };
  const { entries: _entries, exercises: _exercises, statusEvents: _events, ...summary } = state.detail;
  void _entries;
  void _exercises;
  void _events;
  return route.fulfill({ json: summary });
}
