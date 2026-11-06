import { describe, expect, it } from 'vitest';
import { getPainContext } from './getPainContext.js';
import { now, painIssueFixture, target } from './painIssueTestFixture.js';

describe('Bối cảnh thuốc — SPEC-053', () => {
  it('TC-672: mặc định từ ngày lần ghi sớm nhất tới hôm nay VN', async () => {
    const { repository, store } = painIssueFixture();
    store.firstRecordedAt.mockResolvedValue('2026-11-01T18:00:00Z');
    expect(await getPainContext(repository, target, {}, now)).toEqual({
      ok: true,
      value: { from: '2026-11-02', to: '2026-11-06', asNeededDoses: [], courses: [] },
    });
    expect(store.readContext).toHaveBeenCalledWith(target.profileId, '2026-11-02', '2026-11-06');
  });

  it('TC-672: mặc định cắt còn 366 ngày gần nhất', async () => {
    const { repository, store } = painIssueFixture();
    store.firstRecordedAt.mockResolvedValue('2025-01-01T00:00:00Z');
    expect(await getPainContext(repository, target, {}, now)).toMatchObject({
      ok: true,
      value: { from: '2025-11-06', to: '2026-11-06' },
    });
  });

  it.each([
    { from: '2026-11-01' },
    { to: '2026-11-06' },
    { from: '2026-11-07', to: '2026-11-06' },
    { from: '2025-11-05', to: '2026-11-06' },
    { from: '2026-02-30', to: '2026-03-01' },
    { extra: true },
  ])('TC-672: từ chối khoảng không hợp lệ %j', async (query) => {
    const { repository, store } = painIssueFixture();
    expect(await getPainContext(repository, target, query, now)).toMatchObject({
      ok: false,
      code: 'ERR_VALIDATION',
    });
    expect(store.readContext).not.toHaveBeenCalled();
  });

  it.each([
    { from: '2026-11-06', to: '2026-11-06' },
    { from: '2025-11-06', to: '2026-11-06' },
    { from: '2023-03-01', to: '2024-02-29' },
  ])('TC-672: nhận khoảng 1 hoặc 366 ngày %j', async (query) => {
    const { repository } = painIssueFixture();
    expect(await getPainContext(repository, target, query, now)).toMatchObject({ ok: true, value: query });
  });

  it('TC-671: chỉ trả các trường hợp đồng dù reader có trường thừa', async () => {
    const { repository, store } = painIssueFixture();
    const dose = {
      courseId: 'course-1',
      name: 'Thuốc A',
      givenAt: '2026-11-05T10:00:00Z',
      quantity: 1,
      unit: 'viên',
    };
    const course = {
      courseId: 'course-1',
      name: 'Thuốc A',
      startDate: '2026-11-01',
      endDate: null,
      status: 'active' as const,
    };
    store.readContext.mockResolvedValue({
      asNeededDoses: [{ ...dose, trend: 'Bỏ' }],
      courses: [{ ...course, color: 'Bỏ' }],
      severity: 'Bỏ',
    } as unknown as Awaited<ReturnType<typeof store.readContext>>);
    expect(await getPainContext(repository, target, { from: '2026-11-01', to: '2026-11-06' }, now)).toEqual({
      ok: true,
      value: { from: '2026-11-01', to: '2026-11-06', asNeededDoses: [dose], courses: [course] },
    });
  });

  it('TC-691: đọc context không thay đổi trạng thái hoặc sinh nhận định', async () => {
    const { repository, store } = painIssueFixture();
    await getPainContext(repository, target, {}, now);
    expect(store.changeStatus).not.toHaveBeenCalled();
    expect(store.updateIssue).not.toHaveBeenCalled();
    expect(store.insertEntry).not.toHaveBeenCalled();
  });
  it('TC-670: mặc định trả NOT_FOUND nếu vấn đề biến mất trước khi đọc lần ghi đầu', async () => {
    const { repository, store } = painIssueFixture();
    store.firstRecordedAt.mockResolvedValue(null);
    expect(await getPainContext(repository, target, {}, now)).toEqual({ ok: false, code: 'ERR_NOT_FOUND' });
    expect(store.readContext).not.toHaveBeenCalled();
  });

  it('TC-672: khoảng chỉ định được giữ nguyên, không đọc hoặc cắt theo lần ghi đầu', async () => {
    const { repository, store } = painIssueFixture();
    const query = { from: '2024-01-01', to: '2024-01-31' };
    expect(await getPainContext(repository, target, query, now)).toMatchObject({ ok: true, value: query });
    expect(store.firstRecordedAt).not.toHaveBeenCalled();
    expect(store.readContext).toHaveBeenCalledWith(target.profileId, query.from, query.to);
  });
});
