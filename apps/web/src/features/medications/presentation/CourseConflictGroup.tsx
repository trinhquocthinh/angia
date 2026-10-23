import type { CourseConflict } from '@angia/contracts';
import type { CourseChoices } from '../application/resolveCoursePrompt';
import { doseSlotLabel } from '@src/features/documents/application/doseSlots';
import { revealStyle } from '@src/shared/ui/revealStyle';
import { doseLabel } from '../application/doseLabel';
import { ActiveCoursesCard } from './ActiveCoursesCard';
import { CourseResolutionOption } from './CourseResolutionOption';

type Props = {
  conflict: CourseConflict;
  request: {
    data: {
      issuedDate: string | null;
      items: readonly {
        name: string;
        strength: string | null;
        quantityPerDose: number | null;
        doseUnit: string | null;
        slots: CourseConflict['courses'][number]['slots'];
      }[];
    };
  };
  choice: CourseChoices[string];
  pending: boolean;
  index: number;
  onChange: (value: 'replace' | 'parallel') => void;
};

// Một nhóm trùng tên: thẻ "Đợt mới" cạnh thẻ "Các đợt đang có hiệu lực" (liệt kê đủ), rồi hai lựa chọn.
export function CourseConflictGroup({ conflict, request, choice, pending, index, onChange }: Props) {
  return (
    <fieldset
      disabled={pending}
      className="angia-modal-reveal min-w-0 rounded-2xl bg-white p-4 shadow-[0_2px_12px_#0041350f] ring-1 ring-[#e4f0f0]"
      style={revealStyle(index)}
    >
      <legend className="float-left mb-3 flex w-full items-center gap-2 text-base font-semibold text-[#131d1d]">
        <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-[#20594b]" />
        Dòng {conflict.itemIndexes.map((i) => i + 1).join(', ')} ·{' '}
        {request.data.items[conflict.itemIndexes[0]!]!.name}
      </legend>
      <div className="clear-both grid gap-3 md:grid-cols-2">
        <div className="rounded-xl bg-[#e3efea] p-3.5">
          <p className="text-xs font-semibold text-[#20594b]">Đợt mới từ {request.data.issuedDate}</p>
          <ul className="mt-1.5 flex flex-col gap-1.5">
            {conflict.itemIndexes.map((itemIndex) => {
              const item = request.data.items[itemIndex]!;
              return (
                <li key={itemIndex}>
                  <strong className="font-semibold">
                    Dòng {itemIndex + 1}: {item.name} {item.strength}
                  </strong>
                  <span className="block text-[13px] text-[#404945]">
                    {doseLabel(item.quantityPerDose, item.doseUnit)} ·{' '}
                    {item.slots.map(doseSlotLabel).join(', ')}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
        <ActiveCoursesCard courses={conflict.courses} />
      </div>
      <div className="mt-3 grid gap-2.5">
        {(['replace', 'parallel'] as const).map((value) => (
          <CourseResolutionOption
            key={value}
            name={`course-resolution-${conflict.nameNormalized}`}
            value={value}
            checked={choice === value}
            onChange={() => onChange(value)}
          />
        ))}
      </div>
    </fieldset>
  );
}
