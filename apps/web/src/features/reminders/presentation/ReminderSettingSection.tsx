import type { ReactNode } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';

type Props<T> = {
  title: string;
  query: UseQueryResult<T>;
  loadingText: string;
  children: (data: T) => ReactNode;
};

// Một mục cấu hình nhắc thuốc trên trang /profiles/:id/reminders: tiêu đề, trạng thái tải/lỗi kèm thử lại.
export function ReminderSettingSection<T>({ title, query, loadingText, children }: Props<T>) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
      {query.isPending ? (
        <p className="rounded-xl bg-surface p-6 text-sm text-text-secondary">{loadingText}</p>
      ) : query.isError ? (
        <p role="alert" className="rounded-xl bg-surface p-6 text-sm">
          {query.error.message}{' '}
          <button
            type="button"
            className="font-semibold text-accent underline"
            onClick={() => void query.refetch()}
          >
            Thử lại
          </button>
        </p>
      ) : (
        children(query.data)
      )}
    </section>
  );
}
