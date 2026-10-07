const POLL_MS = 5000;
const POLL_WINDOW_MS = 2 * 60 * 1000;

// Vừa tải ảnh: AI đọc ngầm (thường < 15 giây) nên hàng đợi tự hỏi lại trong 2 phút rồi dừng.
export function reviewQueuePollInterval(startedAt: number | null, now: number): number | false {
  return startedAt !== null && now - startedAt <= POLL_WINDOW_MS ? POLL_MS : false;
}
