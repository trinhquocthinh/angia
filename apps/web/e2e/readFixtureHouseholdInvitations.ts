import type { Route } from '@playwright/test';
import type { householdInvitationFixture } from './householdInvitationFixture.js';
export async function readFixtureHouseholdInvitations(
  route: Route,
  state: Awaited<ReturnType<typeof householdInvitationFixture>>,
) {
  return route.fulfill({
    status: state.listError ? 500 : 200,
    json: state.listError
      ? { error: { code: 'ERR_INTERNAL' } }
      : route.request().url().includes('/current')
        ? {
            items: state.entries
              .filter((item) => item.own)
              .map((item) => ({
                invitationId: item.invitationId,
                role: item.role,
                status: item.status,
                expiresAt: item.expiresAt,
                code:
                  item.status === 'active' || item.status === 'expired' ? (item.secrets?.code ?? null) : null,
                link: item.status === 'active' ? (item.secrets?.link ?? null) : null,
              })),
          }
        : { items: state.entries, hasMore: false },
  });
}
