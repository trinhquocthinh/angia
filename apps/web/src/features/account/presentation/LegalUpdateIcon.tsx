import { legalUpdateIcons } from './legalUpdateIcons';

export function LegalUpdateIcon({ name }: { name: keyof typeof legalUpdateIcons }) {
  const icon = legalUpdateIcons[name];
  return (
    <span className={`legal-update-icon legal-update-icon-${name}`} aria-hidden="true">
      <svg
        className="legal-update-icon-desktop"
        width="20"
        height="20"
        viewBox={icon.filled ? '0 0 20 20' : '0 0 24 24'}
        fill={icon.filled ? 'currentColor' : 'none'}
        stroke={icon.filled ? 'none' : 'currentColor'}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={icon.path} fillRule="evenodd" clipRule="evenodd" />
      </svg>
      <span className="legal-update-icon-mobile">{icon.symbol}</span>
    </span>
  );
}
