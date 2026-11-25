export function navigationItems(personal: boolean) {
  return [
    { id: 'today', label: 'Hôm nay', to: '/', icon: '/icons/mobile-nav-home-3d.svg' },
    {
      id: 'profiles',
      label: personal ? 'Hồ sơ của tôi' : 'Hồ sơ',
      to: personal ? '/my-profile' : '/',
      icon: '/images/household/stitch/family.svg',
    },
    ...(!personal
      ? [
          {
            id: 'documents',
            label: 'Giấy tờ',
            to: '/review',
            icon: '/icons/mobile-nav-pending-3d.svg',
          } as const,
        ]
      : []),
    { id: 'household', label: 'Nhà', to: '/family/home', icon: '/images/household/stitch/create-house.svg' },
  ] as const;
}
