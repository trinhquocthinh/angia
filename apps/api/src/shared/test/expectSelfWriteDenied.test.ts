import { describe, expect, it } from 'vitest';
import { expectSelfWriteDenied } from './expectSelfWriteDenied.js';

const route = 'PATCH /api/me/profile/pain-issues/:issueId/entries/:entryId';
const denied = (status = 404, code = 'ERR_NOT_FOUND', message = 'Không tìm thấy tài nguyên yêu cầu.') =>
  Response.json({ error: { code, message } }, { status });

describe('Helper kiểm quyền ghi tự quản', () => {
  it('TC-698/699: chấp nhận hai đích bị từ chối và dữ liệu giữ nguyên', async () => {
    await expectSelfWriteDenied(route, {
      sameFamilyOtherProfile: denied,
      otherFamily: denied,
      snapshot: async () => ({ pain_entries: [{ id: 'bố', level: 5 }] }),
    });
  });

  it.each(['sameFamilyOtherProfile', 'otherFamily'] as const)(
    'TC-698/699: phát hiện %s ghi được hoặc trả sai mã lỗi',
    async (target) => {
      for (const response of [() => denied(200), () => denied(403), () => denied(404, 'ERR_INTERNAL')]) {
        await expect(
          expectSelfWriteDenied(route, {
            sameFamilyOtherProfile: denied,
            otherFamily: denied,
            snapshot: async () => ({}),
            [target]: response,
          }),
        ).rejects.toThrow(route);
      }
    },
  );

  it.each(['sameFamilyOtherProfile', 'otherFamily'] as const)(
    'TC-698/699: phát hiện %s trả 404 nhưng đã sửa dữ liệu',
    async (target) => {
      let level = 5;
      await expect(
        expectSelfWriteDenied(route, {
          sameFamilyOtherProfile: denied,
          otherFamily: denied,
          snapshot: async () => ({ pain_entries: [{ id: 'bố', level }] }),
          [target]: () => {
            level = 9;
            return denied();
          },
        }),
      ).rejects.toThrow(route);
    },
  );

  it('TC-698/699: phát hiện phản hồi phân biệt được hai đích bị từ chối', async () => {
    await expect(
      expectSelfWriteDenied(route, {
        sameFamilyOtherProfile: denied,
        otherFamily: () => denied(404, 'ERR_NOT_FOUND', 'Hồ sơ gia đình khác'),
        snapshot: async () => ({}),
      }),
    ).rejects.toThrow(route);
  });
});
