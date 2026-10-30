import type { GrantDraft } from '../application/ports';
import { QuotaTextField } from './QuotaTextField';

// Tên gia đình chỉ dành cho trình đọc màn hình; mắt đã thấy tên ở đầu dòng.
export function ScanQuotaGrantFields({
  id,
  familyName,
  draft,
  onChange,
}: {
  id: string;
  familyName: string;
  draft: GrantDraft;
  onChange(draft: GrantDraft): void;
}) {
  return (
    <fieldset
      disabled={!draft.selected}
      className="m-0 grid min-w-0 gap-2 border-0 p-0 disabled:opacity-60 sm:grid-cols-[120px_minmax(0,1fr)]"
    >
      <legend className="sr-only">Cấp lượt cho {familyName}</legend>
      <QuotaTextField
        id={id}
        label={
          <>
            Tổng lượt được cấp<span className="sr-only"> · {familyName}</span>
          </>
        }
        mode="numeric"
        value={draft.grantedScans}
        onChange={(value) => onChange({ ...draft, grantedScans: value })}
      />
      <label
        htmlFor={`${id}-reason`}
        className="grid content-start gap-1 text-[12px] font-medium text-[#404945]"
      >
        <span>
          Lý do duyệt<span className="sr-only"> · {familyName}</span>
        </span>
        <textarea
          id={`${id}-reason`}
          rows={1}
          value={draft.reason}
          maxLength={500}
          onChange={(event) => onChange({ ...draft, reason: event.target.value })}
          className="min-h-10 w-full min-w-0 rounded-xl border-0 bg-[#eaf6f5] px-3 py-2 text-[13px] font-normal leading-5 text-[#131d1d] focus:bg-[#e4f0f0]"
        />
      </label>
    </fieldset>
  );
}
