import type { HomeDialogShellProps } from './HomeDialogShell';
import { HomeClayGlyph } from './HomeClayGlyph';

export function HomeDialogHeading(props: HomeDialogShellProps & { titleId: string }) {
  return (
    <div className="household-home-dialog-head">
      <div className="household-home-dialog-title-wrap">
        <span className="household-home-dialog-icon" aria-hidden="true">
          <HomeClayGlyph name={props.iconName} size={20} />
        </span>
        <h3 id={props.titleId}>{props.title}</h3>
      </div>
      <button
        type="button"
        className="household-home-dialog-close"
        aria-label={props.closeLabel}
        disabled={props.pending}
        onClick={props.onClose}
      >
        <HomeClayGlyph name="home-close" size={18} />
      </button>
    </div>
  );
}
