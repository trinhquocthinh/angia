import type { FormEvent } from 'react';
type DeleteProfileFormProps = {
  name: string;
  value: string;
  pending: boolean;
  mismatch: boolean;
  failure: string | null;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
};
// Tiêu chí 09 "Xóa hồ sơ (v0.1b)": nhập lại chính xác tên, nút đỏ nguy hiểm, trạng thái đang xóa, lỗi không khớp.
export function DeleteProfileForm(props: DeleteProfileFormProps) {
  const { name, value, pending, mismatch, failure } = props;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (value && !pending) props.onSubmit();
  };
  const message = mismatch ? 'Tên nhập lại không khớp' : failure;
  return (
    <form className="flex flex-col gap-5 p-6" onSubmit={submit}>
      <h2 id="delete-profile-title" className="auth-heading text-2xl font-semibold text-danger">
        Xóa hồ sơ {name}
      </h2>
      <p id="delete-profile-description" className="text-sm text-text-secondary">
        Toàn bộ chứng từ, ảnh, đơn thuốc, xét nghiệm, số đo và lời nhắc của hồ sơ này sẽ bị xóa vĩnh viễn và
        không thể khôi phục.
      </p>
      <label className="flex flex-col gap-2 text-sm font-medium">
        Nhập lại chính xác tên hồ sơ
        <input
          className="min-h-[52px] rounded-xl border border-border px-4 text-base"
          value={value}
          autoComplete="off"
          aria-invalid={mismatch}
          disabled={pending}
          onChange={(event) => props.onChange(event.target.value)}
        />
      </label>
      {message && (
        <p role="alert" className="text-sm font-medium text-danger">
          {message}
        </p>
      )}
      <button
        type="submit"
        disabled={!value || pending}
        className="inline-flex min-h-[52px] items-center justify-center rounded-xl bg-danger px-5 py-3 text-[17px] font-semibold text-on-accent cursor-pointer hover:bg-danger disabled:bg-border disabled:text-text-secondary disabled:cursor-default"
      >
        {pending ? 'Đang xóa triệt để...' : 'Xóa hồ sơ'}
      </button>
      <button
        type="button"
        disabled={pending}
        className="min-h-[52px] rounded-xl px-5 text-sm font-semibold text-accent cursor-pointer disabled:opacity-55"
        onClick={props.onCancel}
      >
        Hủy
      </button>
    </form>
  );
}
