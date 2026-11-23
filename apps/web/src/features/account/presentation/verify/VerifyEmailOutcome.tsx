import { useEffect, useRef, type ReactNode } from 'react';

type Props = {
  badge: ReactNode;
  title: string;
  body: ReactNode;
  actions: ReactNode;
};

export function VerifyEmailOutcome({ badge, title, body, actions }: Props) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, []);
  return (
    <div className="verify-state">
      {badge}
      <h2 id="verify-title" ref={heading} tabIndex={-1} className="verify-title">
        {title}
      </h2>
      {body}
      <div className="verify-actions">{actions}</div>
    </div>
  );
}
