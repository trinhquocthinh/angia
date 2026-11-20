import type { HomeActionOutcome } from '../../application/householdHomePorts';

export function runAndToast(
  task: Promise<HomeActionOutcome>,
  onOk: () => Promise<void>,
  showToast: (message: string) => void,
  message: string,
) {
  void task.then(async (outcome) => {
    if (outcome.status !== 'ok') return;
    await onOk();
    showToast(message);
  });
}
