import type { BodyLocation } from '../../application/regionFromNodeName';
import { describeBodyLocation } from '../BodyMap2D/describeBodyLocation';

type RegionListOptionProps = {
  location: BodyLocation;
  name: string;
  checked: boolean;
  onSelect: (location: BodyLocation) => void;
};

export function RegionListOption({ location, name, checked, onSelect }: RegionListOptionProps) {
  const label = describeBodyLocation(location);
  return (
    <label
      className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 ${checked ? 'border-accent bg-accent-soft' : 'border-border bg-surface'}`}
    >
      <input
        type="radio"
        name={name}
        value={`${location.region}/${location.side}`}
        aria-label={label}
        checked={checked}
        onChange={() => onSelect(location)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            onSelect(location);
          }
        }}
        className="size-5 shrink-0 accent-accent focus:outline-2 focus:outline-offset-2 focus:outline-accent"
      />
      <span>{label}</span>
    </label>
  );
}
