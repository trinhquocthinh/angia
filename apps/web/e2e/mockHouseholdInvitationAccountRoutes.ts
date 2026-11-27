import type { Page } from '@playwright/test';
import type { householdInviteLinkFixture } from './householdInviteLinkFixture.js';

export async function mockHouseholdInvitationAccountRoutes(
  page: Page,
  state: Awaited<ReturnType<typeof householdInviteLinkFixture>>,
) {
  const { household } = state;
  await page.route('**/api/auth/password-login', async (route) => {
    household.signedIn = true;
    return route.fulfill({
      json: {
        account: { id: 'account' },
        session: {
          csrfToken: 'csrf',
          expiresAt: '2027-01-01T00:00:00Z',
          passwordChangeRequired: false,
          passwordResetBy: null,
        },
      },
    });
  });
  await page.route('**/api/auth/register', async (route) => {
    state.registrations.push(route.request().postDataJSON() as Record<string, unknown>);
    household.signedIn = true;
    household.family = state.kind === 'join_family';
    household.role = state.role;
    return route.fulfill({
      status: 201,
      json: {
        account: {
          id: 'account',
          username: 'lan',
          displayName: 'Lan',
          familyId: household.family ? 'family' : null,
        },
        session: { csrfToken: 'csrf', expiresAt: '2027-01-01T00:00:00Z' },
      },
    });
  });
  await page.route('**/api/me/legal-acceptances', async (route) => {
    state.legalRequired = false;
    return route.fulfill({ status: 204 });
  });
}
