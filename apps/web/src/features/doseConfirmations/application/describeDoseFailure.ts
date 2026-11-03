import type { MedicationRequestError } from '@src/features/medications/application/MedicationRequestError';

const FIXED_MESSAGES: Record<number, string> = {
  422: 'Chỉ xác nhận hoặc hủy trong ngày của lời nhắc.',
  404: 'Không tìm thấy lời nhắc hoặc bạn không có quyền xác nhận.',
  409: 'Hồ sơ chưa được đồng ý lưu dữ liệu.',
};

// Design §9.6: chỉ lỗi mạng/máy chủ mới mời thử lại; lỗi nghiệp vụ thì làm mới bản ghi thay vì bấm lại.
export function describeDoseFailure(error: MedicationRequestError) {
  return {
    message: FIXED_MESSAGES[error.status] ?? error.message,
    canRetry: error.status === 0 || error.status >= 500,
  };
}
