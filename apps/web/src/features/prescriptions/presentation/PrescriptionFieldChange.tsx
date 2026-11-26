import type { PrescriptionDiff } from '@angia/contracts';
import { prescriptionChangeText } from '../application/prescriptionChangeText';
import { PrescriptionItems } from './PrescriptionItems';

type Change = PrescriptionDiff['changed'][number]['changes'][number];
export function PrescriptionFieldChange({ change }: { change: Change }) {
  const text = change.field === 'lines' ? null : prescriptionChangeText(change);
  return (
    <div className="mt-3">
      <h5 className="text-caption font-semibold text-text-secondary">
        {text?.label ?? 'Các dòng cùng tên trên đơn'}
      </h5>
      <div className="mt-2 grid min-w-0 gap-3 md:grid-cols-2">
        {(['before', 'after'] as const).map((side) => (
          <div key={side} className="min-w-0 rounded-2xl border border-border/35 bg-bg p-3.5 break-words">
            <p className="mb-1.5 text-caption font-semibold text-text-secondary">
              {side === 'before' ? 'Trước' : 'Sau'}
            </p>
            {change.field === 'lines' ? (
              <PrescriptionItems items={change[side]} />
            ) : (
              <p className="whitespace-pre-wrap text-body font-medium text-text-primary">{text?.[side]}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
