import { Button } from '@src/shared/ui/button/Button';

type Props = {
  profiles: { id: string; displayName: string }[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export function ProfileSwitcher({ profiles, selectedId, onSelect }: Props) {
  return (
    <div role="group" aria-label="Chọn hồ sơ" className="flex gap-2 overflow-x-auto py-2">
      {profiles.map((profile) => (
        <Button
          key={profile.id}
          variant="secondary"
          className="max-w-64 shrink-0"
          aria-pressed={selectedId === profile.id}
          onClick={() => onSelect(profile.id)}
        >
          {selectedId === profile.id && <span aria-hidden="true">✓</span>}
          {profile.displayName}
        </Button>
      ))}
    </div>
  );
}
