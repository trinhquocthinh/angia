import { useEffect } from 'react';
// Cảnh báo trình duyệt khi đóng/tải lại tab trong lúc còn ảnh chưa gửi xong.
export function useLeaveWarning(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [active]);
}
