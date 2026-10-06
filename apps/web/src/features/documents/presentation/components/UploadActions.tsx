import { Link } from '@tanstack/react-router';
import { DocumentIcon } from './DocumentIcon';

// "Xong — đến Chờ duyệt" giữ đúng thiết kế nhưng disabled tới khi có màn /review (E2-S6-T1).
export function UploadActions({ uploading }: { uploading: boolean }) {
  return (
    <div className="flex flex-col items-center justify-between gap-4 rounded-xl bg-white p-4 shadow-md sm:flex-row">
      <div className="flex w-full min-w-0 items-center gap-3 sm:flex-1">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#aef0da] text-[#002019]">
          <DocumentIcon name="upload" />
        </span>
        <div>
          <p className="text-sm font-bold text-[#131d1d]">
            {uploading ? 'Đang tải ảnh lần lượt' : 'Ảnh được gửi lần lượt từng tấm'}
          </p>
          <p className="text-[11px] font-medium text-[#286958]">
            Giữ trang này mở cho tới khi tải xong; rời trang thì ảnh còn chờ sẽ không được gửi.
          </p>
        </div>
      </div>
      <div className="flex w-full flex-col-reverse items-stretch gap-2 sm:w-auto sm:shrink-0 sm:flex-row sm:items-center">
        <Link
          to="/"
          className="flex h-[52px] shrink-0 items-center justify-center whitespace-nowrap rounded-xl px-6 text-sm font-semibold text-[#404945] hover:bg-[#e4f0f0]"
        >
          Hủy bỏ
        </Link>
        <button
          type="button"
          disabled
          title="Màn Chờ duyệt sẽ có ở bước tiếp theo"
          className="flex h-[52px] w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[#004135] px-8 text-sm font-bold text-white shadow-md disabled:cursor-not-allowed disabled:opacity-55 sm:w-auto"
        >
          Xong — đến Chờ duyệt <DocumentIcon name="arrow" />
        </button>
      </div>
    </div>
  );
}
