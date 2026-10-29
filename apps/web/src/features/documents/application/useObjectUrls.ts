import { useCallback, useEffect, useRef } from 'react';

// Object URL theo khóa: tạo lại thì thu hồi bản cũ; unmount thu hồi hết.
// Hook gắn từ lúc mở trang (chưa có ảnh) nên lần unmount giả của StrictMode không thu hồi nhầm URL.
export function useObjectUrls() {
  const urls = useRef(new Map<string, string>());
  const revoke = useCallback((key: string) => {
    const url = urls.current.get(key);
    if (url) URL.revokeObjectURL(url);
    urls.current.delete(key);
  }, []);
  const create = useCallback(
    (key: string, blob: Blob) => {
      revoke(key);
      const url = URL.createObjectURL(blob);
      urls.current.set(key, url);
      return url;
    },
    [revoke],
  );
  useEffect(() => {
    const all = urls.current;
    return () => all.forEach((url) => URL.revokeObjectURL(url));
  }, []);
  return { create, revoke };
}
