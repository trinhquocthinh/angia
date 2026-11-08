// Hướng dẫn tĩnh owner duyệt theo MEDLATEC; ngoại lệ nhập liệu của BR-063.
export function PainLevelGuidance({ id }: { id: string }) {
  return (
    <div id={id} data-pain-level-guidance className="space-y-2 text-sm text-text-secondary">
      <h3 className="font-medium text-text-primary">Hướng dẫn chọn mức đau</h3>
      <p>Chọn theo cảm nhận của chính bạn lúc này.</p>
      <dl className="space-y-2">
        <div>
          <dt className="font-medium text-text-primary">1–3 · Đau nhẹ</dt>
          <dd>Cảm giác đau ít, vẫn dễ chịu đựng; sinh hoạt ít bị ảnh hưởng.</dd>
        </div>
        <div>
          <dt className="font-medium text-text-primary">4–6 · Đau trung bình</dt>
          <dd>Cảm giác đau rõ, gây khó chịu; có thể ảnh hưởng công việc hoặc giấc ngủ.</dd>
        </div>
        <div>
          <dt className="font-medium text-text-primary">7–10 · Đau nặng</dt>
          <dd>Cảm giác đau dữ dội, khó chịu đựng; sinh hoạt bị ảnh hưởng nhiều.</dd>
        </div>
      </dl>
      <p>
        <strong>10:</strong> Đau dữ dội nhất bạn có thể hình dung.
      </p>
    </div>
  );
}
