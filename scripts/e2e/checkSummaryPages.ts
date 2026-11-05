export type SummaryPdfPage = {
  width: number;
  height: number;
  text: string;
  insidePage: boolean;
};

export function checkSummaryPages(
  pages: readonly SummaryPdfPage[],
  createdDay: string,
  overflow: boolean,
): void {
  assert(overflow ? pages.length >= 2 : pages.length === 1, 'Sai số trang bản in');
  for (const [index, page] of pages.entries()) {
    const label = `Trang ${index + 1}`;
    assert(Math.abs(page.width - 595.28) < 2 && Math.abs(page.height - 841.89) < 2, `${label}: sai A4`);
    assert(page.insidePage, `${label}: chữ tràn khỏi trang`);
    const text = page.text.normalize('NFC').replace(/\s+/g, ' ');
    assert(
      text.includes('Tài liệu tổng hợp từ gia đình, không phải chỉ định y khoa.'),
      `${label}: thiếu miễn trừ`,
    );
    assert(text.includes(`Tạo ngày ${createdDay}`), `${label}: thiếu hoặc sai ngày tạo`);
  }
}
import assert from 'node:assert/strict';
