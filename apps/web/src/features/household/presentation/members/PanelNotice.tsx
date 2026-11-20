import { Button } from '@src/shared/ui/button/Button';

export function PanelNotice({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <section className="household-member-panel household-member-panel-notice" role="status">
      <p>{message}</p>
      <Button variant="secondary" onClick={onClose}>
        Đóng
      </Button>
    </section>
  );
}
