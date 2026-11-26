export function AuthBrand() {
  return (
    <header className="flex flex-col items-center gap-3 text-center">
      <img src="/logo.webp" alt="" width={72} height={72} className="h-[72px] w-[72px] object-contain" />
      <h1 className="auth-heading text-heading-1 font-medium text-accent">AN GIA</h1>
      <p className="auth-heading text-caption italic text-text-secondary">
        Chăm chút từng thói quen, chở che từng thế hệ.
      </p>
    </header>
  );
}
