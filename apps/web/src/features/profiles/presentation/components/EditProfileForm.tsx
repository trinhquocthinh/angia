import { EditProfileFields } from './EditProfileFields';
import type { ComponentProps } from 'react';
type Props = ComponentProps<typeof EditProfileFields> & {
  pending: boolean;
  error: string | null;
  onSubmit: () => void;
  onClose: () => void;
};
export function EditProfileForm({ pending, error, onSubmit, onClose, ...fields }: Props) {
  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (!pending) onSubmit();
      }}
      className="p-6 sm:p-8"
    >
      <h2 id="edit-profile-title" className="auth-heading text-2xl font-semibold">
        Sửa hồ sơ
      </h2>
      <p id="edit-profile-description" className="mt-2 mb-6 text-sm text-[#55615f]">
        Cập nhật năm sinh và lựa chọn theo dõi huyết áp, đường huyết.
      </p>
      <fieldset disabled={pending} className="space-y-6">
        <EditProfileFields {...fields} />
        {error && (
          <p role="alert" className="text-sm text-[#b42318]">
            {error}
          </p>
        )}
        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 cursor-pointer rounded-xl bg-[#eaf6f5] px-5 text-sm font-semibold"
          >
            Hủy
          </button>
          <button
            type="submit"
            className="min-h-11 cursor-pointer rounded-xl bg-[#004135] px-5 text-sm font-semibold text-white disabled:opacity-55"
          >
            {pending ? 'Đang lưu…' : 'Lưu thay đổi'}
          </button>
        </div>
      </fieldset>
    </form>
  );
}
