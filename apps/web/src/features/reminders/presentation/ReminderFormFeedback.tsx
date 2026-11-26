import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';

type Props = {
  errorId: string;
  error: string | null;
  done: boolean;
  successText: string;
};

export function ReminderFormFeedback({ errorId, error, done, successText }: Props) {
  if (error) {
    return (
      <div className="reminder-callout reminder-callout-danger text-body font-medium">
        <AdminIcon name="info" size={20} />
        <p id={errorId} role="alert">
          {error}
        </p>
      </div>
    );
  }
  if (!done) return null;
  return (
    <div className="reminder-callout reminder-callout-success text-body font-medium">
      <AdminIcon name="check_circle" size={20} />
      <p role="status">{successText}</p>
    </div>
  );
}
