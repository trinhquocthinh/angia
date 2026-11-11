import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { HealthProfile } from '@angia/contracts';
import { confirmConsentByAttestation } from '@src/shared/test/confirmConsentByAttestation.js';
import { createSilentLogger } from '@src/shared/test/createSilentLogger.js';
import { expectCrossFamilyDenied } from '@src/shared/test/expectCrossFamilyDenied.js';
import type { SeededSession } from '@src/shared/test/seedAuthFixtures.js';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';
import type { OcrMaskBox } from '../application/redactionSuggestionPorts.js';

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const MiB = 1024 * 1024;

// Ảnh giả của ocr-mask: mỗi test đặt hành vi; ghi lại mọi lần gọi để kiểm "không gọi ocr-mask".
let behavior: () => Promise<OcrMaskBox[]> = async () => [];
let calls = 0;
const analyzer = {
  analyze: () => {
    calls += 1;
    return behavior();
  },
};

describe('POST /api/health-profiles/:id/redaction-suggestions (SPEC-083, BR-085)', () => {
  let t: ProfileTestApp;
  let main: SeededSession;
  let profileId: string;
  const createProfile = async (user: SeededSession, consented: boolean) => {
    const created = await t.call(user, 'POST', '/api/health-profiles', {
      birthYear: 1950,
      displayName: 'Mẹ',
    });
    const profile = (await created.json()) as HealthProfile;
    if (consented) await confirmConsentByAttestation(t, user, profile.id);
    return profile.id;
  };
  // Body mã hoá sẵn: huỷ giữa chừng body FormData của undici sinh unhandled rejection trong test.
  const send = async (target: string, bytes: Uint8Array = JPEG, user = main) => {
    const form = new FormData();
    form.append('image', new File([bytes], 'a.jpg'));
    const encoded = new Response(form);
    return t.app.request(`/api/health-profiles/${target}/redaction-suggestions`, {
      method: 'POST',
      headers: {
        cookie: user.cookie,
        'x-csrf-token': user.csrf,
        'content-type': encoded.headers.get('content-type')!,
      },
      body: await encoded.arrayBuffer(),
    });
  };

  beforeAll(async () => {
    t = await startProfileTestApp(undefined, {
      redactionSuggestions: { analyzer, logger: createSilentLogger() },
    });
    main = await t.session(await t.family());
    profileId = await createProfile(main, true);
  });
  afterAll(async () => {
    await t?.stop();
  });

  it('TC-882: hồ sơ khác gia đình như không tồn tại; chưa đồng thuận → 409; không gọi ocr-mask', async () => {
    const stranger = await t.session(await t.family());
    const strangerProfile = await createProfile(stranger, true);
    const unconsented = await createProfile(main, false);
    calls = 0;
    await expectCrossFamilyDenied(
      () => send(strangerProfile),
      () => send(randomUUID()),
    );
    const blocked = await send(unconsented);
    expect(blocked.status).toBe(409);
    expect(await blocked.json()).toMatchObject({ error: { code: 'ERR_CONSENT_REQUIRED' } });
    expect(calls).toBe(0);
  });

  it('TC-883: trả khung đã nới theo đơn vị 1.000.000, chỉ có `masks`, no-store', async () => {
    behavior = async () => [
      [0.1, 0.1, 0.2, 0.12],
      [0.1, 0.5, 0.3, 0.52],
      [0.7, 0, 0.9, 0.1],
    ];
    const response = await send(profileId);
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual({
      masks: [
        { left: 696_000, top: 0, width: 208_000, height: 104_000 },
        { left: 96_000, top: 96_000, width: 108_000, height: 28_000 },
        { left: 96_000, top: 496_000, width: 208_000, height: 28_000 },
      ],
    });
  });

  it('TC-887: 2 yêu cầu đang chạy thì yêu cầu thứ ba 503 ERR_SUGGESTION_BUSY + Retry-After: 15; lỗi vẫn nhả slot', async () => {
    const pending: (() => void)[] = [];
    behavior = () => new Promise((_resolve, reject) => pending.push(() => reject(new Error('hỏng'))));
    calls = 0;
    const running = [send(profileId), send(profileId)];
    await expect.poll(() => calls).toBe(2);
    const busy = await send(profileId);
    expect(busy.status).toBe(503);
    expect(busy.headers.get('retry-after')).toBe('15');
    expect(await busy.json()).toMatchObject({ error: { code: 'ERR_SUGGESTION_BUSY' } });
    pending.forEach((fail) => fail());
    for (const response of await Promise.all(running)) {
      expect(response.status).toBe(503);
      expect(await response.json()).toMatchObject({ error: { code: 'ERR_SUGGESTION_UNAVAILABLE' } });
    }
    behavior = async () => [];
    expect((await send(profileId)).status).toBe(200);
  });

  it('TC-888: ocr-mask lỗi → 503 ERR_SUGGESTION_UNAVAILABLE, gọi đúng một lần (không retry)', async () => {
    behavior = () => Promise.reject(new Error('timeout'));
    calls = 0;
    const response = await send(profileId);
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ error: { code: 'ERR_SUGGESTION_UNAVAILABLE' } });
    expect(calls).toBe(1);
  });

  it('TC-889: PNG hoặc ảnh quá 10 MiB → ERR_VALIDATION, không gọi ocr-mask', async () => {
    calls = 0;
    const big = new Uint8Array(10 * MiB + 1);
    big.set(JPEG);
    for (const bytes of [PNG, big]) {
      const response = await send(profileId, bytes);
      expect(response.status).toBe(422);
      expect(await response.json()).toMatchObject({ error: { code: 'ERR_VALIDATION' } });
    }
    expect(calls).toBe(0);
  });
});
