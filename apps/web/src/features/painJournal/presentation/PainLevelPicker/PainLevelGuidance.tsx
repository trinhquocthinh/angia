// Hướng dẫn tĩnh owner duyệt theo MEDLATEC; ngoại lệ nhập liệu của BR-063 (không màu/nhãn đánh giá).
export function PainLevelGuidance({ id }: { id: string }) {
  return (
    <div
      id={id}
      data-pain-level-guidance
      className="space-y-2.5 rounded-2xl border border-border/35 bg-bg p-3.5 text-caption text-text-secondary"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-1">
        <h3 className="font-semibold text-text-primary">Hướng dẫn chọn mức đau</h3>
        <p>Chọn theo cảm nhận của chính bạn lúc này.</p>
      </div>
      <dl className="grid gap-2 sm:grid-cols-3">
        <div className="rounded-xl border border-border/25 bg-surface p-2.5">
          <dt className="font-semibold text-text-primary">1–3 · Đau nhẹ</dt>
          <dd className="mt-0.5">Cảm giác đau ít, vẫn dễ chịu đựng; sinh hoạt ít bị ảnh hưởng.</dd>
        </div>
        <div className="rounded-xl border border-border/25 bg-surface p-2.5">
          <dt className="font-semibold text-text-primary">4–6 · Đau trung bình</dt>
          <dd className="mt-0.5">Cảm giác đau rõ, gây khó chịu; có thể ảnh hưởng công việc hoặc giấc ngủ.</dd>
        </div>
        <div className="rounded-xl border border-border/25 bg-surface p-2.5">
          <dt className="font-semibold text-text-primary">7–10 · Đau nặng</dt>
          <dd className="mt-0.5">Cảm giác đau dữ dội, khó chịu đựng; sinh hoạt bị ảnh hưởng nhiều.</dd>
        </div>
      </dl>
      <p>
        <strong className="text-text-primary">10:</strong> Đau dữ dội nhất bạn có thể hình dung.
      </p>
    </div>
  );
}
