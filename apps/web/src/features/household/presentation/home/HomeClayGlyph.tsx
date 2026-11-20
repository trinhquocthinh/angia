type HomeGlyphName =
  | 'home-chip'
  | 'home-crown'
  | 'home-send'
  | 'home-clock'
  | 'home-leave-door'
  | 'home-warning'
  | 'home-logout-muted'
  | 'home-logout-danger'
  | 'home-logout-light'
  | 'home-danger-shield'
  | 'home-trash-muted'
  | 'home-trash-light'
  | 'home-close'
  | 'home-delete-shield'
  | 'home-info-trash'
  | 'home-info-clock'
  | 'home-info-user';

export function HomeClayGlyph({ name, size }: { name: HomeGlyphName; size: number }) {
  return (
    <img src={`/images/household/stitch/${name}.svg`} width={size} height={size} alt="" aria-hidden="true" />
  );
}
