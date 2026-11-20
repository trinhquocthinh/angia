import type { Page, Route } from '@playwright/test';
import { householdStartFixture } from './householdStartFixture.js';

export const MINOR_PROFILE_ID = '0199bc85-8918-7000-8000-000000000010';
export const ADULT_PROFILE_ID = '0199bc85-8918-7000-8000-000000000020';
export const ACC_LAN = '0199bc85-8918-7000-8000-000000000101';
export const ACC_MINH = '0199bc85-8918-7000-8000-000000000102';
const ACC_HOA = '0199bc85-8918-7000-8000-000000000103';

type Guardian = { accountId: string; displayName: string; isMe: boolean };
type Member = {
  accountId: string;
  displayName: string;
  role: 'main' | 'member';
  isOwner: boolean;
  isSelf: boolean;
};

const baseProfile = {
  familyId: '0199bc85-8918-7000-8000-000000000001',
  vitalsEnabled: null,
  consentConfirmedAt: '2026-01-01T00:00:00Z',
  consentConfirmedBy: ACC_LAN,
  consentBasis: 'guardian',
  consentStatus: 'confirmed',
  consentSource: 'main_attested',
  consentRespondentName: 'Mẹ Lan',
  createdAt: '2026-01-01T00:00:00Z',
  consentAction: null,
  hasLinkedAccount: false,
  consentConfirmedByName: 'Mẹ Lan',
};

export async function profileGuardiansFixture(page: Page) {
  const household = await householdStartFixture(page);
  household.family = true;
  household.name = 'Nhà Ngọc Lan';

  const state = {
    household,
    linked: false,
    birthYear: 2020 as number | null,
    consentStatus: 'confirmed' as 'confirmed' | 'pending',
    addError: null as number | null,
    guardians: [{ accountId: ACC_LAN, displayName: 'Mẹ Lan', isMe: true }] as Guardian[],
    members: [
      { accountId: ACC_MINH, displayName: 'Ba Minh', role: 'main', isOwner: true, isSelf: false },
      { accountId: ACC_LAN, displayName: 'Mẹ Lan', role: 'main', isOwner: false, isSelf: true },
      { accountId: ACC_HOA, displayName: 'Cô Hoa', role: 'member', isOwner: false, isSelf: false },
    ] as Member[],
    addPosts: [] as { body: unknown; csrf: string | undefined }[],
    removeDeletes: [] as { csrf: string | undefined }[],
  };

  await page.route(/\/api\/(health-profiles|family\/members)/, (route) => handleRoute(route, state));
  return state;
}

type State = Awaited<ReturnType<typeof profileGuardiansFixture>>;

async function handleRoute(route: Route, state: State) {
  const req = route.request();
  const path = new URL(req.url()).pathname;

  if (path === '/api/health-profiles' && req.method() === 'GET') {
    const pendingConsent =
      state.consentStatus === 'pending'
        ? {
            consentStatus: 'pending',
            consentConfirmedAt: null,
            consentConfirmedBy: null,
            consentBasis: null,
            consentSource: null,
            consentRespondentName: null,
            consentAction: 'attestation',
            consentConfirmedByName: null,
          }
        : {};
    return route.fulfill({
      status: 200,
      json: [
        {
          ...baseProfile,
          ...pendingConsent,
          id: MINOR_PROFILE_ID,
          displayName: 'Bé An',
          birthYear: state.birthYear,
          hasLinkedAccount: state.linked,
        },
        { ...baseProfile, id: ADULT_PROFILE_ID, displayName: 'Ông Nội', birthYear: 1955 },
      ],
    });
  }
  if (path === '/api/family/members' && req.method() === 'GET') {
    return route.fulfill({ status: 200, json: { members: state.members } });
  }
  if (path.endsWith('/medication-courses/current') && req.method() === 'GET') {
    return route.fulfill({ status: 200, json: { today: '2026-11-20', courses: [] } });
  }
  if (path.endsWith('/dose-slots') && req.method() === 'GET') {
    return route.fulfill({ status: 200, json: [{ slot: 'morning', time: '07:30' }] });
  }
  if (path.endsWith('/reminder-recipients') && req.method() === 'GET') {
    return route.fulfill({
      status: 200,
      json: {
        mode: 'assigned',
        recipients: [{ accountId: ACC_LAN, displayName: 'Mẹ Lan' }],
        candidates: [{ accountId: ACC_LAN, displayName: 'Mẹ Lan' }],
      },
    });
  }
  if (path === `/api/health-profiles/${MINOR_PROFILE_ID}/guardians`) {
    return handleGuardians(route, state);
  }
  if (path === `/api/health-profiles/${MINOR_PROFILE_ID}/guardians/me` && req.method() === 'DELETE') {
    return handleRemoveSelf(route, state);
  }
  return route.fallback();
}

async function handleGuardians(route: Route, state: State) {
  const req = route.request();
  if (req.method() === 'GET') {
    return route.fulfill({ status: 200, json: { guardians: state.guardians } });
  }
  if (req.method() === 'POST') {
    if (state.addError)
      return route.fulfill({ status: state.addError, json: { error: { code: 'ERR_VALIDATION' } } });
    const body = req.postDataJSON() as { guardianAccountId: string };
    state.addPosts.push({ body, csrf: req.headers()['x-csrf-token'] });
    const member = state.members.find((m) => m.accountId === body.guardianAccountId);
    if (!member || state.guardians.length >= 2) {
      return route.fulfill({ status: 422, json: { error: { code: 'ERR_VALIDATION' } } });
    }
    state.guardians.push({ accountId: member.accountId, displayName: member.displayName, isMe: false });
    return route.fulfill({ status: 204 });
  }
  return route.fallback();
}

async function handleRemoveSelf(route: Route, state: State) {
  state.removeDeletes.push({ csrf: route.request().headers()['x-csrf-token'] });
  if (state.guardians.length <= 1) {
    return route.fulfill({ status: 409, json: { error: { code: 'ERR_LAST_GUARDIAN' } } });
  }
  state.guardians = state.guardians.filter((item) => !item.isMe);
  return route.fulfill({ status: 204 });
}
