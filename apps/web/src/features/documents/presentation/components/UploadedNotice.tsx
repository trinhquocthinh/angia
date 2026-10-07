import { useState } from 'react';
import { useRouterState } from '@tanstack/react-router';
import { DocumentIcon } from './DocumentIcon';

// Thông báo ở Chờ duyệt sau khi /upload gửi xong (số ảnh truyền qua history state, không qua URL).
export function UploadedNotice() {
  const count = useRouterState({ select: (state) => state.location.state.uploadedCount });
  const [hidden, setHidden] = useState(false);
  if (!count || hidden) return null;
  return (
    <div role="status" className="mb-6 flex items-start justify-between gap-3 rounded-xl bg-[#aef0da]/50 p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-[#004135]">
        <DocumentIcon name="check" /> Đã gửi {count} ảnh chứng từ. AI đang đọc ảnh, thường dưới 15 giây —
        chứng từ sẽ tự hiện trong danh sách khi đọc xong.
      </p>
      <button
        type="button"
        onClick={() => setHidden(true)}
        aria-label="Đóng thông báo"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#404945]"
      >
        <DocumentIcon name="close" size={16} />
      </button>
    </div>
  );
}
