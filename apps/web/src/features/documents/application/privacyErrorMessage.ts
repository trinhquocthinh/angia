import { ReviewRequestError } from './ReviewRequestError';
export const privacyErrorMessage = (error: unknown) =>
  error instanceof ReviewRequestError
    ? error.message
    : 'Không thể tải hoặc lưu chứng từ. Kiểm tra kết nối rồi thử lại.';
