import { expect, it, vi } from 'vitest';
import { runIdentityMeasurements } from './runIdentityMeasurements.js';
import type { IdentityRoundResult } from './runIdentityRound.js';

const row = (round: number): IdentityRoundResult => ({
  round,
  username: 'spike-test',
  success: true,
  deleted: true,
  failedStep: null,
  error: null,
  cleanupError: null,
  timings: { login: round * 10, loginAfterChange: 5000, loginAfterUnlock: 6000 },
});
const options = () => ({
  remainingMs: 60_000,
  runRound: vi.fn(async (round: number) => row(round)),
  emit: vi.fn(async (_record: unknown) => {}),
});

it('TC-873 chạy đúng 50 vòng tuần tự, lấy trung vị hai mẫu giữa và không gộp lần đăng nhập khác', async () => {
  const settings = options();
  const result = await runIdentityMeasurements(settings);
  expect(result).toMatchObject({
    verdict: 'pass',
    completed: 50,
    attempted: 50,
    successRate: 1,
    medianLoginMs: 255,
    medianLoginAfterChangeMs: 5000,
    medianLoginAfterUnlockMs: 6000,
  });
  expect(settings.runRound.mock.calls.map(([round]) => round)).toEqual(
    Array.from({ length: 50 }, (_, i) => i + 1),
  );
});

it('TC-873 dừng ngay vòng lỗi, không retry hoặc tính thành công trên số vòng thiếu', async () => {
  const settings = options();
  settings.runRound.mockImplementation(async (round) => ({
    ...row(round),
    success: false,
    error: 'idp_timeout',
  }));
  expect(await runIdentityMeasurements(settings)).toMatchObject({
    verdict: 'failed',
    attempted: 1,
    completed: 0,
    successRate: 0,
  });
  expect(settings.runRound).toHaveBeenCalledTimes(1);
});

it('TC-873 đủ 50 vòng nhưng trung vị trên 1 giây vẫn không đạt', async () => {
  const settings = options();
  settings.runRound.mockImplementation(async (round) => ({ ...row(round), timings: { login: 1001 } }));
  expect(await runIdentityMeasurements(settings)).toMatchObject({ verdict: 'failed', medianLoginMs: 1001 });
});

it('TC-873 hết ngân sách trước vòng đầu thì không tạo user', async () => {
  const settings = options();
  expect(await runIdentityMeasurements({ ...settings, remainingMs: 0 })).toMatchObject({
    verdict: 'budget_exhausted',
    attempted: 0,
  });
  expect(settings.runRound).not.toHaveBeenCalled();
});

it('TC-873 lỗi ghi báo cáo ngăn vòng tiếp theo', async () => {
  const settings = options();
  settings.emit.mockRejectedValue(new Error('disk-full'));
  await expect(runIdentityMeasurements(settings)).rejects.toThrow('disk-full');
  expect(settings.runRound).not.toHaveBeenCalled();
});

it('TC-873 nhận yêu cầu dừng thì không bắt đầu vòng mới', async () => {
  const settings = options();
  let interrupted = false;
  settings.runRound.mockImplementation(async (round) => {
    interrupted = true;
    return row(round);
  });
  expect(await runIdentityMeasurements({ ...settings, shouldStop: () => interrupted })).toMatchObject({
    verdict: 'interrupted',
    attempted: 1,
    completed: 1,
  });
  expect(settings.runRound).toHaveBeenCalledTimes(1);
});
