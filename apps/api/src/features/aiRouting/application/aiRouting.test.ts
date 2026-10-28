import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_AI_ROUTING_SETTINGS, type AiRoutingView } from '@angia/contracts';
import { getAiRoutingSettings } from './getAiRoutingSettings.js';
import { setAiRoutingSettings } from './setAiRoutingSettings.js';
import type { AiRoutingRepository } from './ports.js';

const actorId = '00000000-0000-4000-8000-000000000001';
const date = new Date('2026-10-26T08:00:00Z');
const initial: AiRoutingView = {
  version: 0,
  settings: DEFAULT_AI_ROUTING_SETTINGS,
  updatedAt: null,
  updatedBy: null,
};
const input = () => ({
  expectedVersion: 0,
  settings: {
    ...DEFAULT_AI_ROUTING_SETTINGS,
  },
});
const repository = (): AiRoutingRepository => ({
  read: vi.fn<AiRoutingRepository['read']>().mockResolvedValue(initial),
  compareAndSet: vi.fn<AiRoutingRepository['compareAndSet']>(),
});

describe('Cấu hình nhà cung cấp OCR: application', () => {
  it('TC-458: đọc cấu hình mà không tạo/cập nhật bản ghi', async () => {
    const repo = repository();
    expect(await getAiRoutingSettings(repo)).toEqual(initial);
    expect(repo.compareAndSet).not.toHaveBeenCalled();
  });

  it('TC-459: lưu với actor phía server, thời điểm phía server và expectedVersion của request', async () => {
    const repo = repository();
    const saved = {
      ...initial,
      version: 1,
      settings: input().settings,
      updatedBy: actorId,
      updatedAt: date.toISOString(),
    };
    vi.mocked(repo.compareAndSet).mockResolvedValue(saved);
    expect(await setAiRoutingSettings({ repository: repo, now: () => date }, input(), actorId)).toEqual({
      ok: true,
      view: saved,
    });
    expect(repo.compareAndSet).toHaveBeenCalledWith({ ...input(), updatedAt: date, updatedBy: actorId });
    expect(repo.read).not.toHaveBeenCalled();
  });

  it('TC-460: version xung đột trả lỗi xác định, không tự ghi lại bằng version mới', async () => {
    const repo = repository();
    vi.mocked(repo.compareAndSet).mockResolvedValue(null);
    expect(await setAiRoutingSettings({ repository: repo, now: () => date }, input(), actorId)).toEqual({
      ok: false,
      code: 'ERR_AI_ROUTING_CONFLICT',
    });
    expect(repo.compareAndSet).toHaveBeenCalledTimes(1);
  });

  it('TC-468: không biến lỗi đọc DB thành cấu hình mặc định', async () => {
    const repo = repository();
    vi.mocked(repo.read).mockRejectedValue(new Error('db unavailable'));
    await expect(getAiRoutingSettings(repo)).rejects.toThrow('db unavailable');
  });

  it('TC-463: lỗi transaction ghi/audit được đẩy lên, không trả thành công', async () => {
    const repo = repository();
    vi.mocked(repo.compareAndSet).mockRejectedValue(new Error('audit failed'));
    await expect(
      setAiRoutingSettings({ repository: repo, now: () => date }, input(), actorId),
    ).rejects.toThrow('audit failed');
  });
});
