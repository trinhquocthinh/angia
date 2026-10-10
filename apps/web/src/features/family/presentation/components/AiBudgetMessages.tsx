import { AdminRequestError } from '../../application/AdminRequestError';

export function AiBudgetMessages({
  invalid,
  saved,
  error,
}: {
  invalid: boolean;
  saved: boolean;
  error: Error | null;
}) {
  return (
    <>
      {invalid && (
        <p role="alert" className="admin-hint m-0 text-[#93000a]">
          Nhập số từ 0 đến 100, tối đa 2 chữ số thập phân.
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="rounded-[12px] py-3 px-4 m-0 text-[13px] leading-[20px] text-[#93000a] bg-[#ffdad6]"
        >
          {error instanceof AdminRequestError ? error.message : 'Không thể kết nối. Vui lòng thử lại.'}
        </p>
      )}
      {saved && !invalid && (
        <p role="status" className="admin-hint m-0 text-[#286958]">
          Đã lưu trần mới.
        </p>
      )}
    </>
  );
}
