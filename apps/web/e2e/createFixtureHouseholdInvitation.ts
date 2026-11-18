import type { Route } from '@playwright/test';
import type { householdInvitationFixture } from './householdInvitationFixture.js';
export async function createFixtureHouseholdInvitation(
  route: Route,
  state: Awaited<ReturnType<typeof householdInvitationFixture>>,
) {
  const request = route.request();
  if (request.url().includes('/replace')) {
    state.replaces.push(request.url());
    state.entries.forEach((item) => (item.status = 'revoked'));
    state.issued = {
      ...state.issued,
      invitationId: '22222222-2222-4222-8222-222222222222',
      code: '123456ABCDEF',
      link: 'https://angia.example/invite#token=manager-secret',
    };
  }
  state.creates.push({ body: request.postDataJSON(), csrf: request.headers()['x-csrf-token'] });
  if (state.hold) await state.hold;
  if (state.error)
    return route.fulfill({
      status: 409,
      json: { error: { code: state.error, message: 'Chi tiết nội bộ không được hiện' } },
    });
  const role = (request.postDataJSON() as { role?: 'main' | 'member' }).role ?? 'member';
  if (role === 'main')
    state.issued = {
      ...state.issued,
      invitationId: '22222222-2222-4222-8222-222222222222',
      code: '123456ABCDEF',
      link: 'https://angia.example/invite#token=manager-secret',
    };
  state.entries = [
    ...state.entries.filter((item) => item.role !== role),
    {
      ...state.issued,
      role,
      own: true,
      status: 'active',
      createdAt: new Date().toISOString(),
      secrets: { code: state.issued.code, link: state.issued.link },
    },
  ];
  return route.fulfill({ status: 201, json: state.issued });
}
