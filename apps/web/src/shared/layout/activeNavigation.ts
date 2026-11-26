// Màn con giữ mục cha được chọn; hai màn ở / phân biệt bằng search.view.
export function activeNavigation(pathname: string, view: unknown) {
  if (pathname === '/') return view === 'profiles' ? 'profiles' : 'today';
  if (pathname === '/upload' || /^\/review(?:\/|$)/.test(pathname)) return 'documents';
  if (/^\/(profiles|my-profile)(?:\/|$)/.test(pathname)) return 'profiles';
  if (/^\/(family|account|notifications)(?:\/|$)/.test(pathname)) return 'household';
  return 'today';
}
