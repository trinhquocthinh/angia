import type { FamilyUsage } from '@angia/contracts';
import { remainingUploadSlots, usageBlockReason } from '../../application/familyUsageState';
import { MAX_FILES_PER_PICK } from '../../application/uploadQueue';

const ALERT = 'angia-modal-reveal rounded-2xl bg-[#ffdad6]/60 p-3 text-sm text-[#93000a]';

// Cảnh báo dưới vùng chọn ảnh: quá số ảnh mỗi lần chọn, hoặc số ảnh chờ gửi vượt chỗ còn lại (SPEC-030).
export function UploadPickNotices({
  tooMany,
  usage,
  readyCount,
}: {
  tooMany: boolean;
  usage: FamilyUsage | null;
  readyCount: number;
}) {
  const remaining = usage && !usageBlockReason(usage) ? remainingUploadSlots(usage) : null;
  return (
    <>
      {tooMany && (
        <p role="alert" className={ALERT}>
          Mỗi lần chỉ chọn tối đa {MAX_FILES_PER_PICK} ảnh. Không ảnh nào trong lần chọn vừa rồi được thêm.
        </p>
      )}
      {remaining !== null && readyCount > remaining && (
        <p role="alert" className={ALERT}>
          Gia đình chỉ còn gửi được {remaining} ảnh lúc này. Bỏ bớt ảnh hoặc gửi phần còn lại sau.
        </p>
      )}
    </>
  );
}
