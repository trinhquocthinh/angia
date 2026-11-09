// BR-063: quét văn bản do hệ thống tạo; không lọc lời tự ghi của người dùng.
export const forbiddenWords = [
  'đỡ',
  'nặng',
  'nhẹ',
  'cải thiện',
  'xấu đi',
  'tốt',
  'nguy hiểm',
  'tiến triển',
] as const;
