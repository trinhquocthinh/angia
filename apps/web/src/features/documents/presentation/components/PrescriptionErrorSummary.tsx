import type { RowErrorSummary } from '../../application/prescriptionRowErrors';
import { DocumentIcon } from './DocumentIcon';

// BR-025: chỉ rõ dòng thuốc nào còn thiếu liều/buổi/thời gian; bấm để nhảy tới dòng đó.
export function PrescriptionErrorSummary({ rows }: { rows: RowErrorSummary[] }) {
  if (rows.length === 0) return null;
  return (
    <div role="alert" className="flex gap-3 rounded-2xl bg-[#fdecea] p-4 text-sm text-[#7a1b12]">
      <span aria-hidden="true" className="mt-0.5 shrink-0 text-[#b42318]">
        <DocumentIcon name="warning" />
      </span>
      <div className="flex flex-col gap-2">
        <p className="font-semibold">Còn {rows.length} dòng thuốc thiếu thông tin:</p>
        <ul className="flex flex-col gap-1.5">
          {rows.map((row) => (
            <li key={row.index}>
              <a
                href={`#rx-item-${row.index}`}
                className="font-semibold underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b42318]"
              >
                {row.label}
              </a>
              : {row.messages.join(' ')}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
