/* global window, document */
// Khôi phục nền sáng/tối và cỡ chữ trước khi dựng giao diện để tránh nháy nền/chữ (SPEC-080).
// Tệp tĩnh cùng origin thay cho script inline vì CSP `script-src 'self'` chặn inline.
try {
  var savedTheme = localStorage.getItem('angia-theme');
  var darkSystem =
    typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.dataset.theme =
    savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : darkSystem ? 'dark' : 'light';
  document.documentElement.dataset.textSize =
    localStorage.getItem('angia-large-text') === 'true' ? 'large' : 'standard';
} catch {
  document.documentElement.dataset.theme =
    typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  document.documentElement.dataset.textSize = 'standard';
}
