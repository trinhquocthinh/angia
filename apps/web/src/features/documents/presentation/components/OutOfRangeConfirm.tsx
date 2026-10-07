import { DocumentIcon } from './DocumentIcon';

const FIELD_LABELS: Record<string, string> = {
  systolic: 'tâm thu',
  diastolic: 'tâm trương',
  pulse: 'mạch',
  glucoseValue: 'đường huyết',
};

type OutOfRangeConfirmProps = {
  fields: string[];
  confirmed: boolean;
  onConfirm: (confirmed: boolean) => void;
};

// BR-021: chống gõ nhầm, không phải đánh giá lâm sàng — lời lẽ trung tính, không "cao/thấp/bất thường" (BR-033).
export function OutOfRangeConfirm({ fields, confirmed, onConfirm }: OutOfRangeConfirmProps) {
  const names = fields.map((field) => FIELD_LABELS[field] ?? field).join(', ');
  return (
    <div role="alert" className="flex gap-3 rounded-2xl bg-[#fff4e5] p-4 text-[#5c3a00]">
      <span aria-hidden="true" className="mt-0.5 shrink-0">
        <DocumentIcon name="warning" />
      </span>
      <div className="flex flex-col gap-3 text-sm leading-6">
        <p>
          Số <strong>{names}</strong> nằm ngoài khoảng giá trị máy đo thường ghi nhận. Vui lòng đối chiếu lại
          với ảnh — có thể do gõ nhầm hoặc AI đọc sai chữ số.
        </p>
        <label className="flex min-h-11 cursor-pointer items-center gap-3 font-medium">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(event) => onConfirm(event.target.checked)}
            className="h-5 w-5 accent-[#004135]"
          />
          Tôi đã đối chiếu với ảnh, số đo đúng như trên máy
        </label>
      </div>
    </div>
  );
}
