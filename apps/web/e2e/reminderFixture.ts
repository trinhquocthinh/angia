import type { Page, Route } from '@playwright/test';
import type { DoseSlotList, ReminderRecipients } from '@angia/contracts';
import { householdStartFixture } from './householdStartFixture.js';
import { reminderUiSeed, REMINDER_ACCOUNT_ID } from './reminderUiSeed.js';

export async function reminderFixture(page: Page, empty = false) {
  const household = await householdStartFixture(page);
  household.family = true;
  const state = {
    ...reminderUiSeed(empty),
    household,
    error: 0,
    slotError: false,
    writes: [] as { path: string; method: string; body: unknown; csrf: string | undefined }[],
  };
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/health-profiles') return route.fulfill({ json: [state.profile] });
    if (path.endsWith('/dose-slots') || path.endsWith('/reminder-recipients'))
      return settingsRoute(route, state);
    if (path.endsWith('/dose-confirmation')) return confirmationRoute(route, state);
    if (path.startsWith('/api/me/reminders/') || path.startsWith('/api/me/revisit-reminders/')) {
      if (state.error)
        return route.fulfill({
          status: state.error,
          json: { error: { code: 'ERR_NOT_FOUND', message: 'Chi tiết nội bộ' } },
        });
      return route.fulfill({ json: path.includes('/revisit-reminders/') ? state.revisit : state.reminder });
    }
    return route.fallback();
  });
  return state;
}

type State = Awaited<ReturnType<typeof reminderFixture>>;

async function settingsRoute(route: Route, state: State) {
  const request = route.request();
  const slots = new URL(request.url()).pathname.endsWith('/dose-slots');
  if (slots && state.slotError)
    return route.fulfill({ status: 503, json: { error: { code: 'ERR_INTERNAL' } } });
  if (request.method() === 'PUT') {
    state.writes.push({
      path: new URL(request.url()).pathname,
      method: request.method(),
      body: request.postDataJSON(),
      csrf: request.headers()['x-csrf-token'],
    });
    if (slots) {
      const body = request.postDataJSON() as { slots: Record<string, string> };
      state.slots = Object.entries(body.slots).map(([slot, time]) => ({ slot, time })) as DoseSlotList;
    } else {
      const body = request.postDataJSON() as { recipientAccountIds: string[] };
      state.recipients = {
        ...state.recipients,
        recipients: state.recipients.candidates.filter((candidate) =>
          body.recipientAccountIds.includes(candidate.accountId),
        ),
      } as ReminderRecipients;
    }
  }
  return route.fulfill({ json: slots ? state.slots : state.recipients });
}

async function confirmationRoute(route: Route, state: State) {
  const request = route.request();
  state.writes.push({
    path: new URL(request.url()).pathname,
    method: request.method(),
    body: request.method() === 'POST' ? request.postDataJSON() : null,
    csrf: request.headers()['x-csrf-token'],
  });
  const confirmed = request.method() === 'POST';
  state.reminder = {
    ...state.reminder,
    canConfirm: !confirmed,
    canUndo: confirmed,
    confirmation: confirmed
      ? {
          reminderId: state.reminder.id,
          profileId: state.profile.id,
          date: state.reminder.date,
          slot: state.reminder.slot,
          confirmedAt: '2026-11-26T13:04:00Z',
          confirmedBy: { accountId: REMINDER_ACCOUNT_ID, displayName: 'Lan' },
        }
      : null,
  };
  return route.fulfill({ status: 204 });
}
