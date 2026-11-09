import { describe, expect, it } from 'vitest';
import { recordTrialTap, SMALL_REGION_TARGETS, startTrial } from './smallRegionTrial';

describe('smallRegionTrial', () => {
  it('có 10 mục tiêu vùng nhỏ (PD A20)', () => {
    expect(SMALL_REGION_TARGETS).toHaveLength(10);
  });

  it('chạm đúng cả vùng lẫn bên thì tính trúng, rồi sang mục tiêu kế', () => {
    const first = SMALL_REGION_TARGETS[0]!;
    const state = recordTrialTap(startTrial(), first);
    expect(state).toEqual({ index: 1, hits: 1, misses: [] });
  });

  it('chạm đúng vùng nhưng sai bên là trượt, ghi lại vùng đã chạm', () => {
    const tapped = { region: 'wrist', side: 'left' } as const;
    const state = recordTrialTap(startTrial(), tapped);
    expect(state.hits).toBe(0);
    expect(state.misses).toEqual([{ target: SMALL_REGION_TARGETS[0], tapped }]);
  });

  it('đủ 10 lượt thì bỏ qua các lần chạm sau', () => {
    const done = SMALL_REGION_TARGETS.reduce(recordTrialTap, startTrial());
    expect(done).toEqual({ index: 10, hits: 10, misses: [] });
    expect(recordTrialTap(done, SMALL_REGION_TARGETS[0]!)).toBe(done);
  });
});
