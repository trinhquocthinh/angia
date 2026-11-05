import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';

// Nút gửi ghim ở đáy vùng cuộn của hộp thoại.
export function NewProfileSubmit({ disabled, pending }: { disabled: boolean; pending: boolean }) {
  return (
    <div className="sticky bottom-0 -mx-6 border-t border-[#e4f0f0] bg-white px-6 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] max-md:-mx-5 max-md:px-5">
      <button
        type="submit"
        disabled={disabled}
        className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-xl bg-[#004135] px-5 py-3 text-center text-sm font-semibold text-white shadow-md cursor-pointer disabled:opacity-55 disabled:cursor-default focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#286958] w-full"
      >
        <AdminIcon name="person_add" />
        {pending ? 'Đang lưu…' : 'Tạo hồ sơ'}
      </button>
    </div>
  );
}
