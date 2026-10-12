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
  /** Bắt buộc: chữ xanh; gợi ý: chữ xám (Stitch a48f7111). */
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-3 rounded-xl bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <legend className="contents">
          <span className="flex items-center gap-1.5 text-base font-bold text-[#131d1d]">
            <span className="text-[#286958]">
              <DocumentIcon name={icon} size={18} />
            </span>
            {title}
          </span>
        </legend>
        <span className={`text-[11px] font-medium ${required ? 'text-[#286958]' : 'text-[#707975]'}`}>
          {hint}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}
