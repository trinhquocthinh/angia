import type { PrescriptionDiff } from '@angia/contracts';
import { prescriptionChangeText } from '../application/prescriptionChangeText';
import { PrescriptionItems } from './PrescriptionItems';

type Change = PrescriptionDiff['changed'][number]['changes'][number];
export function PrescriptionFieldChange({ change }: { change: Change }) {
  const text = change.field === 'lines' ? null : prescriptionChangeText(change);
  return (
    <div className="mt-3">
      <h5 className="text-sm font-semibold">{text?.label ?? 'Các dòng cùng tên trên đơn'}</h5>
      <div className="mt-2 grid min-w-0 gap-3 md:grid-cols-2">
        {(['before', 'after'] as const).map((side) => (
          <div key={side} className="min-w-0 rounded-xl bg-[#f0f7f5] p-3 break-words">
            <p className="mb-2 text-sm font-semibold text-[#55615f]">{side === 'before' ? 'Trước' : 'Sau'}</p>
            {change.field === 'lines' ? (
              <PrescriptionItems items={change[side]} />
            ) : (
              <p className="whitespace-pre-wrap text-sm">{text?.[side]}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
