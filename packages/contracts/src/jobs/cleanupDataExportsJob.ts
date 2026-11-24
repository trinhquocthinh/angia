// SPEC-072: dọn tệp xuất hết hạn mỗi giờ, mỗi lúc chỉ một lượt.
export const CLEANUP_DATA_EXPORTS_QUEUE = 'cleanup-data-exports';
export const CLEANUP_DATA_EXPORTS_QUEUE_OPTIONS = {
  policy: 'singleton',
  retryLimit: 3,
  retryDelay: 60,
  retryBackoff: true,
  expireInSeconds: 3300,
} as const;
