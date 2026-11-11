import type { AdminScanQuotaView } from '@angia/contracts';
import type { GrantDraft } from '../application/ports';
import { ScanQuotaFamilyDetails } from './ScanQuotaFamilyDetails';
import { ScanQuotaGrantFields } from './ScanQuotaGrantFields';
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
  return (
    <div
      className={`grid min-w-0 gap-2 rounded-xl border p-3 transition-colors ${
        draft.selected ? 'border-accent bg-accent-soft/40' : 'border-border'
      }`}
    >
      <label title={family.familyId} className="flex min-h-6 items-center gap-2 text-sm font-semibold">
        <input
          type="checkbox"
          className="h-5 w-5 shrink-0 accent-accent"
          checked={draft.selected}
          onChange={(event) => onChange({ ...draft, selected: event.target.checked })}
        />
        Chọn {family.familyName}
      </label>
      <ScanQuotaFamilyDetails family={family} />
      <ScanQuotaGrantFields
        id={`scan-grant-${family.familyId}`}
        familyName={family.familyName}
        draft={draft}
        onChange={onChange}
      />
      {error && (
        <p role="alert" className="m-0 text-[12px] text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
