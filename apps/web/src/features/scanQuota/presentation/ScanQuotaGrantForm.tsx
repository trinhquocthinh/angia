import { useState } from 'react';
import type { AdminScanQuotaView, GrantScanQuotasRequest } from '@angia/contracts';
import { createGrantDrafts } from '../application/createGrantDrafts';
import { buildGrantRequest } from '../application/buildGrantRequest';
import type { GrantErrors } from '../application/ports';
import { ScanQuotaGrantRow } from './ScanQuotaGrantRow';
type ScanQuotaGrantFormProps = {
  initial: AdminScanQuotaView;
  pending: boolean;
  onSave(input: GrantScanQuotasRequest): Promise<unknown>;
};
export function ScanQuotaGrantForm({ initial, pending, onSave }: ScanQuotaGrantFormProps) {
  const [drafts, setDrafts] = useState(() => createGrantDrafts(initial));
  const [errors, setErrors] = useState<GrantErrors>({});
  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (pending) return;
        const result = buildGrantRequest(initial, drafts);
        setErrors(result.errors);
        if (result.request) void onSave(result.request).catch(() => undefined);
      }}
    >
      <fieldset disabled={pending} className="m-0 grid min-w-0 gap-3 border-0 p-0 disabled:opacity-70">
        <legend className="mb-2 text-sm font-semibold text-[#131d1d]">
          Duyệt lượt tháng {initial.month}
        </legend>
        <p className="m-0 rounded-xl bg-[#eaf6f5]/70 px-3 py-2 text-[12px] leading-5 text-[#404945]">
          Mọi gia đình tự có lượt mặc định mỗi tháng, không cần duyệt. Chỉ chọn gia đình cần nhiều lượt hơn,
          tối đa 100 gia đình. Nhập tổng lượt sau khi duyệt, không phải số tăng thêm; không giảm tổng đã cấp.
          Lượt riêng không tự gia hạn sang tháng sau.
        </p>
        {initial.families.map((family) => (
          <ScanQuotaGrantRow
            key={family.familyId}
            family={family}
            draft={drafts[family.familyId]!}
            error={errors[family.familyId]}
            onChange={(draft) => {
              setDrafts((current) => ({ ...current, [family.familyId]: draft }));
              setErrors({});
            }}
          />
        ))}
        {errors.selection && (
          <p role="alert" className="m-0 text-[12px] text-[#93000a]">
            {errors.selection}
          </p>
        )}
        {initial.families.length === 0 && <p className="m-0 text-[12px]">Chưa có gia đình để cấp lượt.</p>}
        <button
          className="admin-button min-h-11 w-full cursor-pointer rounded-xl border-0 bg-[#004135] px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition-colors enabled:hover:bg-[#20594b] disabled:cursor-wait disabled:opacity-60"
          type="submit"
        >
          {pending ? 'Đang xử lý…' : 'Duyệt các gia đình đã chọn'}
        </button>
        <p className="m-0 text-[12px] leading-5 text-[#55615f]">
          Máy chủ kiểm tra lại ngân sách cho toàn bộ lựa chọn. Nếu một dòng không hợp lệ, không dòng nào được
          cấp.
        </p>
      </fieldset>
    </form>
  );
}
