// Bộ lọc áp dụng cả JSON lồng nhau (ví dụ ảnh chụp thuốc); không thay tên cột DB.
export function exportJson(value: unknown): string {
  return JSON.stringify(value, (key, item: unknown) => {
    if (key === 'family_id' || key === 'image_key' || /sha256|hash|token|password|credential/i.test(key))
      return undefined;
    return item;
  });
}
