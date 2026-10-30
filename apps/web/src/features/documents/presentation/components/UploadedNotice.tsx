import '@src/shared/ui/modal-motion.css';
import { useState } from 'react';
import { useRouterState } from '@tanstack/react-router';
import { DocumentIcon } from './DocumentIcon';

// Thông báo ở Chờ duyệt sau khi /upload gửi xong (số ảnh truyền qua history state, không qua URL).
export function UploadedNotice() {
  const count = useRouterState({ select: (state) => state.location.state.uploadedCount });
  const [hidden, setHidden] = useState(false);
  if (!count || hidden) return null;
  return (
    <div
      role="status"
      className="angia-modal-reveal mb-6 flex items-center justify-between gap-3 rounded-2xl bg-[#aef0da]/60 px-4 py-3 shadow-sm"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="angia-modal-pop flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#286958] text-white">
          <DocumentIcon name="check" size={18} />
        </span>
        <p className="text-[13px] leading-5 text-[#055141]">
          <strong className="font-semibold text-[#002019]">Đã gửi {count} ảnh giấy tờ.</strong> Đang tự động
          nhận diện ảnh, thường dưới 15 giây — giấy tờ sẽ tự hiện trong danh sách khi đọc xong.
        </p>
      </div>
      <button
        type="button"
        onClick={() => setHidden(true)}
        aria-label="Đóng thông báo"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#404945] transition-colors hover:bg-white/60 motion-reduce:transition-none"
      >
        <DocumentIcon name="close" size={16} />
      </button>
    </div>
  );
}
