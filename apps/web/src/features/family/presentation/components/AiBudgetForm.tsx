import { useState } from 'react';
import { parseBudgetCap } from '../../application/aiBudgetView';
import { AdminIcon } from './AdminIcon';
import { AiBudgetMessages } from './AiBudgetMessages';

export function AiBudgetForm({
  capUsd,
  pending,
  saved,
  error,
  onSave,
}: {
  capUsd: number;
  pending: boolean;
  saved: boolean;
  error: Error | null;
  onSave: (monthlyCapUsd: number) => void;
}) {
  const [invalid, setInvalid] = useState(false);
  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const value = parseBudgetCap(String(new FormData(event.currentTarget).get('monthlyCapUsd')));
        setInvalid(value === null);
        if (value !== null) onSave(value);
      }}
    >
      <fieldset disabled={pending}>
        <label>
          Trần tháng này (USD)
          <input
            key={capUsd}
            name="monthlyCapUsd"
            inputMode="decimal"
            defaultValue={capUsd.toFixed(2)}
            aria-invalid={invalid}
            className="min-h-11 w-full min-w-0 rounded-2xl border border-border/45 bg-bg px-3.5 py-2 text-body font-normal text-text-primary tabular-nums focus:bg-surface"
          />
        </label>
        <p className="m-0 text-caption text-text-secondary">
          Nâng trần: chứng từ đang chờ ngân sách được đọc lại ngay. Hạ trần dưới mức đã dùng: chứng từ mới sẽ
          chờ ngân sách.
        </p>
        <AiBudgetMessages invalid={invalid} saved={saved} error={error} />
        <button
          type="submit"
          className="inline-flex min-h-btn w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border-0 bg-accent px-5 text-button-primary font-semibold text-on-accent shadow-stitch-sm transition-colors enabled:hover:bg-accent-hover"
        >
          <AdminIcon name="check" size={18} />
          {pending ? 'Đang lưu...' : 'Lưu trần'}
        </button>
      </fieldset>
    </form>
  );
}
