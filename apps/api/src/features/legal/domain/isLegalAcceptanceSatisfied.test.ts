import { describe, expect, it } from 'vitest';
import { isLegalAcceptanceSatisfied } from './isLegalAcceptanceSatisfied.js';

const date = (version: number) => new Date(`2026-0${version}-01T00:00:00Z`);
const requirement = (
  kind: 'terms' | 'privacy',
  current = 1,
  material: number | null = 1,
  accepted: number | null = 1,
) => ({
  kind,
  currentPublishedAt: date(current),
  materialPublishedAt: material === null ? null : date(material),
  acceptedPublishedAt: accepted === null ? null : date(accepted),
});
describe('SPEC-061: ngưỡng đồng ý pháp lý', () => {
  it('TC-752: v1 đã đồng ý nhưng v2 trọng yếu yêu cầu đồng ý lại', () => {
    expect(isLegalAcceptanceSatisfied([requirement('terms', 2, 2), requirement('privacy')])).toBe(false);
  });
  it('TC-754: v3 không trọng yếu không chặn người đã đồng ý v2', () => {
    expect(isLegalAcceptanceSatisfied([requirement('terms', 3, 2, 2), requirement('privacy')])).toBe(true);
  });
  it('TC-754: v3 không trọng yếu không che yêu cầu v2 khi mới đồng ý v1', () => {
    expect(isLegalAcceptanceSatisfied([requirement('terms', 3, 2, 1), requirement('privacy')])).toBe(false);
  });
  it('TC-752: không có bản trọng yếu thì dùng bản hiện hành', () => {
    expect(isLegalAcceptanceSatisfied([requirement('terms', 2, null, 1), requirement('privacy')])).toBe(
      false,
    );
    expect(isLegalAcceptanceSatisfied([requirement('terms', 2, null, 2), requirement('privacy')])).toBe(true);
  });
  it('TC-755: thiếu kind hoặc chưa đồng ý thì đóng gate', () => {
    expect(isLegalAcceptanceSatisfied([])).toBe(false);
    expect(isLegalAcceptanceSatisfied([requirement('terms')])).toBe(false);
    expect(isLegalAcceptanceSatisfied([requirement('terms'), requirement('privacy', 1, 1, null)])).toBe(
      false,
    );
  });
});
