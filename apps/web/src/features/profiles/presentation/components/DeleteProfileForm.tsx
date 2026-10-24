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
      <h2 id="delete-profile-title" className="auth-heading text-2xl font-semibold text-[#912018]">
        Xóa hồ sơ {name}
      </h2>
      <p id="delete-profile-description" className="text-sm text-[#55615f]">
        Toàn bộ chứng từ, ảnh, đơn thuốc, xét nghiệm, số đo và lời nhắc của hồ sơ này sẽ bị xóa vĩnh viễn và
        không thể khôi phục.
      </p>
      <label className="flex flex-col gap-2 text-sm font-medium">
        Nhập lại chính xác tên hồ sơ
        <input
          className="min-h-[52px] rounded-xl border border-[#c1c8c5] px-4 text-base"
          value={value}
          autoComplete="off"
          aria-invalid={mismatch}
          disabled={pending}
          onChange={(event) => props.onChange(event.target.value)}
        />
      </label>
      {message && (
        <p role="alert" className="text-sm font-medium text-[#b42318]">
          {message}
        </p>
      )}
      <button
        type="submit"
        disabled={!value || pending}
        className="inline-flex min-h-[52px] items-center justify-center rounded-xl bg-[#b42318] px-5 py-3 text-[17px] font-semibold text-white cursor-pointer hover:bg-[#912018] disabled:bg-[#e4e0da] disabled:text-[#55615f] disabled:cursor-default"
      >
        {pending ? 'Đang xóa triệt để...' : 'Xóa hồ sơ'}
      </button>
      <button
        type="button"
        disabled={pending}
        className="min-h-[52px] rounded-xl px-5 text-sm font-semibold text-[#004135] cursor-pointer disabled:opacity-55"
        onClick={props.onCancel}
      >
        Hủy
      </button>
    </form>
  );
}
