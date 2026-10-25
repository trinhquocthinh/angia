import type { RowErrorSummary as RowError } from '../../application/rowErrors';
import { DocumentIcon } from './DocumentIcon';

type RowErrorSummaryProps = {
  rows: RowError[];
  // Tên loại dòng trong câu tóm tắt ("dòng thuốc", "chỉ số") và tiền tố id khối dòng để nhảy tới.
  noun: string;
  anchorPrefix: string;
};

// Chỉ rõ dòng nào còn thiếu thông tin (BR-025, SPEC-010); bấm để nhảy tới dòng đó.
export function RowErrorSummary({ rows, noun, anchorPrefix }: RowErrorSummaryProps) {
  if (rows.length === 0) return null;
  return (
    <div role="alert" className="flex gap-3 rounded-2xl bg-[#fdecea] p-4 text-sm text-[#7a1b12]">
      <span aria-hidden="true" className="mt-0.5 shrink-0 text-[#b42318]">
        <DocumentIcon name="warning" />
      </span>
      <div className="flex flex-col gap-2">
        <p className="font-semibold">
          Còn {rows.length} {noun} thiếu thông tin:
        </p>
        <ul className="flex flex-col gap-1.5">
          {rows.map((row) => (
            <li key={row.index}>
              <a
                href={`#${anchorPrefix}-${row.index}`}
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
