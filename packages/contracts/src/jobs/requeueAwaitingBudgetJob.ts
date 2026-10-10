// Đưa chứng từ awaiting_budget về extracting + enqueue OCR theo từng gia đình (BR-018). Worker lên lịch
// 00:05 ngày 01 hằng tháng; API gửi thêm khi Quản trị viên nâng trần (SPEC-013, E3-S6-T2).
export const REQUEUE_AWAITING_BUDGET_QUEUE = 'requeue-awaiting-budget';
export const REQUEUE_AWAITING_BUDGET_QUEUE_OPTIONS = { retryLimit: 3, retryDelay: 60 } as const;
