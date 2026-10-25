import type { Prescription } from '@angia/contracts';
import { doseLabel } from '@src/features/medications/application/doseLabel';
import { doseSlotLabel } from '../../application/doseSlots';
import type { ReuseItemForm } from '../../application/reuseForm';
import { SwitchField } from '../components/SwitchField';

type Props = {
  index: number;
  item: Prescription['items'][number];
  value: ReuseItemForm;
  disabled: boolean;
  onChange: (value: ReuseItemForm) => void;
};

// Một dòng đơn trong sheet Dùng lại: chọn/bỏ chọn, số ngày (mặc định như đơn gốc) hoặc Dài hạn.
export function ReuseItemRow({ index, item, value, disabled, onChange }: Props) {
  const id = `reuse-item-${index}`;
  return (
    <fieldset disabled={disabled} className="flex flex-col gap-3 rounded-xl border border-[#d9e5e4] p-4">
      <label className="flex min-h-11 cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={value.selected}
          onChange={(event) => onChange({ ...value, selected: event.target.checked })}
          className="mt-1 h-5 w-5 accent-[#004135]"
        />
        <span className="flex flex-col text-sm">
          <span className="font-semibold">
            {item.name}
            {item.strength ? ` ${item.strength}` : ''}
          </span>
          <span className="text-[#55615f]">
            {doseLabel(item.quantityPerDose, item.doseUnit)} · {item.slots.map(doseSlotLabel).join(', ')}
          </span>
        </span>
      </label>
      {value.selected && (
        <div className="flex flex-wrap items-end gap-3">
          {!value.longTerm && (
            <label htmlFor={`${id}-days`} className="flex flex-col gap-1 text-sm font-medium">
              Số ngày
              <input
                id={`${id}-days`}
                type="number"
                inputMode="numeric"
                min={1}
                max={3650}
                value={value.durationDays}
                onChange={(event) => onChange({ ...value, durationDays: event.target.value })}
                className="min-h-11 w-28 rounded-xl border border-[#bfc9c4] px-3"
              />
            </label>
          )}
          <SwitchField
            checked={value.longTerm}
            onChange={(event) => onChange({ ...value, longTerm: event.target.checked })}
          >
            Dài hạn
          </SwitchField>
        </div>
      )}
    </fieldset>
  );
}
