import type { ReactNode } from 'react';
import { DocumentIcon, type DocumentIconName } from './DocumentIcon';
export function PickerCard({
  icon,
  title,
  hint,
  required = false,
  children,
}: {
  icon: DocumentIconName;
  title: string;
  hint: string;
  /** Bắt buộc: nhãn đỏ nhạt; gợi ý: chữ xám (Stitch dc9c5a6d). */
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <legend className="contents">
          <span className="flex items-center gap-1.5 text-lg leading-6 font-semibold text-[#131d1d]">
            <span className="text-[#286958]">
              <DocumentIcon name={icon} />
            </span>
            {title}
          </span>
        </legend>
        <span
          className={`text-[11px] font-medium ${
            required ? 'rounded-full bg-[#ffdad6]/60 px-2 py-0.5 text-[#93000a]' : 'text-[#55615f]'
          }`}
        >
          {hint}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}
