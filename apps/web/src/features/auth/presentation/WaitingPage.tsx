import { AuthLayout } from './components/AuthLayout';

export function WaitingPage() {
  return (
    <AuthLayout>
      <div className="flex flex-col gap-4 text-center">
        <h2 className="auth-heading text-xl font-semibold">Chờ vào nhóm gia đình</h2>
        <p className="text-base leading-7 text-text-secondary">
          Tài khoản sẵn sàng. Quản trị viên sẽ sớm thêm bạn vào nhóm gia đình.
        </p>
      </div>
    </AuthLayout>
  );
}
