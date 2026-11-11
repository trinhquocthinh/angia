/** bbox [x0, y0, x1, y1] chuẩn hoá 0..1 của một vùng ocr-mask gợi ý che (`mask: true`). */
export type OcrMaskBox = readonly [number, number, number, number];

/** ocr-mask `/v1/analyze`: ném lỗi khi mạng/HTTP/timeout/schema hỏng; không bao giờ trả chữ OCR. */
export interface OcrMaskAnalyzer {
  analyze(jpeg: Uint8Array, signal: AbortSignal): Promise<OcrMaskBox[]>;
}

/** Chỉ có khi cấu hình OCR_MASK_URL; vắng → ERR_SUGGESTION_UNAVAILABLE. */
export interface RedactionSuggestionDependencies {
  analyzer: OcrMaskAnalyzer;
  logger: { info(obj: object, msg: string): void };
}
