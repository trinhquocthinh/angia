import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { HealthProfile } from '@angia/contracts';
import { vietnamDayBounds } from '@src/features/familyQuota/domain/vietnamDayBounds.js';
import { acceptConsentInvitation } from '@src/shared/test/acceptConsentInvitation.js';
import { seedQuotaDocument } from '@src/shared/test/seedQuotaDocument.js';
import type { SeededSession } from '@src/shared/test/seedAuthFixtures.js';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';

const JPEG = new Uint8Array(20).fill(7);
JPEG.set([0xff, 0xd8, 0xff, 0xe0]);
const LIMITS = { storageBytes: 100, dailyUploads: 4, pendingJobs: 4 };
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('Quota tài nguyên gia đình khi tải lô (SPEC-030, BR-043)', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp(undefined, { quota: LIMITS });
  });
  afterAll(async () => t?.stop());

  const household = async () => {
    const familyId = await t.family();
    const main = await t.session(familyId);
    const created = await t.call(main, 'POST', '/api/health-profiles', { displayName: 'Bà' });
    const profileId = ((await created.json()) as HealthProfile).id;
    await acceptConsentInvitation(t, main, profileId);
    const seed = (doc: Parameters<typeof seedQuotaDocument>[2]) =>
      seedQuotaDocument(t, { familyId, profileId, accountId: main.accountId }, doc);
    return { familyId, main, profileId, seed };
  };
  const upload = (user: SeededSession, profileId: string, count = 1) => {
    const form = new FormData();
    for (let i = 0; i < count; i += 1) form.append('files', new File([JPEG], `a${i}.jpg`));
    return t.app.request(`/api/health-profiles/${profileId}/upload-batches`, {
      method: 'POST',
      headers: { cookie: user.cookie, 'x-csrf-token': user.csrf },
      body: form,
    });
  };
  const documentCount = async (familyId: string) =>
    (await t.owner.query('SELECT count(*)::int AS n FROM source_documents WHERE family_id = $1', [familyId]))
      .rows[0].n as number;

  it('TC-295: hai lô đồng thời sát trần dung lượng → đúng một lô 201, lô kia 413 và không để lại object', async () => {
    const home = await household();
    await home.seed({ status: 'rejected', sizeBytes: 70 });
    const objectsBefore = t.objects.size;
    const responses = await Promise.all([
      upload(home.main, home.profileId),
      upload(home.main, home.profileId),
    ]);
    expect(responses.map((r) => r.status).sort()).toEqual([201, 413]);
    const rejected = responses.find((r) => r.status === 413)!;
    expect(await rejected.json()).toMatchObject({
      error: { code: 'ERR_STORAGE_QUOTA', details: { usedBytes: 90, limitBytes: 100, requestedBytes: 20 } },
    });
    expect(rejected.headers.get('retry-after')).toBeNull();
    expect(t.objects.size).toBe(objectsBefore + 1);
    expect(await documentCount(home.familyId)).toBe(2);
  });

  it('TC-295: lô B phải chờ khóa quota khi lô A đang ghi dở, rồi bị từ chối theo mức dùng đã commit của A', async () => {
    const home = await household();
    await home.seed({ status: 'rejected', sizeBytes: 70 });
    const held = t.holdNextPut();
    const first = upload(home.main, home.profileId);
    await held.arrived;
    const second = upload(home.main, home.profileId);
    const waited = await Promise.race([second.then(() => 'settled'), sleep(500).then(() => 'waiting')]);
    expect(waited).toBe('waiting');
    held.release();
    expect((await first).status).toBe(201);
    expect((await second).status).toBe(413);
  });

  it('TC-295: hai lô đồng thời sát trần ảnh/ngày → 201 và 429 kèm Retry-After tới 0 giờ giờ VN', async () => {
    const home = await household();
    for (let i = 0; i < 3; i += 1) await home.seed({ status: 'rejected', sizeBytes: 1 });
    const responses = await Promise.all([
      upload(home.main, home.profileId),
      upload(home.main, home.profileId),
    ]);
    expect(responses.map((r) => r.status).sort()).toEqual([201, 429]);
    const limited = responses.find((r) => r.status === 429)!;
    const retryAfter = Number(limited.headers.get('retry-after'));
    const untilMidnight = (vietnamDayBounds(new Date()).end.getTime() - Date.now()) / 1000;
    expect(Math.abs(retryAfter - untilMidnight)).toBeLessThan(5);
    expect(await limited.json()).toMatchObject({ error: { code: 'ERR_DAILY_UPLOAD_QUOTA' } });
  });

  it('chứng từ tạo 23:59 hôm qua giờ VN không tính vào lượt hôm nay', async () => {
    const home = await household();
    const yesterday = new Date(vietnamDayBounds(new Date()).start.getTime() - 60_000);
    for (let i = 0; i < 4; i += 1)
      await home.seed({ status: 'rejected', sizeBytes: 1, createdAt: yesterday });
    expect((await upload(home.main, home.profileId)).status).toBe(201);
  });

  it('TC-296 + TC-298: gia đình đã chạm trần bị từ chối trước khi đọc body, không chiếm slot của gia đình khác', async () => {
    const full = await household();
    for (let i = 0; i < 4; i += 1) await full.seed({ status: 'uploaded', sizeBytes: 25 });
    const hanging = () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3000);
      return Promise.resolve(
        t.app.request(`/api/health-profiles/${full.profileId}/upload-batches`, {
          method: 'POST',
          headers: {
            cookie: full.main.cookie,
            'x-csrf-token': full.main.csrf,
            'content-type': 'multipart/form-data; boundary=x',
          },
          body: new ReadableStream<Uint8Array>(),
          signal: controller.signal,
          duplex: 'half',
        } as RequestInit),
      ).finally(() => clearTimeout(timer));
    };
    const blocked = await Promise.all([hanging(), hanging(), hanging()]);
    expect(blocked.map((r) => r.status)).toEqual([413, 413, 413]);
    const other = await household();
    const responses = await Promise.all([1, 2, 3].map(() => upload(other.main, other.profileId)));
    expect(responses.map((r) => r.status)).toEqual([201, 201, 201]);
  });

  it('TC-297: S3 lỗi giữa lô → không chứng từ nào commit, mức dùng không đổi', async () => {
    const home = await household();
    const before = await (await t.call(home.main, 'GET', '/api/family/usage')).json();
    t.failNthPut(2);
    const response = await upload(home.main, home.profileId, 2);
    expect(response.status).toBe(500);
    expect(await documentCount(home.familyId)).toBe(0);
    expect(await (await t.call(home.main, 'GET', '/api/family/usage')).json()).toEqual(before);
  });
});
