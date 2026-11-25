import { Link } from '@tanstack/react-router';

export function DocumentUploadLink() {
  return (
    <Link
      to="/upload"
      className="mb-6 inline-flex min-h-14 items-center justify-center rounded-xl bg-accent px-6 py-3 text-button-primary font-semibold text-on-accent hover:bg-accent-hover focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus"
    >
      Chụp / chọn ảnh
    </Link>
  );
}
