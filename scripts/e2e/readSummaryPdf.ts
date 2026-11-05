import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import type { SummaryPdfPage } from './checkSummaryPages.js';

// Đọc PDF thật do Chromium tạo; tọa độ tính bằng point (A4 ≈ 595×842).
export async function readSummaryPdf(buffer: Uint8Array): Promise<SummaryPdfPage[]> {
  const task = getDocument({ data: new Uint8Array(buffer), useSystemFonts: true });
  const document = await task.promise;
  try {
    const pages: SummaryPdfPage[] = [];
    for (let index = 1; index <= document.numPages; index++) {
      const page = await document.getPage(index);
      const viewport = page.getViewport({ scale: 1 });
      const content = await page.getTextContent();
      const items = content.items.filter((item) => 'str' in item);
      pages.push({
        width: viewport.width,
        height: viewport.height,
        // PDF tách glyph tiếng Việt thành nhiều item; item khoảng trắng đã có trong luồng.
        // Chèn thêm dấu cách sẽ biến "liệu" thành "li ệ u" và báo thiếu chân trang sai.
        text: items.map((item) => item.str).join(''),
        insidePage: items.every((item) => {
          const x = Number(item.transform[4]);
          const y = Number(item.transform[5]);
          return x >= -1 && x + item.width <= viewport.width + 1 && y >= -1 && y <= viewport.height + 1;
        }),
      });
    }
    return pages;
  } finally {
    await task.destroy();
  }
}
