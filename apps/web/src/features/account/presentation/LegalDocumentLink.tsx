import type { CurrentLegal } from '../application/ports';
export function LegalDocumentLink({
  document,
  label,
}: {
  document: CurrentLegal['terms'] | CurrentLegal['privacy'];
  label: string;
}) {
  const date = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(document.publishedAt));
  return (
    <a
      href={document.url}
      target="_blank"
      rel="noopener noreferrer"
      className="account-link flex min-h-14 items-center justify-between gap-3 border-b border-border py-3 text-lg"
    >
      <span>
        Đọc {label} (bản {date})
      </span>
      <svg
        aria-hidden="true"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="shrink-0"
      >
        <path d="M14 3h7v7m0-7L10 14m1-9H4v15h15v-7" />
      </svg>
    </a>
  );
}
