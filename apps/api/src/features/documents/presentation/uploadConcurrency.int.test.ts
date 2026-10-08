import { randomUUID } from 'node:crypto';
import { expectCrossFamilyDenied } from '@src/shared/test/expectCrossFamilyDenied.js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { HealthProfile } from '@angia/contracts';
import { acceptConsentInvitation } from '@src/shared/test/acceptConsentInvitation.js';
import type { SeededSession } from '@src/shared/test/seedAuthFixtures.js';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';

const BOUNDARY = 'angia-test';
const encoder = new TextEncoder();
const PART_HEAD = `--${BOUNDARY}\r\nContent-Disposition: form-data; name="files"; filename="a.jpg"\r\n\r\n`;
const PART_TAIL = `\r\n--${BOUNDARY}--\r\n`;

// Body multipart gửi phần đầu rồi treo tới khi `finish()` — mô phỏng người dùng mạng chậm đang giữ chỗ.
function slowMultipart() {
  let finish!: () => void;
  const gate = new Promise<void>((resolve) => (finish = resolve));
  let sent = false;
  const body = new ReadableStream<Uint8Array>({
    async pull(controller) {
      if (sent) return;
      sent = true;
      controller.enqueue(encoder.encode(PART_HEAD));
      await gate;
      controller.enqueue(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]));
      controller.enqueue(encoder.encode(PART_TAIL));
      controller.close();
    },
  });
  return { body, finish };
}

describe('Giới hạn 3 lô tải lên xử lý đồng thời (E3-S1-T1)', () => {
  let t: ProfileTestApp;
  let main: SeededSession;
  let profileId: string;
  beforeAll(async () => {
    t = await startProfileTestApp();
    main = await t.session(await t.family());
    const created = await t.call(main, 'POST', '/api/health-profiles', { displayName: 'Bà' });
    profileId = ((await created.json()) as HealthProfile).id;
    await acceptConsentInvitation(t, main, profileId);
  });
  afterAll(async () => {
    await t?.stop();
  });

  const send = (body: ReadableStream<Uint8Array>) =>
    t.app.request(`/api/health-profiles/${profileId}/upload-batches`, {
      method: 'POST',
      headers: {
        cookie: main.cookie,
        'x-csrf-token': main.csrf,
        'content-type': `multipart/form-data; boundary=${BOUNDARY}`,
      },
      body,
      duplex: 'half',
    } as RequestInit);
  const quick = () => {
    const upload = slowMultipart();
    upload.finish();
    return send(upload.body);
  };

  it('3 lô đang nhận thì lô thứ 4 bị 503 ERR_UPLOAD_BUSY kèm Retry-After; xong một lô thì nhận tiếp', async () => {
    const slow = [slowMultipart(), slowMultipart(), slowMultipart()];
    const pending = slow.map((upload) => send(upload.body));
    await new Promise((resolve) => setTimeout(resolve, 100));

    const busy = await quick();
    expect(busy.status).toBe(503);
    expect(busy.headers.get('retry-after')).toBe('10');
    expect(await busy.json()).toMatchObject({ error: { code: 'ERR_UPLOAD_BUSY' } });

    slow[0]!.finish();
    expect((await pending[0]!).status).toBe(201);
    expect((await quick()).status).toBe(201);

    slow.slice(1).forEach((upload) => upload.finish());
    expect((await Promise.all(pending.slice(1))).map((response) => response.status)).toEqual([201, 201]);
  });

  it('TC-110: main khác gia đình và hồ sơ không tồn tại bị từ chối trước body treo', async () => {
    const other = await t.session(await t.family());
    const slowRequest = (id: string) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2000);
      return Promise.resolve(
        t.app.request(`/api/health-profiles/${id}/upload-batches`, {
          method: 'POST',
          headers: {
            cookie: other.cookie,
            'x-csrf-token': other.csrf,
            'content-type': `multipart/form-data; boundary=${BOUNDARY}`,
          },
          body: new ReadableStream<Uint8Array>(),
          signal: controller.signal,
          duplex: 'half',
        } as RequestInit),
      ).finally(() => clearTimeout(timer));
    };
    await expectCrossFamilyDenied(
      () => slowRequest(profileId),
      () => slowRequest(randomUUID()),
    );
    expect((await quick()).status).toBe(201);
  });

  it('lô bị từ chối vì lỗi (quá số tệp, sai hồ sơ) vẫn trả chỗ', async () => {
    for (let i = 0; i < 4; i++) {
      const form = new FormData();
      for (let j = 0; j < 11; j++)
        form.append('files', new File([new Uint8Array([0xff, 0xd8, 0xff])], `${j}.jpg`));
      const response = await t.app.request(`/api/health-profiles/${profileId}/upload-batches`, {
        method: 'POST',
        headers: { cookie: main.cookie, 'x-csrf-token': main.csrf },
        body: form,
      });
      expect(response.status).toBe(413);
    }
    expect((await quick()).status).toBe(201);
  });
});
