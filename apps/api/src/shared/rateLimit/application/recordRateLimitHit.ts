import { consumeRateLimit } from './consumeRateLimit.js';

// Ghi một lần sai (login_failed) sau khi đã checkRateLimit trước hash; cùng phép tăng nguyên tử như consume.
export const recordRateLimitHit = consumeRateLimit;
