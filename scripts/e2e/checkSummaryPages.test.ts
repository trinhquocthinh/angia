import { describe, expect, it } from 'vitest';
import { checkSummaryPages } from './checkSummaryPages.js';

const footer = 'Tài liệu tổng hợp từ gia đình, không phải chỉ định y khoa. Tạo ngày 30/10/2026';
const page = (text = footer) => ({ width: 595.28, height: 841.89, text, insidePage: true });

describe('Bằng chứng bản in từng trang, không chỉ CSS trên DOM', () => {
  it('TC-093: bản ngắn đúng một A4 và đủ chân trang', () => {
    expect(() => checkSummaryPages([page()], '30/10/2026', false)).not.toThrow();
  });
  it('TC-093: bản dài cho phép nhiều trang khi từng trang có chân trang', () => {
    expect(() => checkSummaryPages([page(), page()], '30/10/2026', true)).not.toThrow();
  });
  it.each([
    [[], false],
    [[page(), page()], false],
    [[page()], true],
    [[page(), page('thiếu chân trang')], true],
    [[page(footer.replace('30/10/2026', '29/10/2026'))], false],
    [[{ ...page(), width: 612 }], false],
    [[{ ...page(), insidePage: false }], false],
  ] as const)('TC-093: từ chối PDF sai phân trang, khổ hoặc chân trang %#', (pages, overflow) => {
    expect(() => checkSummaryPages(pages, '30/10/2026', overflow)).toThrow();
  });
});
