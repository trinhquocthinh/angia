import type { ReactNode } from 'react';
export function InvitationNotice({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h1 className="auth-heading text-heading-1 text-accent">{title}</h1>
      <p className="mt-4 text-body ">{children}</p>
    </section>
  );
}
