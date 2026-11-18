// Giữ nguyên nét SVG của bản desktop Stitch; mobile dùng đúng tên Material Symbols của bản mobile.
export const loginIcons = {
  lock: {
    symbol: 'verified_user',
    path: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
  },
  user: {
    symbol: 'account_circle',
    path: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  },
  key: {
    symbol: 'key',
    path: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z',
  },
  eye: {
    symbol: 'visibility',
    path: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
  },
  hidden: {
    symbol: 'visibility_off',
    path: 'M3 3l18 18 M9.9 5.2A10.9 10.9 0 0112 5c4.478 0 8.268 2.943 9.542 7a11.1 11.1 0 01-3.2 4.8 M6.2 6.2A11.1 11.1 0 002.458 12C3.732 16.057 7.523 19 12 19a10.9 10.9 0 004.2-.8 M10 10a3 3 0 004 4',
  },
  arrow: { symbol: 'arrow_forward', path: 'M14 5l7 7m0 0l-7 7m7-7H3' },
  medication: {
    symbol: 'medication',
    path: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  },
  heart: { symbol: 'ecg_heart', path: 'M13 10V3L4 14h7v7l9-11h-7z' },
  family: {
    symbol: 'diversity_1',
    path: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
  },
  shield: {
    symbol: 'encrypted',
    path: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  },
} as const;
