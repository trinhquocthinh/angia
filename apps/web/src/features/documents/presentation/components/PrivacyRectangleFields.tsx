import type { PrivacyRectangle } from '@angia/contracts';
import { privacySetRectangle } from '../../application/privacySetRectangle';
type Props = {
  label: string;
  rectangle: PrivacyRectangle;
  disabled: boolean;
  onChange: (rectangle: PrivacyRectangle) => void;
};
const fields: [keyof PrivacyRectangle, string][] = [
  ['left', 'Trái'],
  ['top', 'Trên'],
  ['width', 'Rộng'],
  ['height', 'Cao'],
];
export function PrivacyRectangleFields({ label, rectangle, disabled, onChange }: Props) {
  return (
    <fieldset disabled={disabled} className="grid grid-cols-2 gap-2 rounded-xl bg-[#f6f9f8] p-3">
      <legend className="text-sm font-medium text-[#004135]">{label} (% ảnh)</legend>
      {fields.map(([field, title]) => (
        <label key={field} className="flex flex-col gap-1 text-xs text-[#55615f]">
          {title}
          <input
            type="number"
            aria-label={`${label} — ${title}`}
            min={field === 'width' || field === 'height' ? 0.0001 : 0}
            max={100}
            step={0.1}
            value={Number((rectangle[field] / 10000).toFixed(4))}
            onChange={(event) => {
              if (event.target.value !== '')
                onChange(privacySetRectangle(rectangle, field, event.target.valueAsNumber * 10000));
            }}
            className="min-h-11 w-full rounded-lg border border-[#d6e5df] bg-white px-2 text-sm text-[#004135] focus-visible:outline-2 focus-visible:outline-[#286958]"
          />
        </label>
      ))}
    </fieldset>
  );
}
