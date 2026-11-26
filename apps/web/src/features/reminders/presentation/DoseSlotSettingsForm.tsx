import { useId, useState, type FormEvent } from 'react';
import type { DoseSlotList } from '@angia/contracts';
import type { DoseSlotTimes } from '../application/ports';
import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';
import { Button } from '@src/shared/ui/button/Button';
import {
  DOSE_SLOTS,
  toDoseSlotForm,
  validateDoseSlotForm,
  type DailySlot,
} from '../application/doseSlotForm';
import { DoseSlotTile } from './DoseSlotTile';
import { ReminderFormFeedback } from './ReminderFormFeedback';

type Props = {
  saved: DoseSlotList;
  pending: boolean;
  /** Lỗi từ API (đã là thông điệp tiếng Việt). */
  serverError: string | null;
  done: boolean;
  onSubmit: (slots: DoseSlotTimes) => void;
};

// SPEC-025 (Design §5 "Khung giờ buổi"): lưới Bento 4 ô giờ Sáng/Trưa/Chiều/Tối; để trống = không nhắc buổi đó.
export function DoseSlotSettingsForm({ saved, pending, serverError, done, onSubmit }: Props) {
  const idPrefix = useId();
  const [form, setForm] = useState(() => toDoseSlotForm(saved));
  const [invalid, setInvalid] = useState<{ slot: DailySlot; message: string } | null>(null);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const result = validateDoseSlotForm(form);
    setInvalid(result.ok ? null : result);
    if (result.ok) onSubmit(result.slots);
  };
  return (
    <form onSubmit={submit} noValidate className="flex min-w-0 flex-col gap-5">
      {saved.length === 0 && (
        <div className="reminder-callout text-caption">
          <AdminIcon name="info" size={18} />
          <p>Chưa thiết lập khung giờ nhắc.</p>
        </div>
      )}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        {DOSE_SLOTS.map(({ slot, label }) => (
          <DoseSlotTile
            key={slot}
            id={`${idPrefix}-${slot}`}
            slot={slot}
            label={label}
            value={form[slot]}
            invalid={invalid?.slot === slot}
            onChange={(value) => setForm({ ...form, [slot]: value })}
          />
        ))}
      </div>
      <div className="reminder-callout text-caption">
        <AdminIcon name="info" size={18} />
        <p>Giờ theo giờ Việt Nam, tăng dần từ Sáng tới Tối. Để trống buổi không cần nhắc.</p>
      </div>
      <ReminderFormFeedback
        errorId="dose-slot-error"
        error={invalid?.message ?? serverError}
        done={done}
        successText="Đã lưu khung giờ nhắc."
      />
      <Button
        type="submit"
        disabled={pending}
        className="w-full rounded-2xl shadow-stitch-sm sm:w-auto sm:self-end sm:px-6"
      >
        <AdminIcon name="save" size={18} />
        {pending ? 'Đang lưu…' : 'Lưu khung giờ'}
      </Button>
    </form>
  );
}
