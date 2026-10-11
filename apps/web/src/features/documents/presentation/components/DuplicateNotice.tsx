import { describeDuplicate } from '../../application/describeDuplicate';
import type { ApproveDocumentRequest } from '../../application/reviewPorts';
import type { DuplicateRecord } from '../../application/ReviewRequestError';
import { DocumentIcon } from './DocumentIcon';

type DuplicateNoticeProps = {
  duplicate: DuplicateRecord;
  type: ApproveDocumentRequest['type'];
  pending: boolean;
  onConfirm: () => void;
};

// BR-017: nghi trùng thì hỏi chủ ý trước khi lưu thêm; không lưu thì dùng "Loại bỏ" (chứng từ) hoặc sửa form.
// Kiểu cảnh báo nội tuyến theo Stitch 626ca318 (nền cam nhạt, biểu tượng trong vòng tròn, nút đậm).
export function DuplicateNotice({ duplicate, type, pending, onConfirm }: DuplicateNoticeProps) {
  return (
    <div role="alert" className="flex items-start gap-3 rounded-xl bg-[#ffdbc9] p-4 text-[#321200]">
      <span
        aria-hidden="true"
        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#833b00] text-[#ffdbc9]"
      >
        <DocumentIcon name="warning" size={16} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-2 text-sm leading-6">
        <p>
          <strong className="font-semibold">Giấy tờ này có vẻ đã được lưu trước đó</strong> —{' '}
          {describeDuplicate(duplicate, type)}.
        </p>
        <button
          type="button"
          disabled={pending}
          onClick={onConfirm}
          className="min-h-11 self-start rounded-lg bg-[#602900] px-4 text-sm font-semibold text-white disabled:opacity-55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#602900]"
        >
          {pending ? 'Đang lưu…' : 'Vẫn lưu bản này'}
        </button>
      </div>
    </div>
  );
}
