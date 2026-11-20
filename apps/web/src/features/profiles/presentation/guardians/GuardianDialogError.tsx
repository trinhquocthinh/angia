export function GuardianDialogError({ message }: { message: string }) {
  return (
    <div role="alert" className="profile-guardian-banner">
      <img src="/images/household/stitch/home-warning.svg" width={18} height={18} alt="" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
