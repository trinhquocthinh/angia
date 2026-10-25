export function ReviewNotice({ title, body }: { title: string; body: string }) {
  return (
    <section className="flex flex-col gap-2 rounded-[20px] bg-white p-6">
      <h2 className="text-lg font-semibold text-[#004135]">{title}</h2>
      <p className="text-sm leading-6 text-[#55615f]">{body}</p>
    </section>
  );
}
