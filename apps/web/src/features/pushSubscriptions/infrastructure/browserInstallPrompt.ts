import { createInstallPrompt } from './installPrompt';

/** Bộ giữ lời mời cài của trình duyệt; phải được nạp từ main.tsx để bắt sự kiện ngay khi trang tải. */
export const browserInstallPrompt = createInstallPrompt(window);
