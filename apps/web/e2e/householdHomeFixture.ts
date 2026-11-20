import type { Page, Route } from '@playwright/test';
import { householdMembersFixture } from './householdMembersFixture.js';

type FixtureOffer = {
  id: string;
  status: 'pending';
  createdAt: string;
  offeredBy: { accountId: string; displayName: string };
  target: { accountId: string; displayName: string };
};

type FixtureDeletion = {
  id: string;
  status: 'pending';
  executeAt: string;
};

export async function householdHomeFixture(page: Page) {
  const membersState = await householdMembersFixture(page);
  membersState.members = [
    { accountId: 'account', displayName: 'Ba Minh', role: 'main', isOwner: true, isSelf: true },
    { accountId: 'main-tuan', displayName: 'Anh Tuấn', role: 'main', isOwner: false, isSelf: false },
    { accountId: 'member-hoa', displayName: 'Mẹ Hoa', role: 'member', isOwner: false, isSelf: false },
  ];

  const state = {
    membersState,
    offer: null as FixtureOffer | null,
    deletion: null as FixtureDeletion | null,
    deletionGetCount: 0,
    transportError: '' as '' | 'NETWORK' | 'SERVER',
    mutationCsrf: [] as (string | undefined)[],
    offerError: '' as string,
    leaveError: '' as string,
    deletionError: '' as string,
    deletionErrorDetails: undefined as Record<string, unknown> | undefined,
    leaveBodies: [] as unknown[],
    offerPosts: [] as unknown[],
    deletionPosts: [] as unknown[],
  };

  await page.route(/\/api\/family\/ownership-offers(?:\/.*)?(?:\?[^#]*)?$/, (route) =>
    handleOwnershipRoute(route, state),
  );
  await page.route(/\/api\/family\/leave(?:\?[^#]*)?$/, (route) => handleLeaveRoute(route, state));
  await page.route(/\/api\/family\/deletion-request(?:\/.*)?(?:\?[^#]*)?$/, (route) =>
    handleDeletionRoute(route, state),
  );
  await page.route(
    /\/api\/family\/(?:ownership-offers|leave|deletion-request)(?:\/.*)?(?:\?[^#]*)?$/,
    async (route) => {
      if (route.request().method() === 'GET') return route.fallback();
      state.mutationCsrf.push(route.request().headers()['x-csrf-token']);
      if (state.transportError === 'NETWORK') return route.abort();
      if (state.transportError === 'SERVER')
        return route.fulfill({ status: 503, body: 'Service unavailable' });
      return route.fallback();
    },
  );
  return state;
}

type State = Awaited<ReturnType<typeof householdHomeFixture>>;

async function handleOwnershipRoute(route: Route, state: State) {
  const request = route.request();
  const path = new URL(request.url()).pathname;
  if (request.method() === 'GET' && path === '/api/family/ownership-offers/current') {
    if (!state.offer) return route.fulfill({ status: 404, json: { error: { code: 'ERR_NOT_FOUND' } } });
    return route.fulfill({ status: 200, json: state.offer });
  }
  if (request.method() !== 'GET' && state.offerError) {
    return route.fulfill({
      status: state.offerError === 'ERR_FORBIDDEN' ? 403 : 409,
      json: { error: { code: state.offerError, message: 'Nội bộ' } },
    });
  }
  if (request.method() === 'POST' && path === '/api/family/ownership-offers') {
    const body = request.postDataJSON() as { targetAccountId: string };
    state.offerPosts.push(body);

    const target = state.membersState.members.find((m) => m.accountId === body.targetAccountId);
    const createdAt = '2026-11-19T10:00:00.000Z';
    state.offer = {
      id: 'offer-1',
      status: 'pending',
      createdAt,
      offeredBy: { accountId: 'account', displayName: 'Ba Minh' },
      target: { accountId: body.targetAccountId, displayName: target?.displayName ?? 'Anh Tuấn' },
    };
    return route.fulfill({
      status: 201,
      json: { id: 'offer-1', targetAccountId: body.targetAccountId, status: 'pending', createdAt },
    });
  }
  if (request.method() === 'DELETE' && path.startsWith('/api/family/ownership-offers/')) {
    state.offer = null;
    return route.fulfill({ status: 204 });
  }
  if (request.method() === 'POST' && path.endsWith('/decision')) {
    const body = request.postDataJSON() as { accept: boolean };
    if (body.accept) {
      state.membersState.members = state.membersState.members.map((m) => ({
        ...m,
        isOwner: m.isSelf,
        role: m.isSelf ? 'main' : m.role,
      }));
    }
    state.offer = null;
    return route.fulfill({ status: 204 });
  }
  return route.fallback();
}

async function handleLeaveRoute(route: Route, state: State) {
  const request = route.request();
  if (request.method() !== 'POST') return route.fallback();
  state.leaveBodies.push(request.postDataJSON());
  if (state.leaveError) {
    return route.fulfill({
      status: 409,
      json: {
        error: {
          code: state.leaveError,
          message: 'Nội bộ',
          ...(state.leaveError === 'ERR_LAST_GUARDIAN' ? { details: { profileIds: ['p-1'] } } : {}),
        },
      },
    });
  }
  state.membersState.household.family = false;
  return route.fulfill({ status: 204 });
}

async function handleDeletionRoute(route: Route, state: State) {
  const request = route.request();
  const path = new URL(request.url()).pathname;
  if (request.method() === 'GET' && path === '/api/family/deletion-request/current') {
    state.deletionGetCount += 1;
    if (!state.deletion) return route.fulfill({ status: 404, json: { error: { code: 'ERR_NOT_FOUND' } } });
    return route.fulfill({ status: 200, json: state.deletion });
  }
  if (request.method() === 'POST' && path === '/api/family/deletion-request') {
    const body = request.postDataJSON() as { confirmFamilyName: string };
    state.deletionPosts.push(body);
    if (state.deletionError) {
      return route.fulfill({
        status: state.deletionError === 'ERR_VALIDATION' ? 422 : 409,
        json: {
          error: {
            code: state.deletionError,
            message: 'Nội bộ',
            ...(state.deletionErrorDetails ? { details: state.deletionErrorDetails } : {}),
          },
        },
      });
    }
    state.deletion = {
      id: 'del-1',
      status: 'pending',
      executeAt: new Date(Date.now() + 23 * 3600_000 + 10 * 60_000).toISOString(),
    };
    return route.fulfill({ status: 201, json: state.deletion });
  }
  if (request.method() === 'DELETE' && path === '/api/family/deletion-request') {
    if (state.deletionError)
      return route.fulfill({ status: 409, json: { error: { code: state.deletionError } } });
    state.deletion = null;
    return route.fulfill({ status: 204 });
  }
  return route.fallback();
}
