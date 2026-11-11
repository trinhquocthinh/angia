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
        <p role="alert" className="admin-hint m-0 text-danger">
          Nhập số từ 0 đến 100, tối đa 2 chữ số thập phân.
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="rounded-[12px] py-3 px-4 m-0 text-[13px] leading-[20px] text-danger bg-danger-soft"
        >
          {error instanceof AdminRequestError ? error.message : 'Không thể kết nối. Vui lòng thử lại.'}
        </p>
      )}
      {saved && !invalid && (
        <p role="status" className="admin-hint m-0 text-accent">
          Đã lưu trần mới.
        </p>
      )}
    </>
  );
}
