import { useId, useState } from 'react';
import { setCourseIntervalRequestSchema } from '@angia/contracts';
import { SidePanelFooter } from '@src/shared/ui/SidePanelFooter';

type Props = {
  initialText: string;
  pending: boolean;
  error: string | null;
  onSubmit: (text: string | null) => void;
  onCancel: () => void;
};
export function CourseIntervalForm({ initialText, pending, error, onSubmit, onCancel }: Props) {
  const id = useId();
  const [text, setText] = useState(initialText);
  const [invalid, setInvalid] = useState(false);
  return (
    <form
      className="flex flex-1 flex-col"
      onSubmit={(event) => {
        event.preventDefault();
        const parsed = setCourseIntervalRequestSchema.safeParse({ text: text.trim() || null });
        setInvalid(!parsed.success);
        if (parsed.success && !pending) onSubmit(parsed.data.text);
      }}
    >
      <fieldset disabled={pending} className="flex flex-col gap-3 border-0 px-6 py-5">
        <label htmlFor={id} className="text-sm font-semibold">
          Khoảng cách theo nhãn thuốc · Do người dùng nhập
        </label>
        <input
          id={id}
          value={text}
          onChange={(event) => setText(event.target.value)}
          maxLength={100}
          aria-invalid={invalid}
          aria-describedby={`${id}-hint`}
          className="min-h-12 w-full rounded-xl border border-border px-3 text-sm focus-visible:outline-2 focus-visible:outline-focus"
        />
        <p id={`${id}-hint`} className="text-xs text-text-secondary">
          Tối đa 100 ký tự. Để trống để xóa khoảng cách tự nhập.
        </p>
        {(invalid || error) && (
          <p role="alert" className="text-sm text-danger">
            {invalid ? 'Khoảng cách tối đa 100 ký tự.' : error}
          </p>
        )}
      </fieldset>
      <SidePanelFooter
        submitLabel={pending ? 'Đang lưu…' : 'Lưu khoảng cách'}
        cancelLabel="Hủy bỏ"
        disabled={pending}
        submit
        cancelDisabled={pending}
        onCancel={onCancel}
      />
    </form>
  );
}
