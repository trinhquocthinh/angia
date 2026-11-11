import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button } from '../src/shared/ui/button/Button';
import { Card } from '../src/shared/ui/card/Card';
import { Field } from '../src/shared/ui/field/Field';
import { ThemeProvider } from '../src/shared/theme/ThemeProvider';
import { FoundationDialog } from './uiFoundationDialog';
import '../src/app/styles.css';

function Harness() {
  const [open, setOpen] = useState<'modal' | 'side' | null>(null);
  const [submits, setSubmits] = useState(0);
  const [error, setError] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <Button onClick={() => setOpen('modal')}>Mở hộp thoại</Button>
      <Button variant="secondary" onClick={() => setOpen('side')}>
        Mở bảng bên
      </Button>
      <Card data-testid="card">
        <form
          className="flex flex-col gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setSubmits((count) => count + 1);
          }}
        >
          <Field
            label="Tên thuốc"
            hint="Theo tên trên đơn"
            error={error ? 'Cần kiểm tra tên' : undefined}
            name="medication"
            required
          />
          <Button onClick={() => setError((value) => !value)}>Kiểm tra tên</Button>
          <Button type="submit">Gửi biểu mẫu</Button>
          <Button disabled>Nút bị khóa</Button>
          <Button variant="secondary">Nhãn nút phụ đủ dài để cần xuống nhiều dòng trên màn hình nhỏ</Button>
        </form>
      </Card>
      <output aria-label="Số lần gửi">{submits}</output>
      {open && <FoundationDialog placement={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <Harness />
    </ThemeProvider>
  </StrictMode>,
);
