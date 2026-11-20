import { MemberClayGlyph } from './MemberClayGlyph';
import { Button } from '@src/shared/ui/button/Button';

export function MemberDangerZone({ disabled, onOpen }: { disabled: boolean; onOpen: () => void }) {
  return (
    <section className="household-member-danger-zone" aria-labelledby="member-danger-heading">
      <div className="household-member-danger-copy">
        <h2 id="member-danger-heading">Gỡ khỏi nhà</h2>
        <p>Người này sẽ không còn xem được dữ liệu của nhà.</p>
      </div>
      <Button
        variant="secondary"
        className="household-member-danger-trigger"
        disabled={disabled}
        onClick={(event) => {
          event.currentTarget.focus();
          onOpen();
        }}
      >
        <MemberClayGlyph name="home-logout-danger" size={20} />
        <span>Gỡ khỏi nhà</span>
      </Button>
    </section>
  );
}
