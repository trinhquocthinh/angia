import { useState } from 'react';
import type { AdminScanQuotaView, UpdateScanQuotaPolicyRequest } from '@angia/contracts';
import { toPolicyDraft } from '../application/toPolicyDraft';
import { buildPolicyRequest } from '../application/buildPolicyRequest';
import type { PolicyDraft, PolicyErrors } from '../application/ports';
import { QuotaPolicyFields } from './QuotaPolicyFields';
export function ScanQuotaPolicyForm({
  initial,
  pending,
  onSave,
}: {
  initial: AdminScanQuotaView;
  pending: boolean;
  onSave(input: UpdateScanQuotaPolicyRequest): Promise<unknown>;
}) {
  const [draft, setDraft] = useState(() => toPolicyDraft(initial));
  const [errors, setErrors] = useState<PolicyErrors>({});
  const change = (field: keyof PolicyDraft, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };
  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (pending) return;
        const result = buildPolicyRequest(draft);
        setErrors(result.errors);
        if (result.request) void onSave(result.request).catch(() => undefined);
      }}
    >
      <fieldset disabled={pending} className="m-0 grid min-w-0 gap-3 border-0 p-0 disabled:opacity-70">
        <legend className="mb-3 text-sm font-semibold">Chính sách cấp lượt</legend>
        <p className="m-0 text-[12px] leading-5">
          Chính sách giữ qua các tháng. Dùng dấu chấm cho số thập phân. Dùng thử chỉ cấp một lần lúc tạo gia
          đình mới khi đủ ngân sách.
        </p>
        <QuotaPolicyFields draft={draft} errors={errors} onChange={change} />
        <button
          className="admin-button min-h-10 w-full rounded-xl border-0 bg-[#286958] px-4 py-2 text-[12px] font-semibold text-white shadow-sm transition-colors hover:bg-[#004135] disabled:cursor-wait disabled:opacity-60"
          type="submit"
        >
          {pending ? 'Đang xử lý…' : 'Lưu chính sách'}
        </button>
      </fieldset>
    </form>
  );
}
