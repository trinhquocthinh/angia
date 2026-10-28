import { describe, expect, it } from 'vitest';
import { requiredCapIncreaseUsd } from './requiredCapIncreaseUsd';
const policy = { estimatedCostPerScanUsd: '0.001594000000', reserveBasisPoints: 1500, trialScans: 10 };
describe('Số USD cần nâng trần (CP5.5)', () => {
  it('TC-641: lượt thiếu × chi phí/lượt ÷ (1 − dự phòng), làm tròn lên 0,01 USD', () => {
    expect(requiredCapIncreaseUsd(policy, 100)).toBe('0.19');
    expect(requiredCapIncreaseUsd(policy, 5)).toBe('0.01');
    expect(requiredCapIncreaseUsd(policy, 0)).toBe('0.00');
  });
});
