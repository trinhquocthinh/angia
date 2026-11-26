import { Link } from '@tanstack/react-router';
import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';

export function DocumentUploadLink() {
  return (
    <Link
      to="/upload"
      className="mb-6 inline-flex min-h-btn items-center justify-center gap-2 rounded-2xl bg-accent px-6 py-3 text-button-primary font-semibold text-on-accent shadow-stitch-sm transition-colors hover:bg-accent-hover active:scale-[0.98] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus motion-reduce:transition-none"
    >
      <AdminIcon name="add_a_photo" size={20} />
      Chụp / chọn ảnh
    </Link>
  );
}
