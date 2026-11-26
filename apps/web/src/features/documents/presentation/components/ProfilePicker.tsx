import { Link } from '@tanstack/react-router';
import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';
import type { HealthProfile } from '@src/features/profiles/application/ports';
import { ChoiceChip } from './ChoiceChip';
import { PickerCard } from './PickerCard';

function ProfileChipMark({ selected, name }: { selected: boolean; name: string }) {
  if (selected)
    return (
      <span className="angia-modal-pop text-on-accent">
        <AdminIcon name="check_circle" size={18} />
      </span>
    );
  return (
    <span
      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface text-caption font-bold text-accent"
      aria-hidden="true"
    >
      {name.slice(0, 1)}
    </span>
  );
}

// BR-009: chỉ hồ sơ đã đồng thuận mới chọn được; hồ sơ khác hiển thị mờ kèm lý do.
export function ProfilePicker({
  profiles,
  selectedId,
  locked,
  onSelect,
}: {
  profiles: HealthProfile[];
  selectedId: string | null;
  locked: boolean;
  onSelect: (id: string) => void;
}) {
  const waiting = profiles.filter((profile) => profile.consentStatus !== 'confirmed');
  return (
    <PickerCard icon="supervisor_account" title="Của ai?" hint="Bắt buộc" required>
      {profiles.length === 0 && (
        <p className="text-caption text-text-secondary">
          Chưa có hồ sơ.{' '}
          <Link to="/profiles/new" className="font-semibold text-accent underline">
            Tạo hồ sơ
          </Link>
        </p>
      )}
      {profiles.map((profile) => {
        const ready = profile.consentStatus === 'confirmed';
        const selected = profile.id === selectedId;
        return (
          <ChoiceChip
            key={profile.id}
            tone="container"
            selected={selected}
            disabled={!ready || locked}
            onClick={() => onSelect(profile.id)}
          >
            <ProfileChipMark selected={selected} name={profile.displayName} />
            <span className="break-words">{profile.displayName}</span>
            {!ready && <span className="font-normal">· chưa xác nhận</span>}
          </ChoiceChip>
        );
      })}
      {waiting.length > 0 && (
        <p className="w-full text-caption text-text-secondary">
          Hồ sơ chưa có xác nhận cần gửi link mời ở{' '}
          <Link to="/" className="font-semibold text-accent underline">
            Trang chủ
          </Link>{' '}
          trước khi tải ảnh.
        </p>
      )}
    </PickerCard>
  );
}
