import './household-clay-icons.css';

type IconName = 'house' | 'invite' | 'family';

export function HouseholdClayIcon({ name }: { name: IconName }) {
  const size = name === 'family' ? 20 : 44;
  return (
    <span className={`household-clay-icon household-clay-icon-${name}`} aria-hidden="true">
      <img src={`/images/household/clay/${name}.svg`} width={size} height={size} alt="" />
    </span>
  );
}
