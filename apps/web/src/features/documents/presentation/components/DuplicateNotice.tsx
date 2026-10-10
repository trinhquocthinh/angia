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
export function DuplicateNotice({ duplicate, type, pending, onConfirm }: DuplicateNoticeProps) {
  return (
    <div role="alert" className="flex gap-3 rounded-2xl bg-[#fff4e5] p-4 text-[#5c3a00]">
      <span aria-hidden="true" className="mt-0.5 shrink-0">
        <DocumentIcon name="warning" />
      </span>
      <div className="flex flex-col gap-3 text-sm leading-6">
        <p>
          <strong>Giấy tờ này có vẻ đã được lưu trước đó</strong> — {describeDuplicate(duplicate, type)}.
        </p>
        <button
          type="button"
          disabled={pending}
          onClick={onConfirm}
          className="min-h-11 self-start rounded-xl border border-[#b54708] px-4 font-semibold text-[#5c3a00] disabled:opacity-55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b54708]"
        >
          {pending ? 'Đang lưu…' : 'Vẫn lưu bản này'}
        </button>
      </div>
    </div>
  );
}
