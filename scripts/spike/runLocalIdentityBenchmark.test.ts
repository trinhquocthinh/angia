import { expect, it, vi } from 'vitest';
import { runLocalIdentityBenchmark } from './runLocalIdentityBenchmark.js';

const settings = () => ({
  runRound: vi.fn(async () => ({ verifyPasswordMs: 100 })),
  emit: vi.fn(async (_row: unknown) => {}),
  shouldStop: () => false,
});

it('TC-906 (benchmark adapter) giữ đủ 50 mẫu kể cả mẫu đầu, trung vị hai mẫu giữa', async () => {
  const options = settings();
  let sample = 0;
  options.runRound.mockImplementation(async () => ({ verifyPasswordMs: ++sample * 10 }));
  expect(await runLocalIdentityBenchmark(options)).toMatchObject({
    planned: 50,
    completed: 50,
    successRate: 1,
    medianVerifyPasswordMs: 255,
    adapterGatePassed: true,
    lifecycleAccepted: false,
  });
  expect(options.runRound).toHaveBeenCalledTimes(50);
  expect(options.emit.mock.calls[0]![0]).toMatchObject({ round: 1, verifyPasswordMs: 10 });
});

it('TC-906 (benchmark adapter) trên 1000 ms không đạt gate', async () => {
  const options = settings();
  options.runRound.mockResolvedValue({ verifyPasswordMs: 1001 });
  expect(await runLocalIdentityBenchmark(options)).toMatchObject({ adapterGatePassed: false });
});

it('TC-906 (benchmark adapter) dừng khi lỗi, không retry hoặc chia tỷ lệ cho số vòng đã thử', async () => {
  const options = settings();
  options.runRound.mockRejectedValue(new Error('secret_database_detail'));
  const result = await runLocalIdentityBenchmark(options);
  expect(result).toMatchObject({ completed: 0, successRate: 0, adapterGatePassed: false });
  expect(options.runRound).toHaveBeenCalledTimes(1);
  expect(JSON.stringify(options.emit.mock.calls)).not.toContain('secret_database_detail');
});

it('TC-906 (benchmark adapter) mất báo cáo hoặc bị ngắt không bắt đầu vòng tiếp theo', async () => {
  const options = settings();
  options.emit.mockRejectedValue(new Error('disk_full'));
  await expect(runLocalIdentityBenchmark(options)).rejects.toThrow('disk_full');
  expect(options.runRound).toHaveBeenCalledTimes(1);
  const stopped = settings();
  expect(await runLocalIdentityBenchmark({ ...stopped, shouldStop: () => true })).toMatchObject({
    completed: 0,
    adapterGatePassed: false,
  });
  expect(stopped.runRound).not.toHaveBeenCalled();
});

it('TC-906 (benchmark adapter) từ chối số đo không hữu hạn hoặc âm', async () => {
  for (const verifyPasswordMs of [NaN, Infinity, -1]) {
    const options = settings();
    options.runRound.mockResolvedValue({ verifyPasswordMs });
    expect(await runLocalIdentityBenchmark(options)).toMatchObject({
      adapterGatePassed: false,
      completed: 0,
    });
  }
});
