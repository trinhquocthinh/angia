import type { Route } from '@playwright/test';
import type { TodayState } from './todayState.js';

export async function todayMutation(route: Route, state: TodayState) {
  const request = route.request();
  const path = new URL(request.url()).pathname;
  state.writes.push({ method: request.method(), csrf: request.headers()['x-csrf-token'] });
  if (state.writeError)
    return route.fulfill({
      status: 503,
      json: { error: { code: 'ERR_INTERNAL', message: 'Không thể cập nhật.' } },
    });
  state.rows = state.rows.map((row) =>
    path.includes(row.id)
      ? {
          ...row,
          canConfirm: request.method() === 'DELETE',
          canUndo: request.method() === 'POST',
          confirmation:
            request.method() === 'POST'
              ? {
                  reminderId: row.id,
                  profileId: state.profiles[0]!.id,
                  date: row.date,
                  slot: row.slot,
                  confirmedBy: { accountId: state.session.account.id, displayName: 'Mẹ' },
                  confirmedAt: '2026-11-11T00:32:00Z',
                }
              : null,
        }
      : row,
  );
  return route.fulfill({ status: 204 });
}
