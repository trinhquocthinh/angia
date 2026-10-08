import { Link } from '@tanstack/react-router';
export function ReviewDetailHeading({ profileName }: { profileName: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <Link to="/review" className="min-h-11 content-center text-sm font-medium text-[#286958] lg:hidden">
        ← Chờ duyệt
      </Link>
      <h2 className="text-xl font-semibold text-[#004135]">Chứng từ của {profileName}</h2>
    </div>
  );
}
