import { Link } from '@tanstack/react-router';
import type { ReviewItemState } from '../../application/reviewQueuePolling';
import { DocumentIcon } from './DocumentIcon';
import { ReviewItemChip } from './ReviewItemChip';

type ReviewDetailHeadingProps = { profileName: string; state: ReviewItemState };

export function ReviewDetailHeading({ profileName, state }: ReviewDetailHeadingProps) {
  return (
    <div className="flex flex-col gap-1">
      <Link
        to="/review"
        className="group flex min-h-11 items-center gap-1.5 self-start text-sm font-medium text-[#286958] lg:hidden"
      >
        <span className="rotate-180 transition-[translate] duration-200 ease-out group-hover:-translate-x-0.5 motion-reduce:transition-none">
          <DocumentIcon name="arrow" size={16} />
        </span>
        Chờ duyệt
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-['Newsreader',Georgia,serif] text-2xl leading-8 font-semibold tracking-tight text-[#004135]">
          Giấy tờ của {profileName}
        </h2>
        <ReviewItemChip state={state} />
      </div>
    </div>
  );
}
