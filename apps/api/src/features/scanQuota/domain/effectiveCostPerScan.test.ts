import { describe, expect, it } from 'vitest';
import { effectiveCostPerScan } from './effectiveCostPerScan.js';
describe('Chi phí hiệu dụng mỗi lượt (CP5.5)', () => {
  it('TC-639: dưới 20 lượt đã dùng thì giữ mức khởi đầu từ env', () => {
    expect(effectiveCostPerScan('0.001594', '5', 19)).toBe('0.001594000000');
  });
  it('TC-639: từ 20 lượt lấy phí thực / lượt đã dùng nếu cao hơn, làm tròn lên', () => {
    expect(effectiveCostPerScan('0.001594', '0.1', 20)).toBe('0.005000000000');
    expect(effectiveCostPerScan('0.001594', '1', 3_000_000_000_000_000)).toBe('0.001594000000');
    expect(effectiveCostPerScan('0', '10', 30)).toBe('0.333333333334');
  });
  it('TC-639: phí thực thấp hơn khởi đầu thì giữ khởi đầu', () => {
    expect(effectiveCostPerScan('0.001594', '0.02', 100)).toBe('0.001594000000');
  });
});
