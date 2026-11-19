import './arrow-3d.css';

type Props = { direction?: 'right' | 'left'; size?: number };

export function Arrow3d({ direction = 'right', size = 20 }: Props) {
  const diameter = Math.max(20, size);
  return (
    <span
      className="arrow-3d"
      data-direction={direction}
      aria-hidden="true"
      style={{ width: diameter, height: diameter }}
    >
      <svg
        className="arrow-3d-chevron"
        width="55%"
        height="55%"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        focusable="false"
      >
        <path d={direction === 'left' ? 'm15 5-7 7 7 7' : 'm9 5 7 7-7 7'} />
      </svg>
    </span>
  );
}
