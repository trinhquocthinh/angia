import type { CurrentLegal } from '../application/ports';
import { LegalUpdateIcon } from './LegalUpdateIcon';

export function LegalUpdateDocumentLink({
  document,
  label,
  icon,
}: {
  document: CurrentLegal['terms'];
  label: string;
  icon: 'document' | 'privacy';
}) {
  const date = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(document.publishedAt));
  return (
    <a
      className="legal-update-document"
      href={document.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Đọc ${label} (bản ${date})`}
    >
      <LegalUpdateIcon name={icon} />
      <span className="legal-update-document-title">
        Đọc {label}
        <span className="legal-update-desktop-date"> (bản {date})</span>
      </span>
      <span className="legal-update-mobile-date">{date}</span>
      <LegalUpdateIcon name="external" />
    </a>
  );
}
