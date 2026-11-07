import { BodyMap2D } from '../BodyMap2D/BodyMap2D';
import type { BodyLocation } from '@angia/contracts';
import type { FirstEntryFieldsProps } from './newPainIssueTypes';
import { describeBodyLocation } from '../BodyMap2D/describeBodyLocation';
import { FirstPainEntryFields } from './FirstPainEntryFields';
type Props = FirstEntryFieldsProps & {
  selected: BodyLocation;
  onChangeRegion: () => void;
  onSelect: (location: BodyLocation) => void;
};
export function NewPainIssueEntryStep({ selected, values, onChange, onChangeRegion, onSelect }: Props) {
  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-2">
      <div className="hidden lg:block">
        <BodyMap2D selected={selected} onSelect={onSelect} />
      </div>
      <div className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-medium">{describeBodyLocation(selected)}</p>
          <button type="button" className="min-h-11 underline" onClick={onChangeRegion}>
            Đổi vùng
          </button>
        </div>
        <label className="flex flex-col gap-2 text-sm">
          Tên ngắn (tùy chọn)
          <input
            type="text"
            maxLength={60}
            value={values.title}
            onChange={(event) => onChange({ title: event.target.value })}
            className="min-h-11 rounded-xl border border-border px-3"
          />
        </label>
        <FirstPainEntryFields values={values} onChange={onChange} />
      </div>
    </div>
  );
}
