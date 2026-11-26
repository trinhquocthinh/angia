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
      className="m-0 grid min-w-0 items-end gap-3 border-0 p-0 disabled:opacity-60 sm:grid-cols-[minmax(180px,max-content)_minmax(0,1fr)]"
    >
      <legend className="sr-only">Cấp lượt cho {familyName}</legend>
      <QuotaTextField
        id={id}
        label={
          <span className="whitespace-nowrap">
            Tổng lượt được cấp<span className="sr-only"> · {familyName}</span>
          </span>
        }
        mode="numeric"
        value={draft.grantedScans}
        onChange={(value) => onChange({ ...draft, grantedScans: value })}
      />
      <label
        htmlFor={`${id}-reason`}
        className="grid content-start gap-1.5 text-caption font-medium text-text-secondary"
      >
        <span className="whitespace-nowrap">
          Lý do duyệt<span className="sr-only"> · {familyName}</span>
        </span>
        <textarea
          id={`${id}-reason`}
          rows={1}
          value={draft.reason}
          maxLength={500}
          onChange={(event) => onChange({ ...draft, reason: event.target.value })}
          className="min-h-11 w-full min-w-0 rounded-2xl border border-border/45 bg-bg px-3.5 py-2 text-body font-normal text-text-primary transition-colors focus:bg-surface"
        />
      </label>
    </fieldset>
  );
}
