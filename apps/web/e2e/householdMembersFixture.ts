import type { Page, Route } from '@playwright/test';
import { householdStartFixture } from './householdStartFixture.js';

export type FixtureMember = {
  accountId: string;
  displayName: string;
  role: 'main' | 'member';
  isOwner: boolean;
  isSelf: boolean;
};

const defaultFixtureMembers = (): FixtureMember[] => [
  { accountId: 'owner-1', displayName: 'Ba Minh', role: 'main', isOwner: true, isSelf: false },
  { accountId: 'account', displayName: 'Lan', role: 'main', isOwner: false, isSelf: true },
  { accountId: 'member-hoa', displayName: 'Mẹ Hoa', role: 'member', isOwner: false, isSelf: false },
  { accountId: 'main-tuan', displayName: 'Anh Tuấn', role: 'main', isOwner: false, isSelf: false },
];

export async function householdMembersFixture(
  page: Page,
  householdState?: Awaited<ReturnType<typeof householdStartFixture>>,
) {
  const household = householdState ?? (await householdStartFixture(page));
  household.family = true;
  household.name = 'Nhà Ngọc Lan';

  const state = {
    household,
    members: defaultFixtureMembers(),
    listCount: 0,
    listError: false,
    patchError: '' as string,
    patchStatus: 409,
    patches: [] as { path: string; body: unknown; csrf: string | undefined }[],
    resetError: '' as string,
    resetStatus: 429,
    resetResponse: {
      temporaryPassword: 'TempPass89!x',
      expiresAt: '2026-11-24T04:30:00.000Z',
    },
    resetHold: null as Promise<void> | null,
    passwordResets: [] as { path: string; csrf: string | undefined }[],
  };

  await page.route(/\/api\/family\/members(?:\/[^/?]+(?:\/password-reset)?)?(?:\?[^#]*)?$/, (route) =>
    handleMembersRoute(route, state),
  );
  return state;
}

type State = Awaited<ReturnType<typeof householdMembersFixture>>;

async function handleMembersRoute(route: Route, state: State) {
  const request = route.request();
  const path = new URL(request.url()).pathname;

  if (request.method() === 'GET' && path === '/api/family/members') {
    state.listCount += 1;
    if (state.listError) return route.fulfill({ status: 503, json: { error: { code: 'UNKNOWN' } } });
    return route.fulfill({ status: 200, json: { members: state.members } });
  }

  if (request.method() === 'POST' && path.endsWith('/password-reset')) {
    state.passwordResets.push({ path, csrf: request.headers()['x-csrf-token'] });
    if (state.resetHold) await state.resetHold;
    if (state.resetError === 'NETWORK') return route.abort();
    if (state.resetError) {
      return route.fulfill({
        status: state.resetStatus,
        json: { error: { code: state.resetError, message: 'Chi tiết nội bộ không được hiện' } },
      });
    }
    return route.fulfill({ status: 200, json: state.resetResponse });
  }

  if (request.method() === 'PATCH') {
    const body = request.postDataJSON() as
      { action: 'change_role'; role: 'main' | 'member' } | { action: 'remove' };
    state.patches.push({ path, body, csrf: request.headers()['x-csrf-token'] });

    if (state.patchError === 'NETWORK') return route.abort();
    if (state.patchError) {
      return route.fulfill({
        status: state.patchStatus,
        json: { error: { code: state.patchError, message: 'Chi tiết nội bộ không được hiện' } },
      });
    }

    const targetId = path.split('/').pop() ?? '';
    const target = state.members.find((item) => item.accountId === targetId);
    if (!target) {
      return route.fulfill({ status: 404, json: { error: { code: 'ERR_NOT_FOUND', message: 'Not found' } } });
    }
    if (body.action === 'remove') {
      state.members = state.members.filter((item) => item.accountId !== targetId);
    } else {
      target.role = body.role;
    }
    return route.fulfill({ status: 204 });
  }

  return route.fallback();
}
