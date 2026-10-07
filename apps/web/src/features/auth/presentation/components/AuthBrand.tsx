export function AuthBrand() {
  return (
    <header className="flex flex-col items-center gap-3 text-center">
      <img src="/logo.png" alt="" width={72} height={72} className="h-[72px] w-[72px] object-contain" />
      <h1 className="auth-heading text-[28px] font-medium leading-9 text-accent">AN GIA</h1>
      <p className="auth-heading text-sm italic leading-6 text-text-secondary">
        Chăm chút từng thói quen, chở che từng thế hệ.
      </p>
    </header>
  );
}
