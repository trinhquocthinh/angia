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
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-accent/30 bg-accent-soft/75 px-4 py-3">
          <p className="text-body font-semibold text-accent">{describeBodyLocation(selected)}</p>
          <button
            type="button"
            className="inline-flex min-h-11 cursor-pointer items-center rounded-xl border border-border/45 bg-surface px-3.5 text-caption font-semibold text-accent transition-colors hover:bg-accent-soft"
            onClick={onChangeRegion}
          >
            Đổi vùng
          </button>
        </div>
        <label className="flex flex-col gap-1.5 text-caption font-semibold text-text-secondary">
          Tên ngắn (tùy chọn)
          <input
            type="text"
            maxLength={60}
            placeholder="Ví dụ: Đau khi leo cầu thang"
            value={values.title}
            onChange={(event) => onChange({ title: event.target.value })}
            className="min-h-12 rounded-2xl border border-border/55 bg-bg px-3.5 text-body font-normal text-text-primary focus:border-accent focus:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-focus/20"
          />
        </label>
        <FirstPainEntryFields values={values} onChange={onChange} />
      </div>
    </div>
  );
}
