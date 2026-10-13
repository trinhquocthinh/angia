import { describe, expect, it } from 'vitest';
import { entry } from './documentEntryFixtures.test-helper';
import { groupEntriesByMonth } from './groupEntriesByMonth';

describe('TC-282 gom mục theo tháng', () => {
  it('giữ thứ tự từ API (mới nhất trước), mỗi tháng một nhóm có nhãn Tháng MM/YYYY', () => {
    const items = [
      entry({ id: 'a', entryDate: '2026-10-13' }),
      entry({ id: 'b', entryDate: '2026-10-01' }),
      entry({ id: 'c', entryDate: '2026-06-12' }),
      entry({ id: 'd', entryDate: '2025-06-30' }),
    ];
    expect(groupEntriesByMonth(items).map((g) => [g.key, g.label, g.items.map((i) => i.id)])).toEqual([
      ['2026-10', 'Tháng 10/2026', ['a', 'b']],
      ['2026-06', 'Tháng 06/2026', ['c']],
      ['2025-06', 'Tháng 06/2025', ['d']],
    ]);
    expect(groupEntriesByMonth([])).toEqual([]);
  });
});
