import type { ExtractionPayload } from './extractionPayloadSchema.js';

/** Trải payload thành các trường lá: `facility`, `items[0].name`... Dòng thuốc/xét nghiệm ghép theo thứ tự. */
export const flattenFields = (payload: ExtractionPayload): Map<string, unknown> => {
  const fields = new Map<string, unknown>();
  for (const [key, value] of Object.entries(payload)) {
    if (key !== 'items' || !Array.isArray(value)) {
      fields.set(key, value);
      continue;
    }
    value.forEach((item: Record<string, unknown>, index) => {
      for (const [itemKey, itemValue] of Object.entries(item))
        fields.set(`items[${index}].${itemKey}`, itemValue);
    });
  }
  return fields;
};
