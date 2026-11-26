import { SlotBadgeIcon } from '@src/features/medications/presentation/SlotBadgeIcon';
import type { DailySlot } from '../application/doseSlotForm';

type Props = {
  id: string;
  slot: DailySlot;
  label: string;
  value: string;
  invalid: boolean;
  onChange: (value: string) => void;
};

export function DoseSlotTile({ id, slot, label, value, invalid, onChange }: Props) {
  const active = value.length > 0;
  const tileTone = invalid ? 'reminder-slot-tile-invalid' : active ? 'reminder-slot-tile-active' : '';
  return (
    <div className={`reminder-slot-tile ${tileTone}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <SlotBadgeIcon slot={slot} />
          <label htmlFor={id} className="text-body font-semibold text-text-primary">
            {label}
          </label>
        </div>
        <span className={`reminder-pill ${active ? '' : 'reminder-pill-muted'}`}>
          {active ? 'Đang bật' : 'Bỏ trống'}
        </span>
      </div>
      <input
        id={id}
        type="time"
        name={slot}
        value={value}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? 'dose-slot-error' : undefined}
        onChange={(event) => onChange(event.target.value)}
        className="reminder-time-input"
      />
    </div>
  );
}
