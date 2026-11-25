export function ReviewNotice({ title, body }: { title: string; body: string }) {
  return (
    <section className="flex flex-col gap-2 rounded-[20px] bg-surface p-6 shadow-card">
      <h2 className="text-heading-2 font-semibold text-accent">{title}</h2>
      <p className="text-caption text-text-secondary">{body}</p>
    </section>
  );
}
