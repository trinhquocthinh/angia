import { useId } from 'react';

type Props = { title: string; icon: 'how_to_reg' | 'vpn_key' | 'analytics' | 'history' };
export function RegistrationCardHeading({ title, icon }: Props) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 id={id} className="m-0 auth-heading text-heading-2">
        {title}
      </h2>
      <span
        className="flex size-12 shrink-0 items-center justify-center rounded-full border border-border/45 bg-bg text-accent"
        aria-hidden="true"
      >
        <img
          src={`/images/household/stitch/admin-${icon}.svg`}
          className="size-6 [html[data-theme=dark]_&]:invert"
          width="24"
          height="24"
          alt=""
        />
      </span>
    </div>
  );
}
