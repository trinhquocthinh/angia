import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';
import { ProfileSectionIcon } from '@src/features/profiles/presentation/components/ProfileSectionIcon';

type Props = { editable: boolean; pending: boolean; onRecord: () => void };

export function TemperatureHeader({ editable, pending, onRecord }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent-soft">
          <ProfileSectionIcon name="thermostat" size={32} />
        </span>
        <h2 className="auth-heading text-heading-2 font-semibold text-accent">Nhiệt độ</h2>
      </div>
      {editable && (
        <button
          type="button"
          disabled={pending}
          onClick={onRecord}
          className="inline-flex min-h-btn cursor-pointer items-center gap-1.5 rounded-2xl bg-accent px-4 text-button-primary font-semibold text-on-accent shadow-stitch-sm transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          <AdminIcon name="add" size={18} />
          Ghi nhiệt độ
        </button>
      )}
    </div>
  );
}
