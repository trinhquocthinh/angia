import { DocumentIcon } from './DocumentIcon';

export function ReviewNotice({ title, body }: { title: string; body: string }) {
  return (
    <section className="doc-bento-card mx-auto flex w-full max-w-2xl items-start gap-4 rounded-3xl p-6">
      <span className="doc-clay-tile text-accent">
        <DocumentIcon name="file" size={22} />
      </span>
      <div className="flex min-w-0 flex-col gap-1.5">
        <h2 className="auth-heading text-heading-2 font-semibold text-accent">{title}</h2>
        <p className="text-caption leading-relaxed text-text-secondary">{body}</p>
      </div>
    </section>
  );
}
