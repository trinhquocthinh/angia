import { useState, type FormEvent } from 'react';
import type { DoseSlotList } from '@angia/contracts';
import type { DoseSlotTimes } from '../application/ports';
import {
  DOSE_SLOTS,
  toDoseSlotForm,
  validateDoseSlotForm,
  type DailySlot,
} from '../application/doseSlotForm';

type Props = {
  saved: DoseSlotList;
  pending: boolean;
  /** Lỗi từ API (đã là thông điệp tiếng Việt). */
  serverError: string | null;
  done: boolean;
  onSubmit: (slots: DoseSlotTimes) => void;
};

const inputClass =
  'min-h-11 w-full rounded-xl border border-border bg-surface px-3 text-base tabular-nums text-text-primary aria-invalid:border-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus';

// SPEC-025 (Design §5 "Khung giờ buổi"): 4 ô giờ Sáng/Trưa/Chiều/Tối; để trống = không nhắc buổi đó.
export function DoseSlotSettingsForm({ saved, pending, serverError, done, onSubmit }: Props) {
  const [form, setForm] = useState(() => toDoseSlotForm(saved));
  const [invalid, setInvalid] = useState<{ slot: DailySlot; message: string } | null>(null);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const result = validateDoseSlotForm(form);
    setInvalid(result.ok ? null : result);
    if (result.ok) onSubmit(result.slots);
  };
  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5 rounded-xl bg-surface p-5 shadow-sm">
      {saved.length === 0 && (
        <p className="rounded-xl bg-accent-soft px-4 py-3 text-sm text-text-secondary">
          Chưa thiết lập khung giờ nhắc.
        </p>
      )}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {DOSE_SLOTS.map(({ slot, label }) => (
          <label key={slot} className="flex flex-col gap-1.5 text-sm font-semibold text-text-secondary">
            {label}
            <input
              type="time"
              name={slot}
              value={form[slot]}
              aria-invalid={invalid?.slot === slot || undefined}
              aria-describedby={invalid?.slot === slot ? 'dose-slot-error' : undefined}
              onChange={(event) => setForm({ ...form, [slot]: event.target.value })}
              className={inputClass}
            />
          </label>
        ))}
      </div>
      <p className="text-xs text-text-secondary">
        Giờ theo giờ Việt Nam, tăng dần từ Sáng tới Tối. Để trống buổi không cần nhắc.
      </p>
      {(invalid || serverError) && (
        <p id="dose-slot-error" role="alert" className="text-sm font-medium text-danger">
          {invalid?.message ?? serverError}
        </p>
      )}
      {done && !invalid && !serverError && (
        <p role="status" className="text-sm font-medium text-accent">
          Đã lưu khung giờ nhắc.
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 self-start rounded-xl bg-accent px-5 text-sm font-semibold text-on-accent disabled:opacity-55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        {pending ? 'Đang lưu…' : 'Lưu khung giờ'}
      </button>
    </form>
  );
}
