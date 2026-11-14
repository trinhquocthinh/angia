import { randomUUID } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from '@src/createApp.js';
import { createFakeFamilyAdminRepository } from '@src/shared/test/createFakeFamilyAdminRepository.js';
import { createStubAiBudgetDeps } from '@src/shared/test/createStubAiBudgetDeps.js';
import { createStubAuthDeps } from '@src/shared/test/createStubAuthDeps.js';
import { createStubDocumentDeps } from '@src/shared/test/createStubDocumentDeps.js';
import { createStubProfileDeps } from '@src/shared/test/createStubProfileDeps.js';
import { createStubProfileLinkDeps } from '@src/shared/test/createStubProfileLinkDeps.js';
import { createStubReviewDeps } from '@src/shared/test/createStubReviewDeps.js';

const legalAcceptance = { termsVersionId: randomUUID(), privacyVersionId: randomUUID() };
const input = {
  username: 'Me.Lan',
  password: 'StrongPassword123',
  displayName: 'Mẹ Lan',
  ageConfirmed: true,
  legalAcceptance,
};

function fixture() {
  const auth = createStubAuthDeps();
  const account = {
    appBaseUrl: 'https://angia.example/app',
    gate: { isOpen: vi.fn(async () => true) },
    legalVersions: { current: vi.fn(async () => legalAcceptance) },
    invitationVerifier: { verify: vi.fn(async () => null) },
    hasher: { hash: vi.fn(async () => 'hash'), verify: vi.fn(), needsRehash: vi.fn() },
    accounts: {
      isUsernameTaken: vi.fn(async () => false),
      register: vi.fn(async () => ({
        ok: true as const,
        account: {
          id: randomUUID(),
          username: 'me.lan',
          displayName: 'Mẹ Lan',
          familyId: null,
        },
      })),
    },
    sessions: { ...auth.login.sessions, create: vi.fn(async () => ({ id: randomUUID() })) },
    generateToken: () => 'csrf-token',
    now: () => new Date('2026-11-14T00:00:00Z'),
  };
  const app = createApp({
    ...createStubReviewDeps(),
    account,
    auth,
    profileLinks: createStubProfileLinkDeps(),
    documents: createStubDocumentDeps(),
    profiles: createStubProfileDeps(),
    familyAdmin: createFakeFamilyAdminRepository().repository,
    aiBudget: createStubAiBudgetDeps(),
    healthProbes: { db: async () => {}, storage: async () => {} },
  });
  const request = (
    body: unknown = input,
    origin = 'https://angia.example',
    contentType = 'application/json',
  ) =>
    app.request('/api/auth/register', {
      method: 'POST',
      headers: { origin, 'content-type': contentType },
      body: JSON.stringify(body),
    });
  return { account, request };
}

describe('Route đăng ký nối use case và bảo vệ request', () => {
  it('tạo phiên, đặt cookie và chỉ trả DTO công khai', async () => {
    const { account, request } = fixture();
    const response = await request();
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      account: { id: expect.any(String), username: 'me.lan', displayName: 'Mẹ Lan', familyId: null },
      session: { csrfToken: 'csrf-token', expiresAt: '2026-12-14T00:00:00.000Z' },
    });
    expect(response.headers.get('set-cookie')).toContain('HttpOnly; SameSite=Lax');
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(account.accounts.register).toHaveBeenCalledWith(
      expect.objectContaining({ usernameNormalized: 'me.lan' }),
    );
  });
  it.each([
    ['', 'application/json'],
    ['https://evil.example', 'application/json'],
    ['https://angia.example/', 'application/json'],
    ['https://angia.example', 'text/plain'],
  ])('chặn Origin/JSON sai trước body và use case: %s %s', async (origin, contentType) => {
    const { account, request } = fixture();
    const response = await request({}, origin, contentType);
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ error: { code: 'ERR_FORBIDDEN' } });
    expect(account.gate.isOpen).not.toHaveBeenCalled();
    expect(account.accounts.register).not.toHaveBeenCalled();
  });
  it('giữ details.field từ domain khi chưa xác nhận tuổi', async () => {
    const { account, request } = fixture();
    const response = await request({ ...input, ageConfirmed: false });
    expect(response.status).toBe(422);
    expect(await response.json()).toMatchObject({
      error: { code: 'ERR_VALIDATION', details: { field: 'ageConfirmed' } },
    });
    expect(account.hasher.hash).not.toHaveBeenCalled();
  });
  it('body thiếu trường trả 422 và không gọi use case', async () => {
    const { account, request } = fixture();
    const response = await request({});
    expect(response.status).toBe(422);
    expect(account.gate.isOpen).not.toHaveBeenCalled();
  });
  it('đóng đăng ký trả lỗi 403 và không đặt cookie', async () => {
    const { account, request } = fixture();
    account.gate.isOpen.mockResolvedValue(false);
    const response = await request();
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ error: { code: 'ERR_REGISTRATION_CLOSED' } });
    expect(response.headers.get('set-cookie')).toBeNull();
  });
  it('phiên bản cũ trả 409 kèm current', async () => {
    const { request } = fixture();
    const response = await request({
      ...input,
      legalAcceptance: { ...legalAcceptance, termsVersionId: randomUUID() },
    });
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      error: { code: 'ERR_LEGAL_VERSION_OUTDATED', details: { current: legalAcceptance } },
    });
  });
  it('trùng username trả 409 và không đặt cookie', async () => {
    const { account, request } = fixture();
    account.accounts.isUsernameTaken.mockResolvedValue(true);
    const response = await request();
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ error: { code: 'ERR_USERNAME_TAKEN' } });
    expect(response.headers.get('set-cookie')).toBeNull();
  });
});
