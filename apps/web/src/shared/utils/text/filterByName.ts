// Chuẩn hóa để gõ không dấu vẫn tìm được tên tiếng Việt ("thinh" khớp "Thịnh", "duc" khớp "Đức").
function normalize(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/gi, 'd').toLocaleLowerCase('vi').trim();
}

export function filterByName<T>(items: T[], query: string, getName: (item: T) => string, limit = 8): T[] {
  const needle = normalize(query);
  if (!needle) return [];
  return items.filter((item) => normalize(getName(item)).includes(needle)).slice(0, limit);
}
