import type { CourseConflict } from '@angia/contracts';
import type { CourseChoices } from '../application/resolveCoursePrompt';
import { doseSlotLabel } from '@src/features/documents/application/doseSlots';
import { doseLabel } from '../application/doseLabel';

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
  onChange: (value: 'replace' | 'parallel') => void;
};

export function CourseConflictGroup({ conflict, request, choice, pending, onChange }: Props) {
  return (
    <fieldset disabled={pending} className="min-w-0 rounded-xl border border-[#ffb68c] p-4">
      <legend className="px-1 font-semibold">
        Dòng {conflict.itemIndexes.map((i) => i + 1).join(', ')} ·{' '}
        {request.data.items[conflict.itemIndexes[0]!]!.name}
      </legend>
      <p className="mb-2">Đợt mới từ {request.data.issuedDate}:</p>
      <ul className="mb-3 list-inside list-disc">
        {conflict.itemIndexes.map((index) => {
          const item = request.data.items[index]!;
          return (
            <li key={index}>
              Dòng {index + 1}: {item.name} {item.strength} · {doseLabel(item.quantityPerDose, item.doseUnit)}{' '}
              · {item.slots.map(doseSlotLabel).join(', ')}
            </li>
          );
        })}
      </ul>
      <p className="font-semibold">
        {conflict.courses.length > 0
          ? 'Các đợt đang có hiệu lực:'
          : 'Danh sách đã thay đổi: hiện không còn đợt trùng tên có hiệu lực.'}
      </p>
      <ul className="my-2 flex flex-col gap-2">
        {conflict.courses.map((course) => (
          <li key={course.id} className="rounded-lg bg-white/70 p-3">
            <strong>
              {course.name} {course.strength}
            </strong>{' '}
            · {doseLabel(course.quantityPerDose, course.doseUnit)} ·{' '}
            {course.slots.map(doseSlotLabel).join(', ')}
            <div>
              Từ {course.startDate} · {course.endDate ? `đến ${course.endDate}` : 'Dài hạn'}
            </div>
          </li>
        ))}
      </ul>
      <p className="mb-3 text-xs leading-5">
        Thay thế đóng tất cả đợt trên vào ngày trước đợt mới. Dùng song song giữ nguyên tất cả đợt trên.
      </p>
      <div className="flex flex-wrap gap-3">
        {(['replace', 'parallel'] as const).map((value) => (
          <label
            key={value}
            className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-[#602900] bg-white/70 px-3"
          >
            <input
              type="radio"
              name={`course-resolution-${conflict.nameNormalized}`}
              checked={choice === value}
              onChange={() => onChange(value)}
            />
            {value === 'replace' ? 'Thay thế' : 'Dùng song song'}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
