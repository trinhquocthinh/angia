import type { AdminScanQuotaView } from '@angia/contracts';
import type { GrantDraft } from '../application/ports';
import { ScanQuotaFamilyDetails } from './ScanQuotaFamilyDetails';
import { QuotaTextField } from './QuotaTextField';
export function ScanQuotaGrantRow({
  family,
  draft,
  error,
  onChange,
}: {
  family: AdminScanQuotaView['families'][number];
  draft: GrantDraft;
  error: string | undefined;
  onChange(draft: GrantDraft): void;
}) {
  const id = `scan-grant-${family.familyId}`;
  return (
    <div className="grid min-w-0 gap-2 rounded-xl border border-[#dce5df] p-3">
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input
          type="checkbox"
          checked={draft.selected}
          onChange={(event) => onChange({ ...draft, selected: event.target.checked })}
        />
        Chọn {family.familyName}
      </label>
      <ScanQuotaFamilyDetails family={family} />
      <fieldset
        disabled={!draft.selected}
        className="m-0 grid min-w-0 gap-2 border-0 p-0 disabled:opacity-60"
      >
        <legend className="sr-only">Cấp lượt cho {family.familyName}</legend>
        <QuotaTextField
          id={id}
          label={`Tổng lượt được cấp · ${family.familyName}`}
          mode="numeric"
          value={draft.grantedScans}
          onChange={(value) => onChange({ ...draft, grantedScans: value })}
        />
        <label htmlFor={`${id}-reason`} className="grid gap-1 text-[12px] font-medium">
          Lý do duyệt · {family.familyName}
          <textarea
            id={`${id}-reason`}
            value={draft.reason}
            maxLength={500}
            onChange={(event) => onChange({ ...draft, reason: event.target.value })}
            className="min-h-10 w-full min-w-0 rounded-xl border-0 bg-[#eaf6f5] px-3 py-2 text-[13px] font-normal leading-5 text-[#131d1d] focus:bg-[#e4f0f0]"
          />
        </label>
      </fieldset>
      {error && (
        <p role="alert" className="m-0 text-[12px] text-[#93000a]">
          {error}
        </p>
      )}
    </div>
  );
}
