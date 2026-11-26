import { bodyRegions } from '@angia/contracts';
import { useId } from 'react';
import type { BodyLocation } from '../../application/regionFromNodeName';
import { regionGroups } from './regionGroups';
import { RegionListOption } from './RegionListOption';

type RegionListProps = {
  selected: BodyLocation | null;
  onSelect: (location: BodyLocation) => void;
};

export function RegionList({ selected, onSelect }: RegionListProps) {
  const name = useId();
  return (
    <fieldset
      className="min-w-0 space-y-4 text-text-primary"
      onKeyDown={(event) => {
        const direction = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[event.key];
        if (!direction || !(event.target instanceof HTMLInputElement)) return;
        event.preventDefault();
        const radios = [...event.currentTarget.querySelectorAll<HTMLInputElement>('input[type="radio"]')];
        const index = radios.indexOf(event.target);
        const next = radios[(index + direction + radios.length) % radios.length];
        next?.focus();
        next?.click();
      }}
    >
      <legend className="mb-3 text-body font-semibold text-accent">Chọn vùng cơ thể</legend>
      {regionGroups.map((group) => (
        <div
          key={group.label}
          role="group"
          aria-label={group.label}
          className="space-y-2.5 rounded-2xl border border-border/35 bg-bg p-3.5"
        >
          <h3 className="text-caption font-semibold text-text-secondary">{group.label}</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {group.regions.flatMap((region) =>
              bodyRegions[region].sides.map((side) => (
                <RegionListOption
                  key={`${region}/${side}`}
                  location={{ region, side }}
                  name={name}
                  checked={selected?.region === region && selected.side === side}
                  onSelect={onSelect}
                />
              )),
            )}
          </div>
        </div>
      ))}
    </fieldset>
  );
}
