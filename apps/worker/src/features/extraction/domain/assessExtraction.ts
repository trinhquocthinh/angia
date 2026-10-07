import type { DocumentType, ExtractedContent, ExtractionVerdict } from './ExtractionDocument.js';

// BR-016: không lưu dữ liệu phỏng đoán. Payload rỗng hoặc khác loại người dùng khai → nhập tay.
export function assessExtraction(
  declaredType: DocumentType | null,
  content: ExtractedContent,
): ExtractionVerdict {
  if (declaredType !== null && declaredType !== content.type)
    return { usable: false, reason: 'type_mismatch' };
  return hasContent(content) ? { usable: true } : { usable: false, reason: 'empty' };
}

function hasContent(content: ExtractedContent): boolean {
  if (content.type !== 'device_reading') return content.items.length > 0;
  return [content.systolic, content.diastolic, content.pulse, content.glucoseValue].some(
    (value) => value !== null,
  );
}
