import { useState } from 'react';
import { parseBudgetCap } from '../../application/aiBudgetView';
import type { FamilyCap } from '../../application/ports';

const usd = new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function FamilyCapSummary({ cap }: { cap: FamilyCap }) {
  return (
    <p className="m-0 flex flex-wrap items-baseline justify-between gap-2 text-[13px] text-[#131d1d]">
      <span className="font-semibold">{cap.familyName}</span>
      <span>
        ${usd.format(cap.spentUsd)} / ${usd.format(cap.capUsd)}
        {cap.capIsDefault && <span className="ml-1 text-[11px] text-[#707975]">(mặc định)</span>}
      </span>
    </p>
  );
}

// SPEC-031: một gia đình — đã dùng / trần tháng này (USD, chỉ quản trị thấy), đặt trần riêng hoặc về mặc định.
export function FamilyCapRow({
  cap,
  pending,
  onSave,
}: {
  cap: FamilyCap;
  pending: boolean;
  onSave: (capUsd: number | null) => void;
}) {
  const [invalid, setInvalid] = useState(false);
  return (
    <form
      noValidate
      aria-label={`Trần đọc tự động của ${cap.familyName}`}
      className="flex flex-col gap-2 rounded-xl bg-[#f3faf9] p-3"
      onSubmit={(event) => {
        event.preventDefault();
        const value = parseBudgetCap(String(new FormData(event.currentTarget).get('capUsd')));
        setInvalid(value === null);
        if (value !== null) onSave(value);
      }}
    >
      <FamilyCapSummary cap={cap} />
      <fieldset disabled={pending} className="flex flex-wrap items-center gap-2 border-0 p-0 m-0">
        <input
          key={cap.capUsd}
          name="capUsd"
          inputMode="decimal"
          aria-label={`Trần tháng (USD) của ${cap.familyName}`}
          aria-invalid={invalid}
          defaultValue={cap.capUsd.toFixed(2)}
          className="min-h-10 w-24 rounded-xl border-0 bg-[#eaf6f5] px-3 text-[13px]"
        />
        <button
          type="submit"
          className="min-h-10 rounded-xl bg-[#286958] px-3 text-[13px] font-semibold text-white"
        >
          Lưu
        </button>
        <button
          type="button"
          disabled={cap.capIsDefault}
          onClick={() => onSave(null)}
          className="min-h-10 rounded-xl bg-white px-3 text-[13px] font-semibold text-[#004135] shadow-sm disabled:opacity-40"
        >
          Dùng mặc định
        </button>
      </fieldset>
      {invalid && (
        <p role="alert" className="m-0 text-[11px] text-[#93000a]">
          Nhập số từ 0 đến 100, tối đa 2 chữ số thập phân.
        </p>
      )}
    </form>
  );
}
