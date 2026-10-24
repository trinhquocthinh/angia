import type { ErrorResponse } from '@angia/contracts';
import type { Context } from 'hono';

// Mã lỗi đang dùng, thông điệp đúng nguyên văn SDD §4.1–4.2.
const ERROR_CATALOG = {
  ERR_PUSH_DISABLED: { status: 503, message: 'Tính năng thông báo chưa được bật trên máy chủ.' },
  ERR_PUSH_CONFLICT: {
    status: 409,
    message: 'Đăng ký thông báo đã thuộc phiên khác. Vui lòng gỡ rồi bật lại.',
  },
  ERR_PUSH_DEVICE_LIMIT: { status: 409, message: 'Tài khoản đã bật thông báo trên 10 thiết bị.' },
  ERR_PUSH_NOT_REGISTERED: {
    status: 409,
    message: 'Thiết bị chưa đăng ký hoặc đăng ký đã hết hiệu lực. Vui lòng bật lại thông báo.',
  },
  ERR_PUSH_UNAVAILABLE: { status: 503, message: 'Chưa gửi được thông báo thử. Vui lòng thử lại.' },
  ERR_UNAUTHENTICATED: {
    status: 401,
    message: 'Phiên làm việc đã kết thúc hoặc không hợp lệ. Vui lòng đăng nhập lại.',
  },
  ERR_FORBIDDEN: { status: 403, message: 'Bạn không có quyền thực hiện thao tác này.' },
  ERR_NOT_FOUND: { status: 404, message: 'Không tìm thấy tài nguyên yêu cầu.' },
  ERR_ACCOUNT_ALREADY_IN_FAMILY: { status: 409, message: 'Tài khoản này đã thuộc một nhóm gia đình khác.' },
  ERR_FIRST_ACCOUNT_MUST_BE_MAIN: {
    status: 409,
    message: 'Người đầu tiên của nhóm gia đình bắt buộc phải là người chăm sóc chính.',
  },
  ERR_LAST_MAIN: {
    status: 409,
    message: 'Nhóm gia đình bắt buộc phải duy trì ít nhất một người chăm sóc chính.',
  },
  ERR_PROFILE_ALREADY_LINKED: {
    status: 409,
    message: 'Tài khoản này đã được liên kết với một hồ sơ sức khỏe khác.',
  },
  ERR_CONSENT_INVITATION_REQUIRED: {
    status: 409,
    message: 'Vui lòng tạo link mời để người nhận tự xác nhận đồng thuận.',
  },
  ERR_CONFIRMATION_MISMATCH: {
    status: 422,
    message: 'Tên xác nhận nhập lại không trùng khớp, thao tác xóa đã bị hủy.',
  },
  ERR_CONSENT_ALREADY_CONFIRMED: { status: 409, message: 'Hồ sơ này đã có đồng thuận từ người nhận.' },
  ERR_CONSENT_REQUIRED: {
    status: 409,
    message: 'Cần hoàn tất xác nhận đồng thuận lưu trữ dữ liệu cho hồ sơ này trước.',
  },
  ERR_BATCH_TOO_LARGE: {
    status: 413,
    message: 'Quy mô lô tải lên vượt quá giới hạn tối đa (10 tệp/lần).',
  },
  ERR_NO_VALID_FILE: {
    status: 422,
    message: 'Không tìm thấy bất kỳ tệp hợp lệ nào trong phiên tải lên này.',
  },
  ERR_DOCUMENT_DATE_REQUIRED: {
    status: 422,
    message: 'Vui lòng xác định ngày ghi nhận trên chứng từ trước khi phê duyệt lưu trữ.',
  },
  ERR_OUT_OF_RANGE_UNCONFIRMED: {
    status: 422,
    message:
      'Chỉ số đo lường vượt ngoài khoảng giá trị vật lý thông thường. Vui lòng kiểm tra hoặc xác nhận.',
  },
  ERR_DUPLICATE_UNCONFIRMED: {
    status: 409,
    message: 'Phát hiện chứng từ có nội dung tương tự đã tồn tại trong hệ thống.',
  },
  ERR_COURSE_CONFLICT_UNRESOLVED: {
    status: 409,
    message: 'Thuốc này đang trong liệu trình điều trị. Vui lòng chọn cơ chế Thay thế hoặc Dùng song song.',
  },
  ERR_INVALID_STATE_TRANSITION: {
    status: 409,
    message: 'Thao tác không thể thực hiện tại trạng thái vòng đời hiện tại của đối tượng.',
  },
  ERR_BP_INVALID: {
    status: 422,
    message: 'Chỉ số huyết áp không hợp lệ. Yêu cầu nhập đủ cả hai số và tâm thu phải lớn hơn tâm trương.',
  },
  ERR_GLUCOSE_UNIT_REQUIRED: {
    status: 422,
    message: 'Vui lòng lựa chọn đơn vị đo lường cho chỉ số đường huyết (mmol/L hoặc mg/dL).',
  },
  ERR_DOSE_INFO_MISSING: {
    status: 422,
    message: 'Thông tin dòng thuốc chưa đầy đủ (yêu cầu buổi dùng, liều dùng và thời lượng).',
  },
  ERR_VALIDATION: { status: 422, message: 'Dữ liệu gửi lên không đúng định dạng quy định.' },
  ERR_UPLOAD_TIMEOUT: {
    status: 408,
    message: 'Tải ảnh mất quá lâu hoặc bị gián đoạn. Vui lòng kiểm tra kết nối và gửi lại.',
  },
  ERR_UPLOAD_BUSY: {
    status: 503,
    message: 'Hệ thống đang nhận ảnh của nhiều người cùng lúc. Vui lòng thử lại sau ít giây.',
  },
  ERR_STORAGE_QUOTA: {
    status: 413,
    message:
      'Gia đình đã dùng hết dung lượng lưu ảnh. Liên hệ quản trị viên để nâng dung lượng; bạn vẫn có thể nhập tay không kèm ảnh.',
  },
  ERR_DAILY_UPLOAD_QUOTA: {
    status: 429,
    message: 'Hôm nay gia đình đã tải đủ số ảnh cho phép. Bạn có thể tải tiếp từ 0 giờ ngày mai.',
  },
  ERR_QUEUE_QUOTA: {
    status: 429,
    message: 'Đang có nhiều ảnh chờ xử lý. Vui lòng đợi xử lý xong rồi gửi tiếp.',
  },
  ERR_RATE_LIMITED: { status: 429, message: 'Bạn thao tác hơi nhanh. Vui lòng thử lại sau ít giây.' },
  ERR_INTERNAL: { status: 500, message: 'Đã xảy ra lỗi nội bộ hệ thống. Vui lòng thử lại sau.' },
} as const;

type ErrorCode = keyof typeof ERROR_CATALOG;

// Đối số [thân, mã HTTP literal] cho `c.json(...errorJson(code))` trong handler OpenAPI đã khai báo kiểu response.
// `details` cho lỗi cần chỉ vị trí trường (vd. ERR_OUT_OF_RANGE_UNCONFIRMED → { fields }).
export function errorJson<Code extends ErrorCode>(code: Code, details?: Record<string, unknown>) {
  const { status, message } = ERROR_CATALOG[code];
  const body: ErrorResponse = { error: { code, message, ...(details ? { details } : {}) } };
  return [body, status as (typeof ERROR_CATALOG)[Code]['status']] as const;
}

// Phản hồi lỗi theo cấu trúc chuẩn SDD §4.3; không bao giờ kèm stack trace hay chi tiết hạ tầng.
export function errorResponse(c: Context, code: ErrorCode): Response {
  return c.json(...errorJson(code));
}
