import { Link } from '@tanstack/react-router';
import type { HealthProfile } from '@src/features/profiles/application/ports';
import { ChoiceChip } from './ChoiceChip';
import { DocumentIcon } from './DocumentIcon';
import { PickerCard } from './PickerCard';

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
    <PickerCard icon="people" title="Của ai?" hint="Bắt buộc">
      {profiles.length === 0 && (
        <p className="text-sm text-[#55615f]">
          Chưa có hồ sơ.{' '}
          <Link to="/profiles/new" className="font-semibold text-[#286958] underline">
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
            {selected ? (
              <DocumentIcon name="check" size={16} />
            ) : (
              <span className="h-2 w-2 rounded-full bg-[#bfc9c4]" aria-hidden="true" />
            )}
            <span className="break-words">{profile.displayName}</span>
            {!ready && <span className="font-normal">· chưa đồng thuận</span>}
          </ChoiceChip>
        );
      })}
      {waiting.length > 0 && (
        <p className="w-full text-xs leading-5 text-[#55615f]">
          Hồ sơ chưa đồng thuận cần gửi link mời ở{' '}
          <Link to="/" className="font-semibold text-[#286958] underline">
            Trang chủ
          </Link>{' '}
          trước khi tải ảnh.
        </p>
      )}
    </PickerCard>
  );
}
