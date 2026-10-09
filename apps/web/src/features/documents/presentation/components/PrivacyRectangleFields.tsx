import { useId, useState } from 'react';
import type { PrivacyRectangle } from '@angia/contracts';
import { privacyRectangleInput } from '../../application/privacyRectangleInput';
import { PrivacyCoordinateInput } from './PrivacyCoordinateInput';
import { PrivacyCoordinateHint } from './PrivacyCoordinateHint';
type Props = {
  label: string;
  rectangle: PrivacyRectangle;
  kind?: 'crop' | 'mask';
  disabled: boolean;
  onChange: (rectangle: PrivacyRectangle) => void;
  onBegin?: () => void;
  onPendingChange?: (pending: boolean) => void;
};
const fields: [keyof PrivacyRectangle, string][] = [
  ['left', 'Trái'],
  ['top', 'Trên'],
  ['width', 'Rộng'],
  ['height', 'Cao'],
];
const valuesOf = (rect: PrivacyRectangle) =>
  Object.fromEntries(
    fields.map(([field]) => [field, String(Number((rect[field] / 10000).toFixed(4)))]),
  ) as Record<keyof PrivacyRectangle, string>;
export function PrivacyRectangleFields({
  label,
  rectangle,
  kind = 'crop',
  disabled,
  onChange,
  onBegin,
  onPendingChange,
}: Props) {
  const [values, setValues] = useState(() => valuesOf(rectangle));
  const [dirty, setDirty] = useState<keyof PrivacyRectangle | null>(null);
  const [error, setError] = useState<keyof PrivacyRectangle | null>(null);
  const errorId = useId();
  const cancel = () => {
    setValues(valuesOf(rectangle));
    setDirty(null);
    setError(null);
    onPendingChange?.(false);
  };
  const commit = (field: keyof PrivacyRectangle) => {
    if (dirty !== field) return;
    const next = privacyRectangleInput(rectangle, field, values[field], kind);
    if (!next) {
      setError(field);
      return;
    }
    setValues(valuesOf(next));
    setDirty(null);
    setError(null);
    onPendingChange?.(false);
    onChange(next);
  };
  return (
    <fieldset disabled={disabled} className="grid grid-cols-2 gap-2 rounded-xl bg-[#eaf6f5] p-3">
      <legend className="text-xs font-semibold text-[#004135]">Tọa độ vùng (% ảnh)</legend>
      {fields.map(([field, title]) => (
        <PrivacyCoordinateInput
          key={field}
          label={`${label} — ${title}`}
          value={values[field]}
          invalid={error === field}
          disabled={error !== null && error !== field}
          errorId={errorId}
          onChange={(value) => {
            setValues((current) => ({ ...current, [field]: value }));
            setDirty(field);
            setError(null);
            onPendingChange?.(true);
            onBegin?.();
          }}
          onCommit={() => commit(field)}
          onCancel={cancel}
        />
      ))}
      <PrivacyCoordinateHint error={Boolean(error)} errorId={errorId} />
    </fieldset>
  );
}
