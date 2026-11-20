import { TimedToast } from '@src/shared/ui/TimedToast';

export function GuardianToast(props: { message: string; sequence: number }) {
  return <TimedToast {...props} className="profile-guardians-toast" />;
}
