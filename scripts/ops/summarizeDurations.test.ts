import { describe, expect, it } from 'vitest';
import { summarizeDurations } from './summarizeDurations.js';

describe('summarizeDurations', () => {
  it('TC-095 trung vị số lẻ là phần tử giữa, p90 theo hạng gần nhất', () => {
    expect(summarizeDurations([5000, 1000, 3000, 9000, 7000])).toEqual({
      count: 5,
      medianMs: 5000,
      p90Ms: 9000,
      minMs: 1000,
      maxMs: 9000,
    });
  });

  it('TC-095 trung vị số chẵn là trung bình hai phần tử giữa', () => {
    expect(summarizeDurations([4000, 1000, 2000, 3000]).medianMs).toBe(2500);
  });

  it('TC-095 không có mẫu thì trả null thay vì 0', () => {
    expect(summarizeDurations([])).toEqual({
      count: 0,
      medianMs: null,
      p90Ms: null,
      minMs: null,
      maxMs: null,
    });
  });
});
