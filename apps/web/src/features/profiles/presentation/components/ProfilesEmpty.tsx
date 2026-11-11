import { Link } from '@tanstack/react-router';
import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';

// Gia đình chưa có hồ sơ nào: lời mời tạo hồ sơ đầu tiên, không hiện dữ liệu y tế mẫu.
export function ProfilesEmpty() {
  return (
    <section className="rounded-[20px] bg-surface px-6 py-16 text-center">
      <span aria-hidden="true" className="inline-flex text-accent">
        <AdminIcon name="home_health" size={48} />
      </span>
      <h2 className="auth-heading mt-5 text-2xl text-accent">Tạo hồ sơ đầu tiên cho người bạn chăm</h2>
      <p className="mt-3 text-sm text-text-secondary">
        Một nơi để lưu giữ thông tin sức khỏe của người thân.
      </p>
      <Link
        to="/profiles/new"
        className="inline-flex min-h-[52px] items-center justify-center rounded-xl bg-accent px-5 py-3 text-center text-sm font-semibold text-on-accent cursor-pointer disabled:opacity-55 disabled:cursor-default focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-focus mt-6 inline-flex"
      >
        Tạo hồ sơ
      </Link>
    </section>
  );
}
