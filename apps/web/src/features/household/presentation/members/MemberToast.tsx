import { TimedToast } from '@src/shared/ui/TimedToast';
import './member-toast.css';

export function MemberToast(props: { message: string; sequence: number }) {
  return <TimedToast {...props} className="household-members-toast" />;
}
