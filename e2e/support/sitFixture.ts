import { randomUUID } from 'node:crypto';
import { test as base, expect } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';
import { healthProfileSchema, meContextResponseSchema } from '@angia/contracts';
import type { ExtractionPayload, HealthProfile } from '@angia/contracts';
import { readSitConfig } from '../../scripts/e2e/readSitConfig.js';

export class SitClient {
  constructor(
    private readonly request: APIRequestContext,
    private readonly csrfToken: string,
    private readonly origin: string,
  ) {}

  async get<T>(path: string): Promise<T> {
    const response = await this.request.get(path, { maxRedirects: 0 });
    expect(response.status(), `GET ${path}`).toBe(200);
    return (await response.json()) as T;
  }

  async post<T>(path: string, data: unknown, status = 200): Promise<T> {
    const response = await this.request.post(path, {
      data,
      headers: { 'X-CSRF-Token': this.csrfToken, Origin: this.origin },
      maxRedirects: 0,
    });
    expect(response.status(), `POST ${path}`).toBe(status);
    return (await response.json()) as T;
  }

  async record(profileId: string, data: ExtractionPayload): Promise<void> {
    await this.post(`/api/health-profiles/${profileId}/manual-records`, { type: data.type, data });
  }

  async remove(profile: HealthProfile): Promise<void> {
    const response = await this.request.delete(`/api/health-profiles/${profile.id}`, {
      data: { confirmName: profile.displayName },
      headers: { 'X-CSRF-Token': this.csrfToken, Origin: this.origin },
      maxRedirects: 0,
    });
    expect(response.status(), 'Dọn đúng hồ sơ do test tạo').toBe(204);
  }
}

export const test = base.extend<{ sit: SitClient; profile: HealthProfile }>({
  sit: async ({ request }, use) => {
    const config = readSitConfig(process.env);
    const response = await request.get('/api/me', { maxRedirects: 0 });
    expect(response.status(), 'Phiên E2E hết hạn/chưa đăng nhập; cần tạo lại storage state').toBe(200);
    const session = meContextResponseSchema.parse(await response.json());
    expect(session.role, 'Cần tài khoản main dành riêng cho E2E').toBe('main');
    expect(session.family?.id, 'Sai gia đình thử; dừng trước mọi thao tác ghi').toBe(config.familyId);
    await use(new SitClient(request, session.csrfToken, config.baseURL));
  },
  profile: async ({ sit }, use) => {
    const profile = healthProfileSchema.parse(
      await sit.post(
        '/api/health-profiles',
        {
          displayName: `E2E-${randomUUID()}`,
          birthYear: 1960,
          // Chỉ dữ liệu giả trong gia đình thử, không cam kết thay cho người thật.
          consent: {
            kind: 'attestation',
            attestation: true,
            basis: 'self',
            respondentName: 'Dữ liệu thử E2E',
          },
        },
        201,
      ),
    );
    try {
      expect(profile.familyId).toBe(readSitConfig(process.env).familyId);
      expect(profile.consentStatus).toBe('confirmed');
      await use(profile);
    } finally {
      await sit.remove(profile);
    }
  },
});

export { expect };
