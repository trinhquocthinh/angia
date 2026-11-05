import { describe, expect, it } from 'vitest';
import { calculateScanCapacity } from './calculateScanCapacity.js';
describe('Khả năng cấp thêm lượt quét chính xác', () => {
  it('TC-579: làm tròn xuống sau dự phòng hữu tỉ và chỉ trừ committed một lần', () => {
    expect(
      calculateScanCapacity({
        capUsd: '1',
        actualSpendUsd: '0',
        estimatedCostPerScanUsd: '0.3',
        reserveBasisPoints: 1,
        committedRemainingScans: '1',
      }),
    ).toEqual({ availableAdditionalScans: '2', overAllocatedScans: '0' });
    expect(
      calculateScanCapacity({
        capUsd: '0.000000000001',
        actualSpendUsd: '0',
        estimatedCostPerScanUsd: '0.000000000001',
        reserveBasisPoints: 1,
        committedRemainingScans: '0',
      }).availableAdditionalScans,
    ).toBe('0');
  });
  it('TC-579: số tiền lớn không qua Number và báo phần cấp vượt khi giảm trần', () => {
    expect(
      calculateScanCapacity({
        capUsd: '9007199254740993.123456789012',
        actualSpendUsd: '9007199254740993',
        estimatedCostPerScanUsd: '0.000000000001',
        reserveBasisPoints: 0,
        committedRemainingScans: '123456789010',
      }),
    ).toEqual({ availableAdditionalScans: '2', overAllocatedScans: '0' });
    expect(
      calculateScanCapacity({
        capUsd: '1',
        actualSpendUsd: '2',
        estimatedCostPerScanUsd: '1',
        reserveBasisPoints: 0,
        committedRemainingScans: '3',
      }),
    ).toEqual({ availableAdditionalScans: '0', overAllocatedScans: '3' });
  });
});
