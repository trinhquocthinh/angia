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
            className="min-h-10 w-full min-w-0 rounded-xl border-0 bg-[#eaf6f5] py-2 px-3 text-[13px] leading-5 font-normal text-[#131d1d] focus:bg-[#e4f0f0]"
          />
        </label>
        <p className="admin-hint m-0 text-[#707975]">
          Nâng trần: chứng từ đang chờ ngân sách được đọc lại ngay. Hạ trần dưới mức đã dùng: chứng từ mới sẽ
          chờ ngân sách.
        </p>
        <AiBudgetMessages invalid={invalid} saved={saved} error={error} />
        <button
          type="submit"
          className="admin-button inline-flex items-center justify-center gap-2 min-h-11 py-[10px] px-4 border-0 rounded-[12px] bg-[#286958] text-white text-[14px] leading-[20px] font-semibold cursor-pointer shadow-[0_1px_2px_#0000000d] transition-[transform,background-color,box-shadow] duration-[160ms] ease-[ease] [&:hover]:bg-[#004135] [&:hover]:shadow-[0_4px_12px_#0041350f] [&:active]:scale-[0.99] motion-reduce:[&:active]:transform-none"
        >
          <AdminIcon name="check" size={18} />
          {pending ? 'Đang lưu...' : 'Lưu trần'}
        </button>
      </fieldset>
    </form>
  );
}
